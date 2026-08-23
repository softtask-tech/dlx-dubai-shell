import { useRef, useState } from "react";

import { readAttribution } from "./attribution";
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
};

const INTENTS: ReadonlyArray<{ value: LeadIntent; label: string }> = [
  { value: "buy", label: "Buy a home" },
  { value: "invest", label: "Invest" },
  { value: "sell", label: "Sell a property" },
  { value: "rent", label: "Rent" },
  { value: "relocate", label: "Relocate to Dubai" },
  { value: "advice", label: "Just exploring" },
];

const TIMELINES: ReadonlyArray<{ value: LeadTimeline; label: string }> = [
  { value: "immediately", label: "Ready now" },
  { value: "within_3_months", label: "Next 3 months" },
  { value: "within_12_months", label: "This year" },
  { value: "researching", label: "Researching" },
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
  title = "Start a conversation",
  description = "Tell us what you're looking for. A consultant replies personally — usually the same day.",
  submitLabel = "Send enquiry",
}: QualifiedFormProps) {
  const [step, setStep] = useState(0);
  /*
   * Generated once per form, not per submit: the browser fires the pixel with
   * this id and the server sends the Conversions API copy with the same one,
   * which is what makes the platform count one conversion instead of two.
   */
  const eventIdRef = useRef<string>(newEventId());
  const startedRef = useRef(false);
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
      setError("Give us an email address or a phone number so we can reply.");
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
      setError(
        "Something went wrong sending that. Try again, or email us directly and we'll pick it up.",
      );
    }
  }

  if (status === "sent") {
    return (
      <div className="border border-border p-10">
        <Eyebrow>{reportUrl ? "Your report is ready" : "Received"}</Eyebrow>
        <h3 className="display-3 mt-6">
          {reportUrl ? "Here it is." : "Thank you — that's with us."}
        </h3>
        <p className="body-text mt-5 max-w-measure text-muted-foreground">
          {reportUrl
            ? "Open it now, or keep the link — it stays live for thirty days. A consultant will follow up personally in case you would rather talk it through."
            : "A consultant will read this personally and come back to you, usually the same day. A confirmation is on its way to you now."}
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
        <Eyebrow>{`Step ${step + 1} of 3`}</Eyebrow>
        <h3 className="display-3 mt-5">{title}</h3>
        <p className="body-text mt-4 max-w-measure text-muted-foreground">{description}</p>
      </div>

      {/* Step 1 — what they want. The easiest question first. */}
      {step === 0 ? (
        <div className="flex flex-col gap-8">
          <ChoiceGroup legend="What brings you to DLX?">
            {INTENTS.map((option) => (
              <Choice
                key={option.value}
                name="intent"
                value={option.value}
                checked={intent === option.value}
                onSelect={(value) => setIntent(value as LeadIntent)}
              >
                {option.label}
              </Choice>
            ))}
          </ChoiceGroup>
          <div className="flex items-center gap-6">
            <Button type="button" onClick={() => goToStep(1)}>
              Continue
            </Button>
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="eyebrow link-underline text-muted-foreground"
            >
              Skip to contact details
            </button>
          </div>
        </div>
      ) : null}

      {/* Step 2 — qualification. Every answer here is optional. */}
      {step === 1 ? (
        <div className="flex flex-col gap-8">
          <ChoiceGroup legend="When are you looking to move?">
            {TIMELINES.map((option) => (
              <Choice
                key={option.value}
                name="timeline"
                value={option.value}
                checked={timeline === option.value}
                onSelect={(value) => setTimeline(value as LeadTimeline)}
              >
                {option.label}
              </Choice>
            ))}
          </ChoiceGroup>

          <Field
            label="Budget"
            name="budget"
            hint="A rough band is plenty — it helps us send you the right things."
          >
            <Select
              id="budget"
              name="budget"
              value={budgetIndex}
              onChange={(e) => setBudgetIndex(e.target.value)}
            >
              <option value="">Rather not say</option>
              {BUDGETS.map((band, index) => (
                <option key={band.label} value={index}>
                  {band.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex items-center gap-6">
            <Button type="button" onClick={() => goToStep(2)}>
              Continue
            </Button>
            <button
              type="button"
              onClick={() => goToStep(0)}
              className="eyebrow link-underline text-muted-foreground"
            >
              Back
            </button>
          </div>
        </div>
      ) : null}

      {/* Step 3 — how to reach them. The only required step. */}
      {step === 2 ? (
        <div className="flex flex-col gap-8">
          <div className="grid gap-8 sm:grid-cols-2">
            <Field label="Name" name="fullName">
              <TextInput
                id="fullName"
                name="fullName"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </Field>
            <Field label="Email" name="email">
              <TextInput
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Phone" name="phone" hint="Include your country code.">
              <TextInput
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label="Best way to reach you" name="preferredContact">
              <Select
                id="preferredContact"
                name="preferredContact"
                value={preferredContact}
                onChange={(e) => setPreferredContact(e.target.value)}
              >
                <option value="">No preference</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="whatsapp">WhatsApp</option>
              </Select>
            </Field>
          </div>

          <Field label="Anything else we should know?" name="message">
            <TextArea
              id="message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Field>

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
              {status === "submitting" ? "Sending…" : submitLabel}
            </Button>
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="eyebrow link-underline text-muted-foreground"
            >
              Back
            </button>
          </div>

          <p className="caption max-w-measure">
            We use your details to reply to this enquiry and nothing else. No lists, no sharing.
          </p>
        </div>
      ) : null}
    </form>
  );
}
