import { useRef, useState } from "react";

import { readAttribution } from "./attribution";
import { Turnstile } from "./turnstile";
import { fill, useT } from "@/i18n";
import { newEventId, track } from "@/lib/tracking";
import { Choice, ChoiceGroup, Field, Select, TextArea, TextInput } from "./fields";
import { submitLeadFn } from "@/data/leads.functions";
import type { LeadIntent, LeadSourceType, LeadTimeline } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section";

/**
 * The one enquiry form the whole site uses.
 *
 * Three steps rather than one long column, because the golden rule is
 * progressive disclosure: ask what someone came to say, then qualify, then take
 * their details. Nobody is asked for a budget before they have said what they
 * want, and the form never blocks — every qualification answer is optional, and
 * only a way to reply is required.
 */

type QualifiedFormProps = {
  /** Which surface this is, so the lead is attributed correctly. */
  sourceType: LeadSourceType;
  /** Which specific form: "service-golden-visa", "listing-enquiry". */
  sourceDetail?: string;
  /** Pre-selects the intent step for a form that already implies one. */
  defaultIntent?: LeadIntent;
  /** Links the enquiry to the listing being viewed. */
  propertyId?: string;
  /** Heading above the form. */
  title?: string;
  /** One line under the heading. */
  description?: string;
  /** Label on the final button. */
  submitLabel?: string;
  /**
   * The heading level the form's title should occupy.
   *
   * Defaults to h3, which is right where the form sits under a section heading.
   * The localised contact page places it directly under the page's h1, and a
   * jump from h1 to h3 is a gap a screen-reader user navigating by heading
   * hears as a missing section.
   */
  headingLevel?: "h2" | "h3";
};

/* Order only. The labels live in the dictionaries, so the same form speaks
 * whichever language the page is in — and the value posted to the server is the
 * enum either way, which is what keeps scoring and routing language-agnostic. */
const INTENTS: readonly LeadIntent[] = ["buy", "invest", "sell", "rent", "relocate", "advice"];

const TIMELINES: readonly LeadTimeline[] = [
  "immediately",
  "within_3_months",
  "within_12_months",
  "researching",
];

/** Budget bands in AED. `null` max means "and above". */
const BUDGETS: ReadonlyArray<{ label: string; min: number; max: number | null }> = [
  { label: "Under AED 1M", min: 0, max: 1_000_000 },
  { label: "AED 1M – 3M", min: 1_000_000, max: 3_000_000 },
  { label: "AED 3M – 7M", min: 3_000_000, max: 7_000_000 },
  { label: "AED 7M – 15M", min: 7_000_000, max: 15_000_000 },
  { label: "AED 15M+", min: 15_000_000, max: null },
];

type Status = "editing" | "submitting" | "sent";

/** Where the reader goes once a report request succeeds. */
function reportPath(token: string): string {
  return `/reports/${token}`;
}

export function QualifiedForm({
  sourceType,
  sourceDetail,
  defaultIntent,
  propertyId,
  title,
  description,
  submitLabel,
  headingLevel: Heading = "h3",
}: QualifiedFormProps) {
  const t = useT();
  const [step, setStep] = useState(0);
  /*
   * Generated once per form, not per submit: the browser fires the pixel with
   * this id and the server sends the Conversions API copy with the same one,
   * which is what makes the platform count one conversion instead of two.
   */
  const eventIdRef = useRef<string>(newEventId());
  const startedRef = useRef(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [status, setStatus] = useState<Status>("editing");
  const [error, setError] = useState<string | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  const [intent, setIntent] = useState<LeadIntent | undefined>(defaultIntent);
  const [timeline, setTimeline] = useState<LeadTimeline | undefined>();
  const [budgetIndex, setBudgetIndex] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [preferredContact, setPreferredContact] = useState("");
  /* Honeypot. Hidden from people, irresistible to bots. */
  const [company, setCompany] = useState("");

  const canSubmit = email.trim().length > 0 || phone.trim().length > 0;

  /** Fires once, the moment someone actually engages rather than on render. */
  function noteStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    track("start_form", { contentName: sourceDetail ?? sourceType });
  }

  /** Advancing a step is the intent signal worth optimising towards. */
  function goToStep(next: number) {
    noteStarted();
    if (next > step) track("complete_form_step", { step: next, contentName: sourceType });
    setStep(next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      setError(t.form.needContact);
      return;
    }

    setStatus("submitting");
    setError(null);

    const budget = budgetIndex === "" ? undefined : BUDGETS[Number(budgetIndex)];

    try {
      const result = await submitLeadFn({
        data: {
          fullName,
          email: email || undefined,
          phone: phone || undefined,
          preferredContact: (preferredContact || undefined) as
            "email" | "phone" | "whatsapp" | undefined,
          intent,
          timeline,
          budgetMin: budget?.min,
          budgetMax: budget?.max ?? undefined,
          budgetCurrency: "AED",
          message: message || undefined,
          sourceType,
          sourceDetail,
          propertyId,
          pagePath: typeof window === "undefined" ? undefined : window.location.pathname,
          company,
          turnstileToken,
          eventId: eventIdRef.current,
          ...readAttribution(),
        },
      });

      /* Only after the server confirmed it. A pixel that fires on click counts
       * conversions that never reached the database. */
      track(sourceType === "market_report" ? "request_report" : "submit_lead", {
        eventId: eventIdRef.current,
        contentName: sourceDetail ?? sourceType,
        currency: "AED",
        ...(budget?.min !== undefined ? { value: budget.min } : {}),
      });

      if (result.reportToken) setReportUrl(reportPath(result.reportToken));
      setStatus("sent");
    } catch (submitError) {
      console.error(submitError);
      setStatus("editing");
      setError(t.form.failed);
    }
  }

  if (status === "sent") {
    return (
      <div className="border border-border p-10">
        <Eyebrow>{reportUrl ? "Your report is ready" : t.form.sentEyebrow}</Eyebrow>
        <Heading className="display-3 mt-6">{reportUrl ? "Here it is." : t.form.sentTitle}</Heading>
        <p className="body-text mt-5 max-w-measure text-muted-foreground">
          {reportUrl
            ? "Open it now, or keep the link — it stays live for thirty days. A consultant will follow up personally in case you would rather talk it through."
            : t.form.sentBody}
        </p>
        {reportUrl ? (
          <a href={reportUrl} className="mt-8 inline-block">
            <Button>Open the report</Button>
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      <div>
        <Eyebrow>{fill(t.form.stepOf, { current: step + 1, total: 3 })}</Eyebrow>
        <Heading className="display-3 mt-5">{title ?? t.form.title}</Heading>
        <p className="body-text mt-4 max-w-measure text-muted-foreground">
          {description ?? t.form.description}
        </p>
      </div>

      {/* Step 1 — what they want. The easiest question first. */}
      {step === 0 ? (
        <div className="flex flex-col gap-8">
          <ChoiceGroup legend={t.form.intentLegend}>
            {INTENTS.map((value) => (
              <Choice
                key={value}
                name="intent"
                value={value}
                checked={intent === value}
                onSelect={(next) => setIntent(next as LeadIntent)}
              >
                {t.form.intents[value]}
              </Choice>
            ))}
          </ChoiceGroup>
          <div className="flex items-center gap-6">
            <Button type="button" onClick={() => goToStep(1)}>
              {t.form.continue}
            </Button>
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="eyebrow link-underline text-muted-foreground"
            >
              {t.form.skipToDetails}
            </button>
          </div>
        </div>
      ) : null}

      {/* Step 2 — qualification. Every answer here is optional. */}
      {step === 1 ? (
        <div className="flex flex-col gap-8">
          <ChoiceGroup legend={t.form.timelineLegend}>
            {TIMELINES.map((value) => (
              <Choice
                key={value}
                name="timeline"
                value={value}
                checked={timeline === value}
                onSelect={(next) => setTimeline(next as LeadTimeline)}
              >
                {t.form.timelines[value]}
              </Choice>
            ))}
          </ChoiceGroup>

          <Field label={t.form.budgetLabel} name="budget" hint={t.form.budgetHint}>
            <Select
              id="budget"
              name="budget"
              value={budgetIndex}
              onChange={(e) => setBudgetIndex(e.target.value)}
            >
              <option value="">{t.form.budgetSkip}</option>
              {BUDGETS.map((band, index) => (
                <option key={band.label} value={index}>
                  {band.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex items-center gap-6">
            <Button type="button" onClick={() => goToStep(2)}>
              {t.form.continue}
            </Button>
            <button
              type="button"
              onClick={() => goToStep(0)}
              className="eyebrow link-underline text-muted-foreground"
            >
              {t.form.back}
            </button>
          </div>
        </div>
      ) : null}

      {/* Step 3 — how to reach them. The only required step. */}
      {step === 2 ? (
        <div className="flex flex-col gap-8">
          <div className="grid gap-8 sm:grid-cols-2">
            <Field label={t.form.nameLabel} name="fullName">
              <TextInput
                id="fullName"
                name="fullName"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </Field>
            <Field label={t.form.emailLabel} name="email">
              <TextInput
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label={t.form.phoneLabel} name="phone" hint={t.form.phoneHint}>
              <TextInput
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label={t.form.contactPreferenceLabel} name="preferredContact">
              <Select
                id="preferredContact"
                name="preferredContact"
                value={preferredContact}
                onChange={(e) => setPreferredContact(e.target.value)}
              >
                <option value="">{t.form.contactPreferences.none}</option>
                <option value="email">{t.form.contactPreferences.email}</option>
                <option value="phone">{t.form.contactPreferences.phone}</option>
                <option value="whatsapp">{t.form.contactPreferences.whatsapp}</option>
              </Select>
            </Field>
          </div>

          <Field label={t.form.messageLabel} name="message">
            <TextArea
              id="message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Field>

          {/* Invisible to almost everyone: the widget only challenges when
              Cloudflare thinks it needs to, and renders nothing at all when no
              site key is configured. */}
          <Turnstile onToken={setTurnstileToken} />

          {/* Honeypot, hidden from people and from screen readers. */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="company">Company</label>
            <input
              id="company"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          {error ? (
            <p role="alert" className="caption text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-6">
            <Button type="submit" disabled={status === "submitting" || !canSubmit}>
              {status === "submitting" ? t.form.submitting : (submitLabel ?? t.form.submit)}
            </Button>
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="eyebrow link-underline text-muted-foreground"
            >
              {t.form.back}
            </button>
          </div>

          <p className="caption max-w-measure">{t.form.privacyNote}</p>
        </div>
      ) : null}
    </form>
  );
}
