import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { canRenderDemoProjects, normalizeHostname } from "./demo-host.ts";
import { DEMO_OFF_PLAN_PROJECTS, getDemoOffPlanProject } from "./off-plan.ts";

test("demo gate requires both flag and an approved preview host", () => {
  assert.equal(canRenderDemoProjects({ flag: "true", hostname: "localhost:3000" }), true);
  assert.equal(canRenderDemoProjects({ flag: "true", hostname: "build-42.lovable.app" }), true);
  assert.equal(
    canRenderDemoProjects({ flag: "true", hostname: "preview.lovableproject.com" }),
    true,
  );
  assert.equal(canRenderDemoProjects({ flag: "false", hostname: "localhost" }), false);
  assert.equal(canRenderDemoProjects({ flag: "true", hostname: "preview.example.com" }), false);
});

test("production is denied even when the flag is accidentally enabled", () => {
  assert.equal(canRenderDemoProjects({ flag: "true", hostname: "dlxproperties.com" }), false);
  assert.equal(canRenderDemoProjects({ flag: "true", hostname: "www.dlxproperties.com" }), false);
  assert.equal(canRenderDemoProjects({ flag: true, hostname: "localhost" }), false);
  assert.equal(
    canRenderDemoProjects({
      flag: "true",
      hostname: "dlxproperties.com",
      forwardedHostname: "preview.lovable.app",
    }),
    false,
  );
});

test("forwarded hosts normalize without trusting extra values", () => {
  assert.equal(normalizeHostname("LOCALHOST:3000"), "localhost");
  assert.equal(normalizeHostname("dlxproperties.com, proxy.internal"), "dlxproperties.com");
  assert.equal(normalizeHostname("[::1]:3000"), "::1");
});

test("the three fixtures are fictional, isolated and carry no official claims", () => {
  assert.equal(DEMO_OFF_PLAN_PROJECTS.length, 3);
  assert.equal(new Set(DEMO_OFF_PLAN_PROJECTS.map((project) => project.slug)).size, 3);
  for (const project of DEMO_OFF_PLAN_PROJECTS) {
    assert.equal(project.isDemo, true);
    assert.equal(project.publicationStatus, "demo");
    assert.equal(project.officialDldRecord, null);
    assert.equal(project.startingPrice, null);
    assert.equal(project.handover, null);
    assert.equal(project.brochureUrl, null);
    assert.match(project.developerName, /fictional/i);
    assert.match(project.hero.caption, /not a real project/i);
    assert.equal(getDemoOffPlanProject(project.slug)?.slug, project.slug);
  }
});

test("demo enquiry component has no network, CRM or conversion imports", () => {
  const source = readFileSync("src/components/commercial/demo-enquiry-form.tsx", "utf8");
  for (const prohibited of [
    "submitLead",
    "submitLeadFn",
    "fetch(",
    "XMLHttpRequest",
    "@/lib/tracking",
    "window.open",
    "wa.me",
  ]) {
    assert.equal(source.includes(prohibited), false, `unexpected demo side effect: ${prohibited}`);
  }
});

test("the real private-inventory form preserves lead attribution", () => {
  const source = readFileSync("src/components/commercial/private-inventory-form.tsx", "utf8");
  for (const required of [
    "...readAttribution()",
    "pagePath:",
    "eventId:",
    "qualificationAnswers:",
    "commercial_intent:",
    "preferred_community:",
    "language:",
  ]) {
    assert.equal(source.includes(required), true, `missing lead context: ${required}`);
  }
});

test("prototype slugs cannot leak into sitemap or real-estate structured data", () => {
  const sitemap = readFileSync("src/routes/sitemap[.]xml.ts", "utf8");
  const detailRoute = readFileSync("src/routes/off-plan/$slug.tsx", "utf8");
  for (const project of DEMO_OFF_PLAN_PROJECTS) {
    assert.equal(sitemap.includes(project.slug), false);
  }
  assert.equal(detailRoute.includes("listingSchema"), false);
  assert.equal(detailRoute.includes("noIndex: true"), true);
});
