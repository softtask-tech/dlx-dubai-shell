/** Central, testable gate for fictional commercial prototypes. */

const PRODUCTION_HOSTS = new Set(["dlxproperties.com", "www.dlxproperties.com"]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const LOVABLE_PREVIEW_SUFFIXES = [".lovable.app", ".lovableproject.com"] as const;

export function demoFlagEnabled(value: unknown): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === "true";
}

export function normalizeHostname(value: string | null | undefined): string {
  const raw = (value ?? "").trim().toLowerCase().split(",", 1)[0]?.trim() ?? "";
  if (raw.startsWith("[")) return raw.slice(1, raw.indexOf("]"));
  return raw.split(":", 1)[0] ?? "";
}

export function isApprovedDemoHostname(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (!host || PRODUCTION_HOSTS.has(host)) return false;
  return LOCAL_HOSTS.has(host) || LOVABLE_PREVIEW_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

export function canRenderDemoProjects(input: {
  flag: unknown;
  hostname: string | null | undefined;
  forwardedHostname?: string | null | undefined;
}): boolean {
  if (!demoFlagEnabled(input.flag)) return false;

  const host = normalizeHostname(input.hostname);
  const forwardedHost = normalizeHostname(input.forwardedHostname);
  if (PRODUCTION_HOSTS.has(host) || PRODUCTION_HOSTS.has(forwardedHost)) return false;

  return isApprovedDemoHostname(host) || isApprovedDemoHostname(forwardedHost);
}
