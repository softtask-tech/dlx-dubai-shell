/**
 * Where production errors go.
 *
 * The existing reporter (`src/lib/lovable-error-reporting.ts`) talks to the
 * Lovable preview harness, which does not exist on SOFT TASK's server. Without
 * something else, a deployed site swallows every server error into a 500 page
 * and a log line nobody is watching — and the failures that matter most here are
 * exactly the quiet ones: a Resend key that expired, a Supabase policy that
 * started refusing writes, a conversion dispatch returning 400 for a week.
 *
 * So errors are posted to a configurable endpoint rather than to a named
 * vendor. The same reasoning as the Google Ads relay in Phase 6: committing to
 * one provider's SDK for a single POST is a poor trade, and swapping Sentry for
 * a Slack webhook or a log collector should be an environment change rather
 * than a code change.
 *
 * Set `ERROR_WEBHOOK_URL` to anything that accepts a JSON POST.
 *
 * WHAT NEVER LEAVES. The payload carries no lead data, no message body and no
 * contact details — only where the error happened and what it said. An error
 * reporter that helpfully includes the request body is how enquiry contents end
 * up in a third-party log, and this codebase spent a phase making sure that
 * does not happen.
 */

/** Never let reporting an error cause one. */
let consecutiveFailures = 0;
const FAILURE_LIMIT = 5;

export type ErrorContext = {
  /** Where in the app: "route:/properties", "server-fn:submitLead". */
  where: string;
  /** Anything safe and non-personal: a status code, a provider name. */
  detail?: Record<string, string | number | boolean | null>;
};

/**
 * Reports an error, and never throws.
 *
 * Fire-and-forget by design: an enquiry must not fail because a monitoring
 * endpoint is slow. After five consecutive failures it stops trying until the
 * process restarts, so an unreachable collector cannot turn every request into
 * a six-second timeout.
 */
export function reportError(error: unknown, context: ErrorContext): void {
  const endpoint = process.env["ERROR_WEBHOOK_URL"];

  /* Always log locally, whether or not a collector is configured. The server's
   * own log is the last line of defence and costs nothing. */
  console.error(`[${context.where}]`, error, context.detail ?? {});

  if (!endpoint || consecutiveFailures >= FAILURE_LIMIT) return;

  const payload = {
    service: "dlx-properties",
    environment: process.env["NODE_ENV"] ?? "production",
    where: context.where,
    message: error instanceof Error ? error.message : String(error),
    /* The stack is the whole value of a report; it is also the only field that
     * could contain a path from this machine, which is not sensitive. */
    stack: error instanceof Error ? (error.stack ?? "").slice(0, 4000) : undefined,
    detail: context.detail ?? {},
    at: new Date().toISOString(),
  };

  void fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env["ERROR_WEBHOOK_TOKEN"]
        ? { authorization: `Bearer ${process.env["ERROR_WEBHOOK_TOKEN"]}` }
        : {}),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(3000),
  })
    .then((response) => {
      consecutiveFailures = response.ok ? 0 : consecutiveFailures + 1;
    })
    .catch(() => {
      consecutiveFailures += 1;
    });
}
