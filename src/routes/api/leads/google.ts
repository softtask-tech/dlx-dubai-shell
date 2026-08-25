import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { mapNativeFields } from "@/data/native-forms.server";
import { submitLead } from "@/data/leads.server";

/**
 * Google Lead Form Extensions webhook.
 *
 * Google posts the answers directly, authenticated by a shared key configured
 * alongside the form. Simpler than Meta's two-step and correspondingly more
 * exposed: the key is the only thing between this endpoint and anyone who
 * guesses the URL, so an unset key refuses every request rather than defaulting
 * open.
 *
 * Google also sends a test payload with `is_test: true` when the form is set
 * up. It is acknowledged and not written, a fake lead in the inbox on day one
 * is a bad first impression of the integration.
 */
const requestSchema = z.object({
  lead_id: z.string().min(1).max(200),
  api_version: z.string().optional(),
  form_id: z.union([z.string(), z.number()]).optional(),
  campaign_id: z.union([z.string(), z.number()]).optional(),
  adgroup_id: z.union([z.string(), z.number()]).optional(),
  creative_id: z.union([z.string(), z.number()]).optional(),
  gcl_id: z.string().optional(),
  is_test: z.boolean().optional(),
  google_key: z.string().optional(),
  user_column_data: z
    .array(z.object({ column_name: z.string(), string_value: z.string().optional() }))
    .default([]),
});

export const Route = createFileRoute("/api/leads/google")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["GOOGLE_LEAD_FORM_KEY"];
        if (!key) {
          console.error("[native-forms] GOOGLE_LEAD_FORM_KEY is not set; refusing every request");
          return Response.json({ error: "Not configured" }, { status: 503 });
        }

        let input: z.infer<typeof requestSchema>;
        try {
          input = requestSchema.parse(await request.json());
        } catch {
          return Response.json({ error: "Bad request" }, { status: 400 });
        }

        if (input.google_key !== key) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (input.is_test) {
          return Response.json({ ok: true, test: true, ingested: 0 });
        }

        try {
          const { submission } = mapNativeFields({
            fields: input.user_column_data.map((field) => ({
              name: field.column_name,
              values: field.string_value ? [field.string_value] : [],
            })),
            platform: "google",
            formId: String(input.form_id ?? "unknown"),
            externalLeadId: input.lead_id,
            campaignId: input.campaign_id ? String(input.campaign_id) : null,
            adId: input.creative_id ? String(input.creative_id) : null,
          });

          const result = await submitLead({
            ...submission,
            sourceType: "referral",
            /* The click id is what lets a closed deal be reported back to the
             * campaign that produced it, the whole reason to bother. */
            ...(input.gcl_id ? { gclid: input.gcl_id } : {}),
            qualificationAnswers: {
              ...(submission.qualificationAnswers ?? {}),
              external_lead_id: input.lead_id,
            },
          });

          return Response.json({ ok: true, leadId: result.leadId, ingested: 1 });
        } catch (error) {
          console.error(`[native-forms] could not ingest Google lead ${input.lead_id}`, error);
          /* Google retries on a non-2xx, which is what we want here: unlike
           * Meta's batch delivery this is a single lead, and a retry is a
           * second chance rather than a duplicate. */
          return Response.json({ error: "Could not ingest" }, { status: 500 });
        }
      },
    },
  },
});
