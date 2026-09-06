import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { canRenderDemoProjects, normalizeHostname } from "./demo-host.ts";
import { OFF_PLAN_PROJECTS, getOffPlanProject } from "./off-plan.ts";

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

test("the two focus projects are real, named and individually addressable", () => {
  assert.equal(OFF_PLAN_PROJECTS.length, 2);
  assert.deepEqual(
    OFF_PLAN_PROJECTS.map((project) => project.slug),
    ["azizi-florence", "sobha-city-abu-dhabi"],
  );
  for (const project of OFF_PLAN_PROJECTS) {
    assert.equal(project.publicationStatus, "focus");
    assert.equal(getOffPlanProject(project.slug)?.slug, project.slug);
    assert.ok(project.developerName.length > 0);
    assert.doesNotMatch(project.developerName, /fictional/i);
    assert.ok(project.headline.length > 0);
    assert.ok(project.overview.length >= 2);
    assert.ok(project.amenities.length > 0);
    assert.ok(project.figures.length > 0);
    /* Every figure carries a plain-English meaning, per the progressive
     * disclosure rule: a number never stands on its own. */
    for (const figure of project.figures) assert.ok(figure.meaning.length > 0);
  }
});

test("no price, payment plan or handover date is invented", () => {
  for (const project of OFF_PLAN_PROJECTS) {
    assert.equal(project.startingPrice, null);
    assert.equal(project.handover, null);
    assert.equal(project.paymentPlan.length, 0);
    assert.ok(project.priceNote.length > 0);
    assert.ok(project.paymentPlanNote.length > 0);
    /* Advertising permit data is issued per release and is never faked here. */
    assert.equal(project.advertisingCompliance.advertisementPermitNumber, null);
    assert.equal(project.advertisingCompliance.authorityIssuedQrAsset, null);
    assert.equal(project.advertisingCompliance.validationStatus, "pending");
    assert.equal(project.officialDldRecord, null);
    /* Imagery comes from the developer's brochure and is credited as such. */
    for (const item of [project.hero, ...project.gallery]) {
      assert.equal(item.illustrative, false);
      assert.match(item.caption, /developer render/i);
      assert.match(item.caption, /Source:/);
    }

  }
});

test("the project page states its source and never fabricates a permit QR code", () => {
  const page = readFileSync("src/components/commercial/project-detail.tsx", "utf8");
  assert.match(page, /Advertising compliance/i);
  assert.equal(page.includes("generateQRCode"), false);
  const primitives = readFileSync("src/components/commercial/project-primitives.tsx", "utf8");
  assert.match(primitives, /developer's own brochure/i);
});

test("the private-inventory form preserves lead attribution", () => {
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

test("both project pages reach the sitemap", () => {
  const sitemap = readFileSync("src/routes/sitemap[.]xml.ts", "utf8");
  assert.equal(sitemap.includes("OFF_PLAN_PROJECTS"), true);
});
