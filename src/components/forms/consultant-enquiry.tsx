import { useRef, useState } from "react";

import { readAttribution } from "@/components/forms/attribution";
import { Field, TextArea, TextInput } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section";
import { submitLeadFn } from "@/data/leads.functions";
import type { Agent } from "@/data/types";
import { newEventId, track } from "@/lib/tracking";

/**
 * Writing to one named person.
 *
 * The site's promise is that you get a consultant rather than a queue, and a
 * profile page that ends in the general contact form quietly breaks it. This
 * enquiry names the consultant on the submission, so routing hands it to them
 * instead of the round-robin, and the confirmation says who will reply.
 */
export function ConsultantEnquiry({ agent }: { agent: Agent }) {
  const eventId = useRef(newEventId());
  const [status, setStatus] = useState<"editing" | "submitting" | "sent">("editing");
  const [error, setError] = useState<string | null>(null);

  const firstName = agent.full_name.split(/\s+/)[0] ?? agent.full_name;

  if (status === "sent") {
    return (
      <div className="border border-border bg-secondary p-7" role="status" aria-live="polite">
        <Eyebrow>Sent</Eyebrow>
        <p className="body-text mt-4 text-muted-foreground">
          Thank you. {firstName} has your enquiry and will reply personally.
        </p>
      </div>
    );
  }

  return (
    <form
      id="enquire"
      className="flex flex-col gap-6 border border-border bg-secondary p-7"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        const email = String(form.get("consultant-email") ?? "").trim();
        const phone = String(form.get("consultant-phone") ?? "").trim();
        if (!email && !phone) {
          setError("Add an email address or a phone number so we can reply.");
          return;
        }
        setStatus("submitting");
        try {
          await submitLeadFn({
            data: {
              fullName: String(form.get("consultant-name") ?? "") || undefined,
              email: email || undefined,
              phone: phone || undefined,
              message: String(form.get("consultant-message") ?? "") || undefined,
              sourceType: "contact_form",
              sourceDetail: `consultant-${agent.slug}`,
              requestedAgentSlug: agent.slug,
              qualificationAnswers: { requested_consultant: agent.full_name },
              pagePath: typeof window === "undefined" ? undefined : window.location.pathname,
              eventId: eventId.current,
              ...readAttribution(),
            },
          });
          track("submit_lead", {
            eventId: eventId.current,
            contentName: `consultant-${agent.slug}`,
          });
          setStatus("sent");
        } catch (submissionError) {
          console.error(submissionError);
          setStatus("editing");
          setError("We could not send that just now. Please try again.");
        }
      }}
    >
      <div>
        <Eyebrow>Write to {firstName}</Eyebrow>
        <p className="body-text mt-4 text-muted-foreground">
          This reaches {agent.full_name} directly, not a shared inbox.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Name" name="consultant-name">
          <TextInput id="consultant-name" name="consultant-name" autoComplete="name" />
        </Field>
        <Field label="Email" name="consultant-email">
          <TextInput
            id="consultant-email"
            name="consultant-email"
            type="email"
            autoComplete="email"
          />
        </Field>
        <Field label="Phone (optional)" name="consultant-phone">
          <TextInput id="consultant-phone" name="consultant-phone" type="tel" autoComplete="tel" />
        </Field>
      </div>

      <Field label="What can we help with?" name="consultant-message">
        <TextArea id="consultant-message" name="consultant-message" rows={4} />
      </Field>

      {error ? (
        <p className="caption text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending…" : `Send to ${firstName}`}
        </Button>
      </div>
    </form>
  );
}
