import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile.
 *
 * Chosen over reCAPTCHA for two reasons that matter to this brand: it does not
 * make people identify traffic lights, and it does not put a Google badge in
 * the corner of every form on a site built to look like a monograph. Most
 * visitors never see anything at all.
 *
 * Renders nothing when unconfigured, and — importantly — a form must still
 * submit when it renders nothing. The server treats an absent token as "no
 * opinion" rather than as a failure, so a missing key degrades to the
 * protection the site had before rather than blocking every enquiry.
 */
declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string | undefined;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function Turnstile({ onToken }: { onToken: (token: string | undefined) => void }) {
  const siteKey = import.meta.env["VITE_TURNSTILE_SITE_KEY"] ?? "";
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let cancelled = false;

    function render() {
      if (cancelled || !window.turnstile || !containerRef.current || widgetRef.current) return;
      widgetRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onToken(token),
        /* An expired token is worse than no token: it will be rejected. Clear
         * it so the form falls back to the other checks rather than failing. */
        "expired-callback": () => onToken(undefined),
        "error-callback": () => {
          setFailed(true);
          onToken(undefined);
        },
        appearance: "interaction-only",
        theme: "light",
      });
    }

    if (window.turnstile) {
      render();
    } else if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = render;
      script.onerror = () => setFailed(true);
      document.head.appendChild(script);
    } else {
      /* Another form on the page is already loading it. */
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          render();
        }
      }, 200);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    return () => {
      cancelled = true;
      if (widgetRef.current) window.turnstile?.remove(widgetRef.current);
      widgetRef.current = undefined;
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;

  return (
    <div>
      <div ref={containerRef} />
      {failed ? (
        <p className="caption text-muted-foreground">
          The spam check could not load. Your enquiry will still reach us.
        </p>
      ) : null}
    </div>
  );
}
