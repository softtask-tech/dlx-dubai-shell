import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { pageHead } from "@/lib/seo";
import { brand } from "@/config/brand";
import { Section, Eyebrow } from "@/components/ui/section";

/**
 * Stopping the nurture emails.
 *
 * One click, no confirmation step, no "are you sure", no survey asking why.
 * Mailbox providers now expect one-click unsubscribe to actually be one click,
 * and more to the point a brand that makes leaving difficult has told you
 * exactly what it thinks of you.
 *
 * The link is signed, so the URL cannot be walked to unsubscribe someone else,
 * and the page says the same thing whether the signature checked out or not,
 * because a different message for a valid lead id would turn this into an
 * oracle for guessing which ids exist.
 */
const unsubscribeFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ lead: z.string().uuid(), sig: z.string().min(16).max(128) }).parse(data),
  )
  .handler(async ({ data }): Promise<{ done: true }> => {
    const secret = process.env["NURTURE_SECRET"] ?? process.env["DLD_SYNC_SECRET"];
    if (!secret) return { done: true };

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data.lead));
    const expected = Array.from(new Uint8Array(signature), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");

    if (expected !== data.sig) return { done: true };

    const { adminDb } = await import("@/data/database.server");
    const supabase = await adminDb();

    /* Marketing consent goes too. Unsubscribing from the sequence and staying
     * on some other list would be a distinction only we can see. */
    const { error } = await supabase
      .from("leads")
      .update({ unsubscribed_at: new Date().toISOString(), marketing_consent: false } as never)
      .eq("id", data.lead);

    if (error) console.error("[unsubscribe] could not record it", error);
    return { done: true };
  });

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (search: Record<string, unknown>) => ({
    lead: typeof search["lead"] === "string" ? search["lead"] : undefined,
    sig: typeof search["sig"] === "string" ? search["sig"] : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    if (deps.lead && deps.sig) {
      /* Acted on during the load, so the click itself unsubscribes, no button
       * to press, which is what one-click has to mean. */
      await unsubscribeFn({ data: { lead: deps.lead, sig: deps.sig } }).catch(() => undefined);
    }
    return {};
  },
  head: () =>
    pageHead({
      path: "/unsubscribe",
      title: "Unsubscribed",
      description: "You will not receive further marketing emails from DLX Properties.",
      tagline: "Done, no further emails.",
      noIndex: true,
    }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  return (
    <Section className="flex min-h-screen items-center pt-44 lg:pt-56">
      <div className="max-w-measure">
        <Eyebrow>Done</Eyebrow>
        <h1 className="display-1 mt-8">No further emails.</h1>
        <p className="body-text mt-8 text-muted-foreground">
          That took effect immediately. If you have an enquiry with us, a consultant can still reply
          to it, this stops the marketing, not a conversation you started.
        </p>
        <p className="body-text mt-6 text-muted-foreground">
          If this was a mistake, or you would like something deleted rather than just stopped, email{" "}
          <a href={`mailto:${brand.contact.email}`} className="prose-link">
            {brand.contact.email}
          </a>
          .
        </p>
      </div>
    </Section>
  );
}
