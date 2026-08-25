import { useEffect, useState } from "react";

import { anyTagConfigured } from "@/config/tracking";
import { useLocale } from "@/i18n";
import { hasDecided, setConsent } from "@/lib/tracking";
import { Button } from "@/components/ui/button";

/**
 * The consent bar.
 *
 * CLAUDE.md says no popups, and a modal that blocks the page until you agree to
 * be tracked is the least premium thing a website can do. This is a hairline
 * strip in the same register as the rest of the site: it does not cover the
 * content, it does not trap focus, and either answer dismisses it for good.
 *
 * It is also honest about the trade. "Accept" and "Decline" are the same
 * weight (no greyed-out refusal next to a bright accept) because a choice
 * designed to be hard to refuse is not consent, and the audiences this brand
 * courts include people whose law says exactly that.
 *
 * Renders nothing at all when no tag is configured: there is nothing to consent
 * to, so asking would be a lie.
 */
export function ConsentBar({ onDecided }: { onDecided: () => void }) {
  const { t, code, pathIn } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    /* Client-only: the server cannot know what this visitor decided, and
     * rendering the bar in the HTML would flash it at everyone. */
    if (anyTagConfigured() && !hasDecided()) setVisible(true);
  }, []);

  if (!visible) return null;

  function decide(accepted: boolean) {
    setConsent({ analytics: accepted, marketing: accepted });
    setVisible(false);
    onDecided();
  }

  return (
    <div
      role="region"
      aria-label={t.consent.readPolicy}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background"
    >
      <div className="mx-auto flex w-full max-w-shell flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-10 lg:px-16">
        <p className="body-text max-w-measure text-muted-foreground">
          {t.consent.body}{" "}
          <a href={pathIn(code, "/privacy")} className="prose-link">
            {t.consent.readPolicy}
          </a>
        </p>

        <div className="flex shrink-0 items-center gap-3">
          <Button variant="quiet" size="none" onClick={() => decide(false)}>
            {t.consent.decline}
          </Button>
          <Button variant="primary" size="sm" onClick={() => decide(true)}>
            {t.consent.accept}
          </Button>
        </div>
      </div>
    </div>
  );
}
