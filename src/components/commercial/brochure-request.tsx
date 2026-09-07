import { useRef, useState } from "react";

import { readAttribution } from "@/components/forms/attribution";
import { Field, TextInput } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section";
import type { CommercialProject } from "@/data/off-plan";
import { submitLeadFn } from "@/data/leads.functions";
import { newEventId, track } from "@/lib/tracking";

/**
 * The developer's own brochure, handed over in exchange for a way to reply.
 *
 * Progressive disclosure, applied to a document: the page already tells you
 * what the community is, the brochure is the layer for someone who wants the
 * whole thing. Nothing is invented here: the file is the developer's, and the
 * download appears immediately after the details are saved, so the exchange is
 * honest rather than a form that promises an email that never arrives.
 */
export function BrochureRequest({ project }: { project: CommercialProject }) {
  const eventId = useRef(newEventId());
  const [status, setStatus] = useState<"editing" | "submitting" | "ready">("editing");
  const [error, setError] = useState<string | null>(null);

  if (!project.brochureUrl) return null;

  if (status === "ready") {
    return (
      <div className="border border-border bg-secondary p-7" role="status" aria-live="polite">
        <Eyebrow>Brochure ready</Eyebrow>
        <p className="body-text mt-4 text-muted-foreground">
          Here is the developer's brochure for {project.name}. A consultant will also follow up with
          the current release, prices and terms.
        </p>
        <a
          href={project.brochureUrl}
          download
          className="eyebrow link-underline mt-5 inline-block text-accent"
        >
          Download the brochure (PDF)
        </a>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-6 border border-border bg-secondary p-7"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        const email = String(form.get("brochure-email") ?? "").trim();
        if (!email) {
          setError("Add an email address so we can follow up.");
          return;
        }
        setStatus("submitting");
        try {
          await submitLeadFn({
            data: {
              fullName: String(form.get("brochure-name") ?? "") || undefined,
              email,
              phone: String(form.get("brochure-phone") ?? "") || undefined,
              intent: "invest",
              sourceType: "guide_download",
              sourceDetail: `brochure-${project.slug}`,
              qualificationAnswers: {
                project: project.slug,
                developer: project.developerName,
              },
              pagePath: typeof window === "undefined" ? undefined : window.location.pathname,
              eventId: eventId.current,
              ...readAttribution(),
            },
          });
          track("submit_lead", { eventId: eventId.current, contentName: `brochure-${project.slug}` });
          setStatus("ready");
        } catch (submissionError) {
          console.error(submissionError);
          setStatus("editing");
          setError("We could not send that just now. Please try again.");
        }
      }}
    >
      <div>
        <Eyebrow>Developer brochure</Eyebrow>
        <p className="body-text mt-4 text-muted-foreground">
          The full {project.developerName} brochure for {project.name}. Tell us where to reach you
          and it downloads straight away.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Name" name="brochure-name">
          <TextInput id="brochure-name" name="brochure-name" autoComplete="name" />
        </Field>
        <Field label="Email" name="brochure-email">
          <TextInput
            id="brochure-email"
            name="brochure-email"
            type="email"
            required
            autoComplete="email"
          />
        </Field>
        <Field label="Phone (optional)" name="brochure-phone">
          <TextInput id="brochure-phone" name="brochure-phone" type="tel" autoComplete="tel" />
        </Field>
      </div>

      {error ? (
        <p className="caption text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Preparing…" : "Get the brochure"}
        </Button>
      </div>
    </form>
  );
}
