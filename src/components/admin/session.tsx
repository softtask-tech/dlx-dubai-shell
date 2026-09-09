/**
 * The verified admin session, shared with every admin page.
 *
 * This deliberately lives outside the route files. Route components are code
 * split, so a context created inside `routes/admin/route.tsx` and read from a
 * child route resolved to two different module instances: the provider held a
 * session and the child saw nothing, and the dashboard died with
 * "called outside the admin shell" on a perfectly valid sign-in. A plain
 * module is loaded once, so there is only ever one context.
 */
import { createContext, useContext } from "react";

export type AdminSession = { accessToken: string; email: string | null };

const AdminSessionContext = createContext<AdminSession | null>(null);

export const AdminSessionProvider = AdminSessionContext.Provider;

/** Reads the verified admin session. Only valid inside the admin shell. */
export function useAdminSession(): AdminSession {
  const session = useContext(AdminSessionContext);
  if (!session) {
    throw new Error("useAdminSession() was called outside the admin shell.");
  }
  return session;
}
