/**
 * Keeping rubbish out of the inbox.
 *
 * Paid traffic attracts a specific kind of junk — competitors' click farms,
 * form-fill bots harvesting brokerages, and people who type "asdf" to see the
 * gated report. Each costs twice: once in a consultant's afternoon, and again
 * in an ad platform learning to find more of them from the conversion we just
 * reported.
 *
 * FOUR LAYERS, NOT ONE. The honeypot catches naive bots; Turnstile catches most
 * of the rest; validation catches the typos and the deliberate nonsense; the
 * duplicate check catches the same person submitting five times because the
 * button felt slow. None is sufficient alone and all are cheap.
 *
 * NOTHING IS DELETED. A rejected submission is scored and the reasons recorded
 * on the row rather than dropped, so a real client caught by a bad rule can be
 * found and rescued. A spam filter with no appeal is a spam filter that quietly
 * loses business.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { adminDb } from "./database.server";
import type { PaidMediaDatabase } from "./paid-media-types";

export type SpamVerdict = {
  /** 0 clean, 100 certainly junk. */
  score: number;
  reasons: string[];
  /** True when the submission should not become a lead at all. */
  reject: boolean;
};

/**
 * Domains that exist to be thrown away.
 *
 * A short list on purpose. The long lists are maintained badly, go stale, and
 * eventually block a real client's perfectly ordinary provider — which is a
 * worse outcome than accepting a few throwaway addresses.
 */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "getnada.com",
  "maildrop.cc",
  "dispostable.com",
]);

/** Obvious placeholder text, in the languages people actually type it in. */
const JUNK_PATTERNS = [/^(?:test|asdf|qwerty|aaa+|xxx+|abc)$/i, /^[^a-z؀-ۿ]+$/i, /(.)\1{5,}/];

const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/;

export type SpamCheckInput = {
  fullName?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  message?: string | undefined;
  /** The Turnstile token from the widget, when it is configured. */
  turnstileToken?: string | undefined;
  ipAddress?: string | undefined;
  sourceType: string;
};

/* ---------------------------------------------------------- validation --- */

/** Normalises to E.164 digits, or null when it cannot be a phone number. */
export function normalisePhone(phone: string | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  /* Shortest plausible international number is 7 digits after the country
   * code; longest E.164 is 15. Outside that it is not a phone number. */
  if (digits.length < 7 || digits.length > 15) return null;
  /* All-identical digits is a keyboard, not a person. */
  if (/^(\d)\1+$/.test(digits)) return null;
  return digits;
}

export function emailLooksReal(email: string | undefined): boolean {
  if (!email) return false;
  if (!EMAIL_SHAPE.test(email)) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return Boolean(domain) && !DISPOSABLE_DOMAINS.has(domain!);
}

/* ----------------------------------------------------------- turnstile --- */

/**
 * Verifies a Cloudflare Turnstile token.
 *
 * Returns `null` when Turnstile is not configured, which is treated as "no
 * opinion" rather than as a pass or a fail — a deployment without a key should
 * behave exactly as it did before this existed.
 */
export async function verifyTurnstile(
  token: string | undefined,
  ipAddress?: string,
): Promise<boolean | null> {
  const secret = process.env["TURNSTILE_SECRET_KEY"];
  if (!secret) return null;
  if (!token) return false;

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(ipAddress ? { remoteip: ipAddress } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });

    const payload = (await response.json()) as { success?: boolean };
    return payload.success === true;
  } catch (error) {
    /* Cloudflare being unreachable must not close the front door. Treated as
     * no opinion, and the other layers still apply. */
    console.error("[spam] Turnstile verification failed to complete", error);
    return null;
  }
}

/* --------------------------------------------------------- duplicates --- */

/**
 * A stable key for "the same person asking the same thing".
 *
 * Contact details plus source, hashed so the key itself is not a second copy of
 * someone's email address sitting in an index.
 */
export async function dedupeKeyFor(input: {
  email?: string | undefined;
  phone?: string | undefined;
  sourceType: string;
}): Promise<string | null> {
  const identity = input.email?.trim().toLowerCase() ?? normalisePhone(input.phone);
  if (!identity) return null;

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${identity}|${input.sourceType}`),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 40);
}

/** How long the same enquiry is treated as a repeat rather than a new one. */
const DUPLICATE_WINDOW_MS = 6 * 60 * 60 * 1000;

export async function isDuplicate(dedupeKey: string): Promise<boolean> {
  const supabase = (await adminDb()) as unknown as SupabaseClient<PaidMediaDatabase>;
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();

  const { data, error } = await supabase
    .from("leads")
    .select("id")
    .eq("dedupe_key", dedupeKey)
    .gte("created_at", since)
    .limit(1);

  if (error) {
    /* A failed check is not a duplicate. Losing a real enquiry to a database
     * hiccup is the worse error by a wide margin. */
    console.error("[spam] duplicate check failed", error);
    return false;
  }
  return (data ?? []).length > 0;
}

/* ------------------------------------------------------------ verdict --- */

/**
 * Scores a submission.
 *
 * The thresholds are deliberately forgiving. This is a brokerage handling
 * enquiries worth six figures each; the cost of one wrongly rejected client
 * dwarfs the cost of a hundred junk rows a consultant deletes in a minute.
 */
export async function assessSubmission(input: SpamCheckInput): Promise<SpamVerdict> {
  const reasons: string[] = [];
  let score = 0;

  const turnstile = await verifyTurnstile(input.turnstileToken, input.ipAddress);
  if (turnstile === false) {
    score += 70;
    reasons.push("Turnstile rejected the token");
  }

  const hasEmail = Boolean(input.email);
  const hasPhone = Boolean(input.phone);

  if (hasEmail && !emailLooksReal(input.email)) {
    score += 45;
    reasons.push("Email is malformed or disposable");
  }
  if (hasPhone && normalisePhone(input.phone) === null) {
    score += 30;
    reasons.push("Phone number is not a usable number");
  }
  /* Neither usable contact detail is not spam exactly, but it is a lead nobody
   * can act on, and the pipeline refuses it anyway. */
  if (!hasEmail && !hasPhone) {
    score += 60;
    reasons.push("No way to reply");
  }

  const name = input.fullName?.trim();
  if (name && JUNK_PATTERNS.some((pattern) => pattern.test(name))) {
    score += 25;
    reasons.push("Name looks like placeholder text");
  }

  const message = input.message?.trim();
  if (message) {
    if (JUNK_PATTERNS.some((pattern) => pattern.test(message))) {
      score += 20;
      reasons.push("Message looks like placeholder text");
    }
    /* Link-stuffed messages are the classic form-spam payload. Two or more,
     * because one link from a genuine client — a portal listing they saw — is
     * completely ordinary. */
    const links = message.match(/https?:\/\//g)?.length ?? 0;
    if (links >= 2) {
      score += 40;
      reasons.push(`Message contains ${links} links`);
    }
  }

  return { score: Math.min(100, score), reasons, reject: score >= 60 };
}
