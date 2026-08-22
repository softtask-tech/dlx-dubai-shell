/**
 * Degrading gracefully when the database is not there.
 *
 * The public pages are marketing surfaces. If Supabase is unreachable, the
 * tables have not been migrated yet, or a query is simply wrong, the right
 * outcome is a page that renders its empty state — "the portfolio is being
 * prepared" — not a 500 and an error boundary in front of a prospective client.
 *
 * Two deliberate limits on that:
 *   * only *public list* reads are wrapped. A single-item lookup returning null
 *     becomes a 404, which is correct; and
 *   * nothing in the admin app or the lead pipeline uses this. A failure to
 *     save an enquiry, or a failure to load the inbox, must be loud.
 *
 * Failures are logged with a stable prefix so they are greppable in server
 * logs rather than silently swallowed.
 */

export async function withFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`[data:${context}] falling back to empty result`, error);
    return fallback;
  }
}
