/**
 * Loader resilience.
 *
 * The data pages fetch several things in parallel before they render. Written
 * as a plain `Promise.all`, one dropped connection — a cold worker, a
 * navigation that raced a deploy — failed the whole page, and the visitor saw
 * "this page didn't load" until they refreshed. These two helpers make a
 * hiccup cost a retry, and at worst one empty section, rather than the page.
 */

const RETRY_DELAYS_MS = [150, 500];

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Runs a read, retrying briefly on failure. Throws if every attempt fails. */
export async function retrying<T>(read: () => Promise<T>, label = "read"): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await read();
    } catch (error) {
      lastError = error;
      const delay = RETRY_DELAYS_MS[attempt];
      if (delay === undefined) break;
      console.warn(`[loader] ${label} failed, retrying`, error);
      await pause(delay);
    }
  }
  throw lastError;
}

/**
 * Same, but a read that still fails resolves to `fallback` instead of throwing.
 *
 * Use it for anything a section can render without: the section shows its own
 * "no data" state and the rest of the page is unaffected.
 */
export async function tolerant<T>(
  read: () => Promise<T>,
  fallback: T,
  label = "read",
): Promise<T> {
  try {
    return await retrying(read, label);
  } catch (error) {
    console.error(`[loader] ${label} unavailable, rendering without it`, error);
    return fallback;
  }
}
