import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { checkAdminFn } from "@/data/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/section";

/**
 * The admin shell.
 *
 * Two gates, and both matter. This one is the browser-side gate: no session, no
 * UI. The one that actually protects the data is server-side — every admin
 * server function re-verifies the token and the role before it reads anything,
 * because a determined visitor can always render whatever React they like.
 *
 * The whole area is `noindex`: it is on a public URL and has no business in a
 * search result.
 */
export const Route = createFileRoute("/admin")({
  head: () =>
    pageHead({
      path: "/admin",
      title: "Admin",
      description: "DLX Properties internal administration.",
      tagline: "Internal only.",
      noIndex: true,
    }),
  component: AdminShell,
});

export type AdminSession = { accessToken: string; email: string | null };

/**
 * The verified session, shared with the child routes.
 *
 * Only ever populated after the server has confirmed both the token and the
 * admin role, so a child route can call an admin function without re-checking.
 */
const AdminSessionContext = createContext<AdminSession | null>(null);

/** Reads the verified admin session. Only valid inside the admin shell. */
export function useAdminSession(): AdminSession {
  const session = useContext(AdminSessionContext);
  if (!session) {
    throw new Error("useAdminSession() was called outside the admin shell.");
  }
  return session;
}

const NAV = [
  { to: "/admin", label: "Leads", exact: true },
  { to: "/admin/content", label: "Content", exact: false },
  { to: "/admin/data", label: "Market data", exact: false },
] as const;

function AdminShell() {
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "signed-out" | "denied" | "ready">("checking");
  const [session, setSession] = useState<AdminSession | null>(null);

  const check = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    if (!accessToken) {
      setSession(null);
      setState("signed-out");
      return;
    }

    const result = await checkAdminFn({ data: { accessToken } });
    if (!result.isAdmin) {
      setSession(null);
      setState("denied");
      return;
    }

    setSession({ accessToken, email: result.email });
    setState("ready");
  }, []);

  useEffect(() => {
    void check();
    const { data } = supabase.auth.onAuthStateChange(() => {
      void check();
    });
    return () => data.subscription.unsubscribe();
  }, [check]);

  if (state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="eyebrow">Checking access…</p>
      </div>
    );
  }

  if (state === "signed-out" || state === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-measure text-center">
          <Eyebrow>DLX Admin</Eyebrow>
          <h1 className="display-2 mt-6">
            {state === "denied" ? "This account has no admin access." : "Please sign in."}
          </h1>
          <p className="body-text mt-6 text-muted-foreground">
            {state === "denied"
              ? "Ask an administrator to grant your account the admin role, then sign in again."
              : "The admin area is for the DLX team."}
          </p>
          <div className="mt-10 flex justify-center gap-6">
            <Button asChild>
              <Link to="/admin/login">
                {state === "denied" ? "Sign in as someone else" : "Sign in"}
              </Link>
            </Button>
            {state === "denied" ? (
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  void navigate({ to: "/admin/login" });
                }}
                className="eyebrow link-underline text-muted-foreground"
              >
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <Container className="flex flex-wrap items-center justify-between gap-6 py-6">
          <div className="flex items-baseline gap-8">
            <span className="font-display text-xl tracking-monogram">DLX</span>
            <nav aria-label="Admin" className="flex items-center gap-6">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.exact }}
                  className="eyebrow text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "text-foreground" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <span className="caption">{session?.email}</span>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                void navigate({ to: "/admin/login" });
              }}
              className="eyebrow link-underline text-muted-foreground"
            >
              Sign out
            </button>
          </div>
        </Container>
      </header>

      <main>
        <AdminSessionContext.Provider value={session}>
          <Outlet />
        </AdminSessionContext.Provider>
      </main>
    </div>
  );
}
