import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/forms/fields";
import { Eyebrow } from "@/components/ui/section";

type DemoStatus = "editing" | "sent";

/** A deliberately local form: validation and state only, with no transport. */
export function DemoEnquiryForm({ projectName }: { projectName: string }) {
  const [status, setStatus] = useState<DemoStatus>("editing");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (status === "sent") {
    return (
      <div className="border border-accent bg-accent-soft p-8" role="status" aria-live="polite">
        <Eyebrow>Concept preview</Eyebrow>
        <h3 className="display-3 mt-5">Preview only — no enquiry was submitted.</h3>
        <p className="body-text mt-4 max-w-measure text-muted-foreground">
          This demonstrates the finished confirmation experience. No lead, CRM event, email,
          consultant assignment, analytics conversion or advertising event was created.
        </p>
        <Button className="mt-7" variant="quiet" onClick={() => setStatus("editing")}>
          Return to the preview form
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-7"
      onSubmit={(event) => {
        event.preventDefault();
        if (!email.trim() && !phone.trim()) {
          setError("Add an email address or phone number to preview the confirmation.");
          return;
        }
        setError(null);
        setStatus("sent");
      }}
    >
      <div>
        <Eyebrow>Interactive prototype</Eyebrow>
        <h3 className="display-3 mt-5">Preview an enquiry about {projectName}</h3>
        <p className="body-text mt-4 text-muted-foreground">
          Concept preview only. The information below stays in this page and is discarded.
        </p>
      </div>
      <Field label="What would you ask for?" name="demo-request">
        <Select id="demo-request" name="demo-request" defaultValue="availability">
          <option value="availability">Prices and availability</option>
          <option value="brochure">Brochure</option>
          <option value="payment-plan">Payment plan</option>
          <option value="consultation">Consultation</option>
        </Select>
      </Field>
      <div className="grid gap-7 sm:grid-cols-2">
        <Field label="Name" name="demo-name">
          <TextInput id="demo-name" name="demo-name" autoComplete="name" />
        </Field>
        <Field label="Email" name="demo-email" {...(error ? { error } : {})}>
          <TextInput
            id="demo-email"
            name="demo-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
      </div>
      <Field label="Phone" name="demo-phone" hint="Used only to preview validation; not sent.">
        <TextInput
          id="demo-phone"
          name="demo-phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </Field>
      <Field label="Question" name="demo-message">
        <TextArea id="demo-message" name="demo-message" />
      </Field>
      <div>
        <Button type="submit" variant="accent">
          Preview confirmation
        </Button>
        <p className="caption mt-4">No submission leaves this page.</p>
      </div>
    </form>
  );
}
