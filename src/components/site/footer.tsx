import { FOOTER_GROUPS } from "@/config/navigation";
import { site } from "@/config/site";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { useLocale } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/section";
import { Wordmark } from "./wordmark";
import { trackContactHref } from "./contact-link";

export function Footer() {
  const { t, code, pathIn } = useLocale();
  const year = new Date().getFullYear();
  return (
    <footer data-surface="dark">
      <Container className="pt-section pb-28 md:pb-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <p className="display-2 max-w-3xl">{t.footer.closing}</p>
          <a href={pathIn(code, "/contact")} className="shrink-0">
            <Button variant="primary">{t.footer.closingCta}</Button>
          </a>
        </div>
        <div className="mt-14 h-px w-full bg-gold/40" />
        <div className="mt-14 grid gap-x-10 gap-y-14 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Wordmark form="primary" tone="on-dark" className="w-52 sm:w-60" />
            <address className="caption mt-8 not-italic">
              {site.address.street}, {site.address.locality}
              <br />
              {site.address.countryName}
            </address>
            <a
              href={`mailto:${site.contact.email}`}
              dir="ltr"
              className="caption mt-5 inline-block hover:text-foreground"
            >
              {site.contact.email}
            </a>
            <a
              href={`tel:${site.contact.phoneE164}`}
              dir="ltr"
              onClick={() => trackContactHref(`tel:${site.contact.phoneE164}`, "footer")}
              className="caption mt-2 block hover:text-foreground"
            >
              {site.contact.phone}
            </a>
          </div>
          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-8 lg:col-start-5 lg:grid-cols-5">
            {FOOTER_GROUPS.map((group) => (
              <nav key={group.label} aria-label={group.label}>
                <Eyebrow>{group.label}</Eyebrow>
                <ul className="mt-5 space-y-3">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <a
                        href={pathIn(code, item.href)}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-6 border-t border-border pt-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">
              © {year} {site.name}. {t.footer.rights}
            </p>
            <p className="caption mt-3 max-w-2xl text-muted-foreground">
              Regulatory identifiers are shown in the compliance blocks of applicable property
              advertisements, not as promotional branding.
            </p>
          </div>
          <LanguageSwitcher layout="list" />
        </div>
      </Container>
    </footer>
  );
}
