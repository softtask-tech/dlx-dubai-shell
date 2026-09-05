import assert from "node:assert/strict";
import test from "node:test";
import { SITE_PAGES } from "./pages.ts";
import { NAVIGATION_DESTINATIONS, NAVIGATION_GROUPS } from "./navigation.ts";

test("navigation contains only registered useful destinations", () => {
  const registered = new Set(SITE_PAGES.map((page) => page.path));
  for (const href of NAVIGATION_DESTINATIONS) assert.equal(registered.has(href), true, href);
  assert.equal(NAVIGATION_GROUPS.length, 4);
});

test("navigation does not expose future thin market routes", () => {
  for (const path of ["/buy", "/rent", "/market/transactions", "/market/rents", "/compare-areas"])
    assert.equal(NAVIGATION_DESTINATIONS.has(path), false, path);
});

test("every destination occurs once within a navigation group", () => {
  const paths = NAVIGATION_GROUPS.flatMap((group) => group.items.map((item) => item.href));
  assert.equal(new Set(paths).size, paths.length);
});
