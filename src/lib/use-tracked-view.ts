import { useEffect, useRef } from "react";

import { track, type EventParams } from "@/lib/tracking";
import type { TrackedEvent } from "@/config/tracking";

/**
 * Reports a view once per mount.
 *
 * The ref guard matters more than it looks: React runs effects twice in
 * development strict mode, and without it every listing would report two views
 *, which is exactly the kind of quiet doubling that makes a funnel look
 * healthier than it is.
 */
export function useTrackedView(
  event: TrackedEvent,
  params: EventParams,
  /** False to stay silent, a hook cannot be called conditionally. */
  enabled = true,
): void {
  const sent = useRef(false);
  /* The params object is rebuilt every render; the identity that matters is
   * what it describes, so the effect keys on the serialised form. */
  const key = JSON.stringify(params);

  useEffect(() => {
    if (!enabled || sent.current) return;
    sent.current = true;
    track(event, JSON.parse(key) as EventParams);
  }, [event, key, enabled]);
}
