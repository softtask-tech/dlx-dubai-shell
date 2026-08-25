/**
 * send-lead-emails, the dual email on every new lead.
 *
 * Invoked with `{ leadId }` by the server function that writes the lead. It
 * reads the row with the service role (leads are unreadable to everyone else),
 * then sends two messages through Resend: a notification to DLX and a branded
 * confirmation to the client.
 *
 * The two sends are independent. If the client confirmation bounces, the
 * brokerage still hears about the lead, and vice versa, the function reports
 * per-email status rather than failing as a unit.
 *
 * Environment:
 *   RESEND_API_KEY, https://resend.com/api-keys
 *   LEAD_FROM_EMAIL, verified sender, e.g. "DLX Properties <hello@dlxproperties.ae>"
 *   LEAD_ADMIN_EMAIL, where notifications land (comma-separated for several)
 * Supabase provides SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY automatically.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  adminNotificationEmail,
  clientConfirmationEmail,
  type BrandInfo,
  type LeadEmailData,
} from "./templates.ts";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

const BRAND: BrandInfo = {
  name: "DLX Properties",
  domain: Deno.env.get("SITE_DOMAIN") ?? "dlxproperties.ae",
  reraOrn: "40905",
  email: Deno.env.get("LEAD_ADMIN_EMAIL")?.split(",")[0]?.trim() ?? "hello@dlxproperties.ae",
  phone: Deno.env.get("BRAND_PHONE") ?? "+971 (0) 000 0000",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SendResult = { ok: boolean; skipped?: boolean; error?: string };

async function sendEmail(
  apiKey: string,
  from: string,
  to: string[],
  subject: string,
  html: string,
  replyTo?: string,
): Promise<SendResult> {
  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!response.ok) {
      return { ok: false, error: `Resend responded ${response.status}: ${await response.text()}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { leadId } = (await request.json()) as { leadId?: string };
    if (!leadId) {
      return Response.json({ error: "leadId is required" }, { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    /* The assigned consultant comes with the lead, because a notification that
     * says who owns it reaches a person rather than a queue, and by the time
     * this runs, routing has already chosen one. */
    const { data, error } = await supabase
      .from("leads")
      .select("*, assigned_agent:agents (id, full_name, email)")
      .eq("id", leadId)
      .single();
    if (error || !data) {
      return Response.json(
        { error: `Lead not found: ${error?.message ?? leadId}` },
        { status: 404, headers: corsHeaders },
      );
    }

    const lead: LeadEmailData = {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      intent: data.intent,
      timeline: data.timeline,
      budgetMin: data.budget_min,
      budgetMax: data.budget_max,
      budgetCurrency: data.budget_currency ?? "AED",
      message: data.message,
      temperature: data.temperature,
      score: data.score,
      sourceType: data.source_type,
      sourceDetail: data.source_detail,
      utmSource: data.utm_source,
      utmMedium: data.utm_medium,
      utmCampaign: data.utm_campaign,
      pagePath: data.page_path,
      createdAt: data.created_at,
      assignedAgentName: data.assigned_agent?.full_name ?? null,
      routingReason: data.routing_reason ?? null,
    };

    const apiKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("LEAD_FROM_EMAIL") ?? `${BRAND.name} <hello@${BRAND.domain}>`;
    const adminRecipients = (Deno.env.get("LEAD_ADMIN_EMAIL") ?? "")
      .split(",")
      .map((address) => address.trim())
      .filter(Boolean);

    /* The consultant who was assigned gets it directly. Deduplicated, because
     * on a small team they are often also on the admin list, and two copies of
     * the same notification teaches people to skim them. */
    const assignedEmail = data.assigned_agent?.email?.trim();
    if (assignedEmail && !adminRecipients.includes(assignedEmail)) {
      adminRecipients.push(assignedEmail);
    }

    /* No key configured yet: log what would have gone out and report it plainly,
     * rather than failing a submission that was otherwise fine. */
    if (!apiKey) {
      console.warn("[send-lead-emails] RESEND_API_KEY is not set, no email sent", { leadId });
      return Response.json(
        { admin: { ok: false, skipped: true }, client: { ok: false, skipped: true } },
        { headers: corsHeaders },
      );
    }

    const adminEmail = adminNotificationEmail(lead, BRAND);
    const clientEmail = clientConfirmationEmail(lead, BRAND);

    const [adminResult, clientResult] = await Promise.all([
      adminRecipients.length > 0
        ? sendEmail(
            apiKey,
            from,
            adminRecipients,
            adminEmail.subject,
            adminEmail.html,
            /* Replying to the notification reaches the client directly. */
            lead.email ?? undefined,
          )
        : Promise.resolve<SendResult>({
            ok: false,
            skipped: true,
            error: "LEAD_ADMIN_EMAIL unset",
          }),
      lead.email
        ? sendEmail(apiKey, from, [lead.email], clientEmail.subject, clientEmail.html)
        : Promise.resolve<SendResult>({ ok: false, skipped: true, error: "Lead left no email" }),
    ]);

    /* Record what actually went out, so the inbox can show an undelivered lead. */
    const now = new Date().toISOString();
    await supabase
      .from("leads")
      .update({
        admin_notified_at: adminResult.ok ? now : null,
        client_confirmed_at: clientResult.ok ? now : null,
      })
      .eq("id", leadId);

    if (!adminResult.ok && !adminResult.skipped) {
      console.error("[send-lead-emails] admin notification failed", adminResult.error);
    }
    if (!clientResult.ok && !clientResult.skipped) {
      console.error("[send-lead-emails] client confirmation failed", clientResult.error);
    }

    return Response.json({ admin: adminResult, client: clientResult }, { headers: corsHeaders });
  } catch (error) {
    console.error("[send-lead-emails]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: corsHeaders },
    );
  }
});
