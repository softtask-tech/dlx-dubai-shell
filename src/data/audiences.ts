/**
 * The retargeting audiences, defined once.
 *
 * Audiences are built inside Ads Manager, not here — but the *rules* that
 * define them depend on events this codebase fires, and the two drift apart the
 * moment they live in different heads. Someone renames an event, the audience
 * silently stops filling, and nobody notices until a campaign has spent a month
 * showing ads to an empty list.
 *
 * So the definitions live in the repository next to the events they rely on,
 * and the admin renders them as the instructions a marketer follows. If an
 * event name here does not exist in `EVENTS`, the compiler says so.
 */
import type { TrackedEvent } from "@/config/tracking";

export type AudienceDefinition = {
  name: string;
  /** Why this audience is worth money — what to say to it, not just who it is. */
  purpose: string;
  /** Events that put someone in. */
  includes: TrackedEvent[];
  /** Events that take them out again. */
  excludes: TrackedEvent[];
  /** Retention window in days. */
  days: number;
  /** Which landing page this audience should generally be sent to. */
  landingPage?: string;
};

export const AUDIENCES: readonly AudienceDefinition[] = [
  {
    name: "Site visitors",
    purpose:
      "The broadest useful pool, for reach campaigns and as a seed for lookalikes. Too broad to sell to directly — most of these people read one guide and left.",
    includes: ["view_listing", "view_area", "use_calculator", "search_listings"],
    excludes: ["submit_lead", "advisor_lead"],
    days: 180,
  },
  {
    name: "Listing viewers",
    purpose:
      "Looked at a specific property and did not enquire. The highest-intent audience the site produces, and the one worth the highest bid. Show the community, not the brand.",
    includes: ["view_listing"],
    excludes: ["submit_lead", "advisor_lead", "call_click"],
    days: 30,
    landingPage: "/lp/dubai-marina-apartments",
  },
  {
    name: "Form abandoners",
    purpose:
      "Started the enquiry and stopped. They were ready; something got in the way. Worth a short, direct reminder rather than a brand message — and a short window, because the moment passes.",
    includes: ["start_form", "complete_form_step"],
    excludes: ["submit_lead", "request_report"],
    days: 14,
  },
  {
    name: "Calculator users",
    purpose:
      "Ran the numbers themselves. Investors, not browsers. Answer the question the calculator raised rather than repeating the offer they already saw.",
    includes: ["use_calculator"],
    excludes: ["submit_lead", "advisor_lead"],
    days: 60,
    landingPage: "/lp/off-plan-payment-plans",
  },
  {
    name: "Golden Visa researchers",
    purpose:
      "Read the visa material. A relocation decision, not a purchase decision — the message is about the route and the adviser, not the property.",
    includes: ["view_area", "use_calculator"],
    excludes: ["submit_lead"],
    days: 90,
    landingPage: "/lp/golden-visa-property",
  },
  {
    name: "Converted — exclude",
    purpose:
      "Everyone who already enquired. Its only job is to be excluded from every prospecting campaign: paying to advertise to someone a consultant is already speaking to wastes the budget and irritates the client.",
    includes: ["submit_lead", "advisor_lead", "request_report", "call_click"],
    excludes: [],
    days: 180,
  },
];
