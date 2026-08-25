/**
 * lead-nurture, the follow-up for leads a consultant is not calling today.
 *
 * Routing hands hot and warm leads to a person immediately. Everything else,
 * cold enquiries, people still researching, would otherwise be filed and
 * forgotten, which on this kind of purchase is the expensive mistake: a Dubai
 * buying decision routinely takes six months, and the brokerage that is still
 * politely present at month five gets the call.
 *
 * WHAT THIS IS NOT. It is not a drip campaign. Four messages, spaced widely,
 * each one a piece of the site that is genuinely useful on its own, a guide, a
 * calculator, the market figures. No "just checking in", no false urgency, no
 * fake scarcity. The brand's whole position is restraint, and a nurture
 * sequence that nags contradicts every other page.
 *
 * WHO IT WILL NOT WRITE TO. Anyone unsubscribed, anyone already assigned to a
 * consultant (they are having a real conversation; an automated email in the
 * middle of it is embarrassing), anyone marked won or lost, and anyone flagged
 * as spam. Consent is checked on the row, not assumed from the fact that they
 * once filled in a form.
 *
 * Environment:
 *   RESEND_API_KEY, LEAD_FROM_EMAIL, as the lead emails use
 *   SITE_URL, for the links and the unsubscribe
 *   NURTURE_SECRET, signs the unsubscribe link
 *   DLD_SYNC_SECRET, the shared scheduler secret
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

/** The sequence. Wide gaps on purpose. This is a six-month decision. */
const STEPS = [
  {
    afterDays: 2,
    subject: "The numbers behind Dubai's communities",
    heading: "Where the numbers say to look",
    body: "You asked about Dubai property recently. Rather than chase you, here is the thing most people want next: what has actually transacted in each community, computed from Dubai Land Department records and updated as new registrations publish.",
    linkLabel: "See the community figures",
    linkPath: "/areas",
  },
  {
    afterDays: 9,
    subject: "What a Dubai purchase actually costs",
    heading: "The whole number, not the sticker price",
    body: "The transfer fee is four per cent and fixed. Agency commission is conventionally two and negotiable. Then there are the trustee, NOC and title charges the brochures leave out. Our calculator shows every one, with its source and the date it was verified, and you can change the ones that vary.",
    linkLabel: "Work out the total cost",
    linkPath: "/tools/buying-costs",
  },
  {
    afterDays: 30,
    subject: "What a property actually returns",
    heading: "Gross yield is not the number that matters",
    body: "Most quoted yields are gross. What is left after the service charge, the management fee and the weeks a property sits empty is usually one to two percentage points lower. This shows both, and lets you set every cost yourself.",
    linkLabel: "Run the yield calculation",
    linkPath: "/tools/rental-yield",
  },
  {
    afterDays: 75,
    subject: "Still thinking about Dubai?",
    heading: "Whenever you are ready",
    body: "This is the last of these unless you ask for more. If it would help to talk it through with someone who will tell you when the numbers do not work, a consultant is a reply away. If not, the guides stay where they are and you are welcome to them.",
    linkLabel: "Read the playbook",
    linkPath: "/guides",
  },
];

/** HMAC-SHA256, hex. The unsubscribe link has to be unguessable. */
async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function emailHtml(step: (typeof STEPS)[number], siteUrl: string, unsubscribeUrl: string): string {
  const link = `${siteUrl}${step.linkPath}`;
  return `<!doctype html><html><body style="margin:0;background:#FFFFFF;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;">
<tr><td align="center" style="padding:48px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="font-family:Georgia,serif;font-size:26px;letter-spacing:0.3em;color:#000000;padding-bottom:40px;">DLX</td></tr>
<tr><td style="font-family:Georgia,serif;font-size:30px;line-height:1.2;color:#000000;padding-bottom:20px;">${escapeHtml(step.heading)}</td></tr>
<tr><td style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#4a4a4a;padding-bottom:32px;">${escapeHtml(step.body)}</td></tr>
<tr><td style="padding-bottom:40px;"><a href="${escapeHtml(link)}" style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#000000;border:1px solid #d8d8d8;padding:14px 28px;text-decoration:none;display:inline-block;">${escapeHtml(step.linkLabel)}</a></td></tr>
<tr><td style="border-top:1px solid #e8e8e8;padding-top:24px;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.7;color:#8A8A8A;">
DLX Properties · RERA ORN 40905 · Business Bay, Dubai<br/>
You are receiving this because you enquired with us.
<a href="${escapeHtml(unsubscribeUrl)}" style="color:#8A8A8A;">Stop these emails</a>. It takes effect immediately.
</td></tr>
</table></td></tr></table></body></html>`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const secret = Deno.env.get("DLD_SYNC_SECRET");
  if (!secret || request.headers.get("x-sync-secret") !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const siteUrl = (Deno.env.get("SITE_URL") ?? "https://dlxproperties.ae").replace(/\/$/, "");
  const nurtureSecret = Deno.env.get("NURTURE_SECRET") ?? secret;
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("LEAD_FROM_EMAIL") ?? "DLX Properties <hello@dlxproperties.ae>";

  /*
   * Only leads nobody is actively working. An automated email landing in the
   * middle of a consultant's conversation is worse than no email at all.
   */
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, email, full_name, nurture_stage, nurture_last_sent_at, created_at, temperature")
    .is("unsubscribed_at", null)
    .is("assigned_agent_id", null)
    .not("email", "is", null)
    .in("status", ["new", "contacted"])
    .in("temperature", ["cold", "warm"])
    .lt("nurture_stage", STEPS.length)
    .order("created_at")
    .limit(200);

  if (error) {
    console.error("[nurture] could not read leads", error);
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }

  const now = Date.now();
  let sent = 0;
  let skipped = 0;

  for (const lead of leads ?? []) {
    const stage = lead.nurture_stage ?? 0;
    const step = STEPS[stage];
    if (!step) continue;

    /* Due when enough time has passed since the last message, or since the
     * enquiry for the first one. */
    const since = new Date(lead.nurture_last_sent_at ?? lead.created_at).getTime();
    const dueAfter =
      stage === 0 ? STEPS[0].afterDays : step.afterDays - (STEPS[stage - 1]?.afterDays ?? 0);
    if (now - since < dueAfter * 24 * 60 * 60 * 1000) {
      skipped += 1;
      continue;
    }

    const signature = await sign(lead.id, nurtureSecret);
    const unsubscribeUrl = `${siteUrl}/unsubscribe?lead=${lead.id}&sig=${signature}`;

    if (!apiKey) {
      console.log(`[nurture] would send step ${stage + 1} to ${lead.email}`);
      skipped += 1;
      continue;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [lead.email],
          subject: step.subject,
          html: emailHtml(step, siteUrl, unsubscribeUrl),
          /* One-click unsubscribe, which mailbox providers increasingly
           * require and which is the right thing regardless. */
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });

      if (!response.ok) {
        console.error(`[nurture] Resend rejected the send for ${lead.id}: ${response.status}`);
        continue;
      }

      await supabase
        .from("leads")
        .update({ nurture_stage: stage + 1, nurture_last_sent_at: new Date().toISOString() })
        .eq("id", lead.id);

      sent += 1;
    } catch (sendError) {
      console.error(`[nurture] send failed for ${lead.id}`, sendError);
    }
  }

  return Response.json(
    { ok: true, considered: leads?.length ?? 0, sent, skipped },
    { headers: corsHeaders },
  );
});
