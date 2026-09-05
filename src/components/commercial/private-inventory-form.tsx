import { useRef, useState } from "react";

import { readAttribution } from "@/components/forms/attribution";
import { Field, Select, TextInput } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section";
import { submitLeadFn } from "@/data/leads.functions";
import { newEventId, track } from "@/lib/tracking";

type CommercialIntent = "buy" | "rent" | "off-plan";

export function PrivateInventoryForm() {
  const eventId = useRef(newEventId());
  const [status, setStatus] = useState<"editing" | "submitting" | "sent">("editing");
  const [error, setError] = useState<string | null>(null);

  if (status === "sent") {
    return (
      <div className="border border-border p-8" role="status" aria-live="polite">
        <Eyebrow>Requirement received</Eyebrow>
        <h2 className="display-3 mt-5">A consultant will review it personally.</h2>
        <p className="body-text mt-4 text-muted-foreground">
          We will only suggest opportunities we can substantiate. No public availability is implied
          by this page.
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-7"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        const commercialIntent = String(form.get("commercial-intent")) as CommercialIntent;
        const email = String(form.get("email") ?? "").trim();
        const phone = String(form.get("phone") ?? "").trim();
        if (!email && !phone) {
          setError("Add an email address or phone number so we can reply.");
          return;
        }
        setStatus("submitting");
        try {
          await submitLeadFn({
            data: {
              fullName: String(form.get("name") ?? "") || undefined,
              email: email || undefined,
              phone: phone || undefined,
              intent:
                commercialIntent === "rent"
                  ? "rent"
                  : commercialIntent === "buy"
                    ? "buy"
                    : "invest",
              timeline: (String(form.get("timeframe") ?? "researching") || "researching") as
                "immediately" | "within_3_months" | "within_12_months" | "researching",
              budgetMin: Number(form.get("budget")) || undefined,
              budgetCurrency: "AED",
              marketingConsent: form.get("consent") === "on",
              sourceType: "contact_form",
              sourceDetail: "off-plan-private-inventory",
              qualificationAnswers: {
                commercial_intent: commercialIntent,
                preferred_community: String(form.get("community") ?? ""),
                language:
                  typeof document === "undefined" ? "en" : document.documentElement.lang || "en",
              },
              pagePath: typeof window === "undefined" ? undefined : window.location.pathname,
              eventId: eventId.current,
              ...readAttribution(),
            },
          });
          track("submit_lead", {
            eventId: eventId.current,
            contentName: "off-plan-private-inventory",
          });
          setStatus("sent");
        } catch (submissionError) {
          console.error(submissionError);
          setStatus("editing");
          setError("We could not save that just now. Please try again.");
        }
      }}
    >
      <div>
        <Eyebrow>Private search</Eyebrow>
        <h2 className="display-3 mt-5">What should we look for?</h2>
        <p className="body-text mt-4 text-muted-foreground">
          No invented catalogue. Give us the brief and we will come back with what can actually be
          evidenced and accessed.
        </p>
      </div>
      <div className="grid gap-7 sm:grid-cols-2">
        <Field label="Intent" name="commercial-intent">
          <Select id="commercial-intent" name="commercial-intent" defaultValue="off-plan">
            <option value="buy">Buy</option>
            <option value="rent">Rent</option>
            <option value="off-plan">Off-plan</option>
          </Select>
        </Field>
        <Field label="Budget" name="budget">
          <Select id="budget" name="budget" defaultValue="">
            <option value="">Prefer not to say</option>
            <option value="1000000">AED 1M+</option>
            <option value="3000000">AED 3M+</option>
            <option value="7000000">AED 7M+</option>
            <option value="15000000">AED 15M+</option>
          </Select>
        </Field>
        <Field label="Preferred community" name="community">
          <TextInput id="community" name="community" placeholder="A community or lifestyle" />
        </Field>
        <Field label="Timeframe" name="timeframe">
          <Select id="timeframe" name="timeframe" defaultValue="researching">
            <option value="immediately">Immediately</option>
            <option value="within_3_months">Within 3 months</option>
            <option value="within_12_months">Within 12 months</option>
            <option value="researching">Researching</option>
          </Select>
        </Field>
        <Field label="Name" name="name">
          <TextInput id="name" name="name" autoComplete="name" />
        </Field>
        <Field label="Email" name="email" {...(error ? { error } : {})}>
          <TextInput id="email" name="email" type="email" autoComplete="email" />
        </Field>
        <Field label="Phone" name="phone">
          <TextInput id="phone" name="phone" type="tel" autoComplete="tel" />
        </Field>
      </div>
      <label className="caption flex items-start gap-3 text-muted-foreground">
        <input type="checkbox" name="consent" className="mt-1 size-4" />I agree to receive relevant
        property updates. This is optional.
      </label>
      <div>
        <Button type="submit" variant="accent" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending…" : "Share my requirement"}
        </Button>
      </div>
    </form>
  );
}
