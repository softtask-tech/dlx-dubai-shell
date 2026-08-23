import { isLocalisedPath } from "@/config/locales";
import { site } from "@/config/site";
import { EnglishOnly } from "@/i18n/english-only";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { navLabel } from "@/i18n/nav-labels";
import { useLocale } from "@/i18n";
import { trackContactHref } from "./contact-link";
import { Container, Eyebrow } from "@/components/ui/section";
import { ALL_NAV_LINKS } from "./header";

export function Footer() {
  const { t, code, isTranslated, pathIn } = useLocale();

  return (
    <footer className="border-t border-border bg-background">
      <Container className="py-20 lg:py-28">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="font-display text-3xl tracking-monogram">{site.shortName}</p>
            <p className="lead mt-6 max-w-measure text-foreground/80">{t.footer.tagline}</p>
            <p className="caption mt-8">{t.footer.licence}</p>
          </div>

          <div className="lg:col-span-3">
            <Eyebrow>{t.footer.exploreHeading}</Eyebrow>
            <nav aria-label={t.footer.exploreHeading}>
              <ul className="mt-6 space-y-3">
                {ALL_NAV_LINKS.map((item) => (
                  <li key={item.to}>
                    <a
                      href={pathIn(code, item.to)}
                      className="text-sm text-foreground/70 transition-colors hover:text-accent"
                    >
                      {navLabel(item.to, t, item.label)}
                      {isTranslated && !isLocalisedPath(item.to) ? <EnglishOnly /> : null}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="lg:col-span-2">
            <Eyebrow>{t.footer.contactHeading}</Eyebrow>
            <address className="mt-6 space-y-3 text-sm not-italic text-foreground/70">
              <p>
                {site.address.street}, {site.address.locality}
                <br />
                {site.address.countryName}
              </p>
              <p>
                {/* Phone numbers and email addresses stay left-to-right even in
                    Arabic: a number that reads right-to-left is a number that
                    gets dialled wrong. */}
                <a
                  href={`tel:${site.contact.phoneE164}`}
                  dir="ltr"
                  onClick={() => trackContactHref(`tel:${site.contact.phoneE164}`, "footer")}
                  className="inline-block transition-colors hover:text-accent"
                >
                  {site.contact.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${site.contact.email}`}
                  dir="ltr"
                  className="inline-block transition-colors hover:text-accent"
                >
                  {site.contact.email}
                </a>
              </p>
            </address>
          </div>

          <div className="lg:col-span-3">
            <Eyebrow>Social</Eyebrow>
            <ul className="mt-6 space-y-3 text-sm text-foreground/70">
              {site.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-accent"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>

            <Eyebrow className="mt-10 block">{t.footer.languageHeading}</Eyebrow>
            <LanguageSwitcher layout="list" className="mt-6" />
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
          <p className="eyebrow">
            © {new Date().getFullYear()} {site.name} · {t.footer.rights}
          </p>
          <p className="eyebrow">
            {site.address.street}, {site.address.locality}
          </p>
        </div>
      </Container>
    </footer>
  );
}
