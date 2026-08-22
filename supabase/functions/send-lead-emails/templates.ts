/**
 * Email templates.
 *
 * Same restraint as the site: one serif headline, generous space, the sand
 * accent used once. Written as inline-styled tables because that is the only
 * thing every mail client agrees on — no stylesheet, no flexbox, no grid.
 */

const INK = "#000000";
const PAPER = "#FFFFFF";
const SLATE = "#8A8A8A";
const SAND = "#B08D4C";
const SOFT_SAND = "#EDE6DB";
const BORDER = "#E5E5E5";

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export type LeadEmailData = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  intent: string | null;
  timeline: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetCurrency: string;
  message: string | null;
  temperature: string;
  score: number;
  sourceType: string;
  sourceDetail: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  pagePath: string | null;
  createdAt: string;
};

export type BrandInfo = {
  name: string;
  domain: string;
  reraOrn: string;
  email: string;
  phone: string;
};

/** Escapes text before it goes anywhere near an HTML template. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function humanise(value: string | null): string {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function formatBudget(lead: LeadEmailData): string {
  const format = (amount: number) =>
    `${lead.budgetCurrency} ${new Intl.NumberFormat("en-AE").format(amount)}`;
  if (lead.budgetMin && lead.budgetMax)
    return `${format(lead.budgetMin)} – ${format(lead.budgetMax)}`;
  if (lead.budgetMax) return `Up to ${format(lead.budgetMax)}`;
  if (lead.budgetMin) return `${format(lead.budgetMin)}+`;
  return "Not stated";
}

function shell(inner: string, preheader: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(preheader)}</title></head>
<body style="margin:0;padding:0;background:${SOFT_SAND};">
<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SOFT_SAND};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${PAPER};">
${inner}
</table>
</td></tr></table></body></html>`;
}

function header(): string {
  return `<tr><td style="padding:40px 40px 0 40px;">
<p style="margin:0;font-family:${SERIF};font-size:22px;letter-spacing:8px;color:${INK};">DLX</p>
<div style="height:2px;width:56px;background:${SAND};margin-top:24px;"></div>
</td></tr>`;
}

function footer(brand: BrandInfo): string {
  return `<tr><td style="padding:32px 40px 40px 40px;border-top:1px solid ${BORDER};">
<p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.7;color:${SLATE};">
${escapeHtml(brand.name)} · RERA ORN ${escapeHtml(brand.reraOrn)} · Business Bay, Dubai<br />
<a href="mailto:${escapeHtml(brand.email)}" style="color:${SLATE};">${escapeHtml(brand.email)}</a>
 · <a href="https://${escapeHtml(brand.domain)}" style="color:${SLATE};">${escapeHtml(brand.domain)}</a>
</p></td></tr>`;
}

/** What the consultant on duty sees: the facts, ranked, nothing decorative. */
export function adminNotificationEmail(lead: LeadEmailData, brand: BrandInfo) {
  const rows: Array<[string, string]> = [
    ["Name", lead.fullName ?? "—"],
    ["Email", lead.email ?? "—"],
    ["Phone", lead.phone ?? "—"],
    ["Looking to", humanise(lead.intent)],
    ["Timeline", humanise(lead.timeline)],
    ["Budget", formatBudget(lead)],
    ["Source", `${humanise(lead.sourceType)}${lead.sourceDetail ? ` · ${lead.sourceDetail}` : ""}`],
    ["Page", lead.pagePath ?? "—"],
    [
      "Campaign",
      [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" / ") || "Direct",
    ],
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) => `<tr>
<td style="padding:10px 0;font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${SLATE};width:150px;vertical-align:top;">${escapeHtml(label)}</td>
<td style="padding:10px 0;font-family:${SANS};font-size:15px;color:${INK};">${escapeHtml(value)}</td>
</tr>`,
    )
    .join("");

  const temperature = lead.temperature.toUpperCase();
  const inner = `${header()}
<tr><td style="padding:32px 40px 0 40px;">
<p style="margin:0;font-family:${SANS};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${SAND};">${escapeHtml(temperature)} · Score ${lead.score}</p>
<h1 style="margin:16px 0 0 0;font-family:${SERIF};font-size:32px;font-weight:normal;line-height:1.2;color:${INK};">New enquiry${lead.fullName ? ` from ${escapeHtml(lead.fullName)}` : ""}</h1>
</td></tr>
<tr><td style="padding:28px 40px 0 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
</td></tr>
${
  lead.message
    ? `<tr><td style="padding:28px 40px 0 40px;">
<p style="margin:0 0 8px 0;font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${SLATE};">Their message</p>
<p style="margin:0;padding:20px;background:${SOFT_SAND};font-family:${SANS};font-size:15px;line-height:1.7;color:${INK};">${escapeHtml(lead.message)}</p>
</td></tr>`
    : ""
}
<tr><td style="padding:32px 40px 40px 40px;">
<a href="https://${escapeHtml(brand.domain)}/admin/leads/${escapeHtml(lead.id)}"
 style="display:inline-block;padding:14px 28px;border:1px solid ${INK};font-family:${SANS};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${INK};text-decoration:none;">Open in the inbox</a>
</td></tr>
${footer(brand)}`;

  return {
    subject: `${temperature} lead · ${lead.fullName ?? lead.email ?? lead.phone ?? "New enquiry"}`,
    html: shell(inner, `New ${lead.temperature} enquiry, score ${lead.score}`),
  };
}

/** What the client receives: warm, brief, and honest about what happens next. */
export function clientConfirmationEmail(lead: LeadEmailData, brand: BrandInfo) {
  const firstName = lead.fullName?.trim().split(/\s+/)[0];
  const inner = `${header()}
<tr><td style="padding:32px 40px 0 40px;">
<h1 style="margin:0;font-family:${SERIF};font-size:34px;font-weight:normal;line-height:1.15;color:${INK};">Thank you${firstName ? `, ${escapeHtml(firstName)}` : ""}.</h1>
<p style="margin:24px 0 0 0;font-family:${SANS};font-size:16px;line-height:1.75;color:${INK};">
We have your enquiry. A consultant will read it personally and come back to you — usually the same day, and always within one working day.
</p>
<p style="margin:20px 0 0 0;font-family:${SANS};font-size:16px;line-height:1.75;color:${SLATE};">
In the meantime, there is nothing you need to do. If anything changes or you would rather speak sooner, reply to this email or call us directly.
</p>
</td></tr>
${
  lead.message
    ? `<tr><td style="padding:28px 40px 0 40px;">
<p style="margin:0 0 8px 0;font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${SLATE};">What you told us</p>
<p style="margin:0;padding:20px;background:${SOFT_SAND};font-family:${SANS};font-size:15px;line-height:1.7;color:${INK};">${escapeHtml(lead.message)}</p>
</td></tr>`
    : ""
}
<tr><td style="padding:32px 40px 40px 40px;">
<p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.8;color:${INK};">
<a href="tel:${escapeHtml(brand.phone)}" style="color:${INK};">${escapeHtml(brand.phone)}</a><br />
<a href="mailto:${escapeHtml(brand.email)}" style="color:${INK};">${escapeHtml(brand.email)}</a>
</p>
</td></tr>
${footer(brand)}`;

  return {
    subject: `We have your enquiry — ${brand.name}`,
    html: shell(inner, "A consultant will come back to you, usually the same day."),
  };
}
