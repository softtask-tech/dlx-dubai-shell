import type { ReactNode } from "react";

import { track } from "@/lib/tracking";
import { cn } from "@/lib/utils";

/**
 * A phone or WhatsApp link that reports itself.
 *
 * On a brokerage site a tap on the phone number is often the conversion — the
 * enquiry never becomes a form, it becomes a call — and a funnel that only
 * counts form submissions will conclude that paid traffic does not convert
 * while the phone rings all afternoon.
 *
 * The tracking is a side effect of the click, not a redirect through a counter:
 * the href is the real `tel:` or `https://wa.me/…`, so the link works normally
 * for anyone who has declined cookies, and copies and opens as they expect.
 */
export function ContactLink({
  kind,
  href,
  children,
  className,
  detail,
}: {
  kind: "call" | "whatsapp";
  href: string;
  children: ReactNode;
  className?: string;
  /** Where on the site this was — a listing, a consultant, the footer. */
  detail?: string;
}) {
  return (
    <a
      href={href}
      {...(kind === "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() =>
        track(kind === "call" ? "call_click" : "whatsapp_click", {
          ...(detail ? { contentName: detail } : {}),
        })
      }
      className={cn(className)}
    >
      {children}
    </a>
  );
}

/**
 * Reports a click on a contact href, whatever markup wraps it.
 *
 * Some contact links live inside layout components with their own anchor, and
 * rewriting those to use `ContactLink` would mean changing a component's shape
 * to satisfy analytics. This lets them keep their markup and add one `onClick`.
 * A href that is neither a call nor a WhatsApp message reports nothing — an
 * email link is not a conversion we bid on.
 */
export function trackContactHref(href: string | undefined, detail?: string): void {
  if (!href) return;
  if (href.startsWith("tel:")) {
    track("call_click", { ...(detail ? { contentName: detail } : {}) });
  } else if (href.includes("wa.me") || href.startsWith("whatsapp:")) {
    track("whatsapp_click", { ...(detail ? { contentName: detail } : {}) });
  }
}
