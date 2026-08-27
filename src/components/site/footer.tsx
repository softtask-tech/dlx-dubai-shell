import { isLocalisedPath } from "@/config/locales";
import { site } from "@/config/site";
import { EnglishOnly } from "@/i18n/english-only";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { navLabel } from "@/i18n/nav-labels";
import { useLocale } from "@/i18n";
import { trackContactHref } from "./contact-link";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/section";
import { Wordmark } from "./wordmark";
import { ALL_NAV_LINKS } from "./header";

/**
 * The footer, as the page's dark anchor.
 *
 * Every page ends on deep green-black. That is the composition doing a job:
 * the reader has come to the bottom of a long white page and the ground closes
 * under them, which is the difference between a page that ends and a page that
 * runs out. It is also where the brand says its own line, at display scale,
 * once, and then gets out of the way.
 *
 * `data-surface="dark"` re-points the semantic tokens, so everything nested
 * here, including the language switcher, picks up the right palette without
 * knowing where it is.
 */
export function Footer() {
  const { t, code, isTranslated, pathIn } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer data-surface="dark">
      <Container className="pt-section pb-14">
        {/*
         * The closing invitation.
         *
         * An invitation rather than the tagline: the tagline is the hero's
         * line, and a page that says the same sentence at the top and the
         * bottom has not closed, it has looped. This is the one thing the
         * reader is being asked to do, said once, at display scale, on every
         * page of the site.
         */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <p className="display-2 max-w-3xl">{t.footer.closing}</p>
          {/* No tracking hook here: `trackContactHref` reports calls and
              WhatsApp taps, and a link to the contact page is neither. The
              page view and the form submission are what count this one. */}
          <a href={pathIn(code, "/contact")} className="shrink-0">
            <Button variant="primary">{t.footer.closingCta}</Button>
          </a>
        </div>

        {/* The gold, used the one way it is allowed to be used: a hairline.
            It reads as a mark of finish rather than as a colour. */}
        <div className="mt-14 h-px w-full bg-gold/40" />

        <div className="mt-14 grid gap-x-10 gap-y-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            {/* Sized by width, not height: the lockup's wordmark line is a small
                fraction of the artwork, and this is the one place on the site
                with room to set it large enough to actually read. */}
            <Wordmark form="primary" tone="on-dark" className="w-52 sm:w-60" />
            <p className="caption mt-8">{t.footer.licence}</p>
            <address className="caption mt-2 not-italic">
              {site.address.street}, {site.address.locality}
              <br />
              {site.address.countryName}
            </address>
          </div>

          <div className="lg:col-span-3 lg:col-start-6">
            <Eyebrow>{t.footer.exploreHeading}</Eyebrow>
            <nav aria-label={t.footer.exploreHeading}>
              <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3">
                {ALL_NAV_LINKS.map((item) => (
                  <li key={item.to}>
                    <a
                      href={pathIn(code, item.to)}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>
                {/* Phone numbers and email addresses stay left-to-right even in
                    Arabic: a number that reads right-to-left is a number that
                    gets dialled wrong. */}
                <a
                  href={`tel:${site.contact.phoneE164}`}
                  dir="ltr"
                  onClick={() => trackContactHref(`tel:${site.contact.phoneE164}`, "footer")}
                  className="inline-block whitespace-nowrap transition-colors hover:text-foreground"
                >
                  {site.contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.contact.email}`}
                  dir="ltr"
                  className="inline-block transition-colors hover:text-foreground"
                >
                  {site.contact.email}
                </a>
              </li>
            </ul>

            {/* No label above the social links. Three platform names in a
                column are already self-describing, and a fourth uppercase
                heading down here would be furniture. */}
            <nav aria-label="Social" className="mt-8">
              <ul className="space-y-3 text-sm text-muted-foreground">
                {site.socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-foreground"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="lg:col-span-2 lg:col-start-11">
            {/* The switcher carries its own accessible label, so the heading
                here would be a second one saying the same thing. */}
            <LanguageSwitcher layout="list" />
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-border pt-8 text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p className="eyebrow">
            © {year} {site.name}. {t.footer.rights}
          </p>
          <a
            href={pathIn(code, "/privacy")}
            className="eyebrow link-underline transition-colors hover:text-foreground"
          >
            {navLabel("/privacy", t, "Privacy")}
          </a>
        </div>
      </Container>
    </footer>
  );
}
