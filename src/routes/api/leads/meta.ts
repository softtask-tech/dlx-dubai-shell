import { createFileRoute } from "@tanstack/react-router";

import { fetchMetaLead, mapNativeFields, verifyMetaSignature } from "@/data/native-forms.server";
import { submitLead } from "@/data/leads.server";

/**
 * Meta Instant Forms webhook.
 *
 * GET is Meta's subscription handshake: they call once with a verify token and
 * expect the challenge echoed back verbatim.
 *
 * POST carries only a leadgen id, never the answers, so the endpoint fetches
 * them from the Graph API with a page token. That is Meta's design and it is a
 * good one: a stolen webhook payload is worth nothing without the token.
 *
 * Always answers 200. A webhook that returns an error gets retried, then
 * eventually gets the subscription disabled, so a lead this endpoint could not
 * process is logged loudly and acknowledged, rather than taking the whole
 * integration down with it.
 */
export const Route = createFileRoute("/api/leads/meta")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        const verifyToken = process.env["META_WEBHOOK_VERIFY_TOKEN"];

        if (
          url.searchParams.get("hub.mode") === "subscribe" &&
          verifyToken &&
          url.searchParams.get("hub.verify_token") === verifyToken
        ) {
          return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
      },

      POST: async ({ request }) => {
        /* The raw body, because the signature is over these exact bytes. */
        const raw = await request.text();

        if (!(await verifyMetaSignature(raw, request.headers.get("x-hub-signature-256")))) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: {
          entry?: Array<{ changes?: Array<{ value?: { leadgen_id?: string; form_id?: string } }> }>;
        };
        try {
          payload = JSON.parse(raw);
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const leadgenIds = (payload.entry ?? [])
          .flatMap((entry) => entry.changes ?? [])
          .map((change) => change.value?.leadgen_id)
          .filter((id): id is string => Boolean(id));

        let ingested = 0;

        for (const leadgenId of leadgenIds) {
          try {
            const lead = await fetchMetaLead(leadgenId);
            if (!lead) continue;

            const { submission } = mapNativeFields({
              fields: lead.fields,
              platform: "meta",
              formId: lead.formId,
              externalLeadId: leadgenId,
              campaignId: lead.campaignId ?? null,
              adId: lead.adId ?? null,
            });

            /* Same pipeline as a website form: scored, routed, emailed. The
             * channel changes the attribution and nothing else. */
            await submitLead({
              ...submission,
              sourceType: "referral",
              qualificationAnswers: {
                ...(submission.qualificationAnswers ?? {}),
                external_lead_id: leadgenId,
              },
            });
            ingested += 1;
          } catch (error) {
            /* Loudly, and then carry on: one unmappable lead must not cost the
             * others in the same delivery. */
            console.error(`[native-forms] could not ingest Meta lead ${leadgenId}`, error);
          }
        }

        return Response.json({ received: leadgenIds.length, ingested });
      },
    },
  },
});
