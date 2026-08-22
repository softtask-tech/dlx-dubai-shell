import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";
import { Field, TextInput } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section";

/**
 * Admin sign-in.
 *
 * Email and password against Supabase Auth. There is no sign-up: accounts are
 * created by an administrator, and the admin role is granted in the database —
 * so nobody can register their way into the pipeline.
 */
export const Route = createFileRoute("/admin/login")({
  head: () =>
    pageHead({
      path: "/admin/login",
      title: "Admin sign-in",
      description: "DLX Properties internal administration.",
      tagline: "Internal only.",
      noIndex: true,
    }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (signInError) {
      /* Deliberately vague: which half was wrong is not the visitor's business. */
      setError("That email and password did not match an account.");
      return;
    }

    void navigate({ to: "/admin" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <Eyebrow>DLX Admin</Eyebrow>
        <h1 className="display-2 mt-6">Sign in</h1>

        <div className="mt-10 flex flex-col gap-8">
          <Field label="Email" name="email" required>
            <TextInput
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label="Password" name="password" required>
            <TextInput
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          {error ? (
            <p role="alert" className="caption text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
}
