import { FOOTER_GROUPS } from "@/config/navigation";
import { site } from "@/config/site";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { useLocale } from "@/i18n";
import { Container, Eyebrow } from "@/components/ui/section";
import { Wordmark } from "./wordmark";
import { Emphasise } from "./emphasis";
import { trackContactHref } from "./contact-link";

/**
 * The closing anchor.
 *
 * The second and last green inversion on a page, and the only one that carries
 * an invitation. It used to be built from tiles, which put four bordered cards
 * in a row across the bottom of every page and made the foot of the site the
 * busiest thing on it. There are no cards here now: hairlines and space do the
 * separating, which is the same rule the rest of the system follows.
 *
 * The bottom padding is asymmetric on purpose. On a phone the contact bar is
 * fixed over the foot of the page, so the legal line needs room to clear it.
 */
export function Footer() {
  const { t, code, pathIn } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer data-surface="dark" className="border-t border-border">
      <Container className="pt-section pb-14">
        {/* The invitation. One sentence, set large, with nothing beside it. */}
        <div className="max-w-4xl">
          <h2 className="display-2 text-balance">
            <Emphasise text={t.footer.closing} />
          </h2>
          <a
            href={pathIn(code, "/contact")}
            className="focus-ring eyebrow mt-10 inline-flex min-h-12 items-center bg-gold px-7 text-ink transition-colors hover:bg-gold-soft"
          >
            {t.footer.closingCta}
          </a>
        </div>

        <div className="mt-20 grid gap-12 border-t border-border pt-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <Wordmark form="primary" tone="on-dark" className="w-44 sm:w-52" />
            <address className="caption mt-8 text-on-dark-muted not-italic">
              {site.address.street}, {site.address.locality}
              <br />
              {site.address.countryName}
            </address>
            <a
              href={`mailto:${site.contact.email}`}
              dir="ltr"
              className="caption mt-5 inline-block transition-colors hover:text-gold"
            >
              {site.contact.email}
            </a>
            <a
              href={`tel:${site.contact.phoneE164}`}
              dir="ltr"
              onClick={() => trackContactHref(`tel:${site.contact.phoneE164}`, "footer")}
              className="caption mt-2 block transition-colors hover:text-gold"
            >
              {site.contact.phone}
            </a>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4">
            {FOOTER_GROUPS.map((group) => (
              <nav key={group.label} aria-label={group.label}>
                <Eyebrow className="text-gold">{group.label}</Eyebrow>
                <ul className="mt-5 space-y-3">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <a
                        href={pathIn(code, item.href)}
                        className="focus-ring inline-flex min-h-9 items-center text-sm text-on-dark-muted transition-colors hover:text-on-dark"
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

      </Container>

      {/*
       * A base, so the footer is not one flat slab.
       *
       * It ran as a single green block from the invitation all the way to the
       * copyright, which on a desktop is a very tall piece of one colour with
       * three unrelated jobs inside it: a closing invitation, a site index and
       * a compliance line. A hairline is not enough separation for that.
       *
       * The legal bar now sits on its own deeper ground, full width rather
       * than inside the container, which is what makes it read as the base of
       * the page instead of a fourth column. The invitation keeps the green
       * and the gold, because that is the part meant to be warm.
       */}
      <div className="border-t border-white/10 bg-[color-mix(in_srgb,var(--ink)_70%,var(--green))]">
        <Container className="flex flex-col gap-6 pb-28 pt-8 md:flex-row md:items-center md:justify-between md:pb-8">
          <div>
            <p className="eyebrow">
              © {year} {site.name}. {t.footer.rights}
            </p>
            {/*
             * The compliance line. These identifiers are what make the claim
             * "RERA-registered brokerage" checkable rather than decorative,
             * which is the whole argument this site makes, so they are stated
             * plainly here rather than only inside individual advertisements.
             */}
            <p className="caption mt-3 text-on-dark-muted">
              RERA ORN {site.reraOrn} · Trade licence {site.tradeLicence}
            </p>
          </div>
          <LanguageSwitcher layout="list" />
        </Container>
      </div>
    </footer>
  );
}
