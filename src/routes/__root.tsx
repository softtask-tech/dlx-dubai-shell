import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { DEFAULT_LOCALE, localeFor, splitLocale } from "@/config/locales";
import { LocaleProvider, useT } from "@/i18n";
import { site } from "@/config/site";
import { captureAttribution } from "@/components/forms/attribution";
import { CurrencyProvider } from "@/components/tools/currency-context";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import { fontLinks } from "@/lib/fonts";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { AdvisorDock } from "@/components/advisor/advisor-dock";
import { ConsentBar } from "@/components/site/consent-bar";
import { advisorAvailabilityFn } from "@/data/advisor.functions";
import { hasDecided, initTracking, trackPageView } from "@/lib/tracking";
import { CustomCursor } from "@/components/site/cursor";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-measure text-center">
        <Eyebrow>Error 404</Eyebrow>
        <h1 className="display-2 mt-6">This page isn't here.</h1>
        <p className="body-text mt-6 text-muted-foreground">
          It may have moved, or the address may be slightly off. The portfolio and our guides are
          both a click away.
        </p>
        <div className="mt-10 flex justify-center">
          <Button asChild>
            <Link to="/">Return home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-measure text-center">
        <Eyebrow>Something went wrong</Eyebrow>
        <h1 className="display-2 mt-6">This page didn't load.</h1>
        <p className="body-text mt-6 text-muted-foreground">
          The fault is on our side, not yours. Try again in a moment, or head back to the homepage.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-6">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          <Button variant="ghost" asChild>
            <a href="/">Return home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  /* Server-rendered once per page load rather than fetched by the dock, so the
   * advisor is either there from the first paint or not there at all — no rail
   * appearing a second late, and no request on every navigation. */
  loader: async () => ({ advisorAvailability: await advisorAvailabilityFn() }),
  head: () => {
    /*
     * Root-level head. Every page overrides title, description, canonical, OG
     * and Twitter tags via its own pageHead() call — these are the shell
     * defaults plus the site-wide identity schema, emitted once.
     */
    const shell = pageHead({
      path: "/",
      schema: [organizationSchema(), websiteSchema()],
    });

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "author", content: site.name },
        ...shell.meta,
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", type: "image/png", href: "/favicon.png" },
        /* The Latin pair, on every page in every language — see src/lib/fonts.ts
         * for why a translated page still needs it. The script fonts are added
         * by the $lang layout, so English loads nothing extra. */
        ...fontLinks(DEFAULT_LOCALE),
      ],
      scripts: shell.scripts,
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  /*
   * `lang` and `dir` come from the URL, on the server, in the first byte of
   * HTML.
   *
   * Setting them from an effect after hydration would mean Arabic laid out
   * left-to-right for the length of a paint — the flash of wrong direction that
   * makes an RTL site feel like an afterthought. It would also lie to a
   * screen reader and to a translation service, both of which read the
   * attribute and neither of which waits for React.
   */
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { code } = splitLocale(pathname);
  const locale = localeFor(code) ?? localeFor(DEFAULT_LOCALE)!;

  return (
    <html lang={locale.htmlLang} dir={locale.dir}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { advisorAvailability } = Route.useLoaderData();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  /*
   * Campaign pages render their own masthead and footer. Every link out of a
   * landing page is a way to lose someone who arrived ready to act, so the
   * site's navigation is deliberately absent from them.
   */
  const isCampaignPage = pathname.startsWith("/lp/");

  /* The URL is the single source of truth for language — see the note in
   * src/i18n/index.tsx on why nothing is remembered here. */
  const { code: locale } = splitLocale(pathname);

  /* Consent lives in the browser, so the first render cannot know it. Tracking
   * the answer in state is what lets the advisor rail wait its turn rather than
   * stacking on top of the consent bar. */
  const [consentDecided, setConsentDecided] = useState(true);

  /* Record the campaign that brought this visit in, before the visitor
   * navigates away from the landing URL and the tags are lost. This runs
   * whatever they decide about cookies: attribution is stored in their own
   * session and only ever leaves the browser attached to an enquiry they chose
   * to send. */
  useEffect(() => {
    captureAttribution();
    initTracking();
    setConsentDecided(hasDecided());
  }, []);

  /* A single-page app navigates without a document load, so page views after
   * the first have to be reported by hand or the funnel starts at the landing
   * page and never moves. */
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  /*
   * The page turn.
   *
   * CLAUDE.md asks for transitions "like turning a page in a monograph", and
   * the important word is *turning*: the new page settles in, it does not blink.
   *
   * The one rule this must not break is the one the hero taught us. The first
   * render is never animated — `navigated` is false until the reader has
   * actually gone somewhere, so the landing page paints at full opacity in the
   * first frame and LCP is untouched. Only the second page onwards turns.
   */
  const [navigated, setNavigated] = useState(false);
  const firstPath = useRef(pathname);
  useEffect(() => {
    if (pathname !== firstPath.current) setNavigated(true);
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider code={locale}>
        <CurrencyProvider>
          <SkipLink />
          <CustomCursor />
          {isCampaignPage ? null : <Header />}
          <main
            id="main"
            /* Keyed on the path so the animation restarts on each navigation. */
            key={navigated ? pathname : "initial"}
            data-page-turn={navigated ? "true" : undefined}
            className="min-h-screen"
          >
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </main>
          {isCampaignPage ? null : <Footer />}
          {/* One bar at a time. The advisor waits until the visitor has answered
              the cookie question, so the foot of the page never carries two. */}
          <ConsentBar onDecided={() => setConsentDecided(true)} />
          {advisorAvailability.chat && consentDecided && !isCampaignPage ? <AdvisorDock /> : null}
        </CurrencyProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

/**
 * The skip link, in the reader's language.
 *
 * Its own component because it needs the dictionary, and the dictionary needs
 * the provider it sits inside — a hook called in RootComponent would run above
 * LocaleProvider and always read English.
 */
function SkipLink() {
  const t = useT();
  return (
    <a href="#main" className="skip-link">
      {t.nav.skipToContent}
    </a>
  );
}
