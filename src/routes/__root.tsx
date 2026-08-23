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
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { site } from "@/config/site";
import { captureAttribution } from "@/components/forms/attribution";
import { CurrencyProvider } from "@/components/tools/currency-context";
import { organizationSchema, websiteSchema } from "@/lib/schema";
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
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap",
        },
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
  return (
    <html lang={site.language}>
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

  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <CustomCursor />
        {isCampaignPage ? null : <Header />}
        <main id="main" className="min-h-screen">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </main>
        {isCampaignPage ? null : <Footer />}
        {/* One bar at a time. The advisor waits until the visitor has answered
            the cookie question, so the foot of the page never carries two. */}
        <ConsentBar onDecided={() => setConsentDecided(true)} />
        {advisorAvailability.chat && consentDecided && !isCampaignPage ? <AdvisorDock /> : null}
      </CurrencyProvider>
    </QueryClientProvider>
  );
}
