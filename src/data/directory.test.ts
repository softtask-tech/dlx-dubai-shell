import assert from "node:assert/strict";
import test from "node:test";

import { DIRECTORY_FIXTURE } from "./__fixtures__/directory.ts";
import {
  directoryKeyFromSlug,
  directoryRecordPath,
  normalizeDirectoryQuery,
  searchDirectoryFixture,
  unavailableDirectoryResult,
} from "./directory-contract.ts";

test("searches English and normalized Arabic names", () => {
  assert.equal(
    searchDirectoryFixture(DIRECTORY_FIXTURE, { query: "harbour development" }).records[0]
      ?.entity_type,
    "developer",
  );
  assert.equal(
    searchDirectoryFixture(DIRECTORY_FIXTURE, { query: "تَصْرِيح عَقَارِي" }).records[0]
      ?.entity_type,
    "permit",
  );
  assert.equal(normalizeDirectoryQuery("إدارة الأملاك"), "ادارة الاملاك");
});

test("finds every required official number kind", () => {
  for (const [query, type] of [
    ["DEV-101", "developer"],
    ["BRN-202", "broker"],
    ["PRJ-303", "project"],
    ["LIC-404", "licence"],
    ["PER-505", "permit"],
  ] as const) {
    assert.equal(
      searchDirectoryFixture(DIRECTORY_FIXTURE, { query }).records[0]?.entity_type,
      type,
    );
  }
});

test("filters and paginates deterministically", () => {
  const first = searchDirectoryFixture(DIRECTORY_FIXTURE, { page: 1, pageSize: 2 });
  const second = searchDirectoryFixture(DIRECTORY_FIXTURE, { page: 2, pageSize: 2 });
  assert.equal(first.records.length, 2);
  assert.equal(first.totalPages, 3);
  assert.notEqual(first.records[0]?.source_key, second.records[0]?.source_key);
  assert.equal(searchDirectoryFixture(DIRECTORY_FIXTURE, { types: ["permit"] }).total, 1);
});

test("keeps unmatched and one-language records honest", () => {
  const project = DIRECTORY_FIXTURE.find((record) => record.entity_type === "project");
  const permit = DIRECTORY_FIXTURE.find((record) => record.entity_type === "permit");
  assert.deepEqual(project?.related_context, {});
  assert.equal(project?.display_name_ar, null);
  assert.equal(permit?.display_name_en, null);
});

test("public fixture cannot expose internal fields", () => {
  const forbidden = [
    "phone",
    "email",
    "fax",
    "nationality",
    "gender",
    "participant_id",
    "aliases",
    "latitude",
    "longitude",
  ];
  for (const record of DIRECTORY_FIXTURE) {
    for (const field of forbidden) assert.equal(Object.hasOwn(record, field), false, field);
  }
});

test("detail slugs round-trip and unavailable state is safe", () => {
  const developer = DIRECTORY_FIXTURE[0]!;
  const path = directoryRecordPath(developer)!;
  assert.equal(directoryKeyFromSlug(path.split("/").at(-1)!), developer.source_key);
  assert.deepEqual(unavailableDirectoryResult({ page: 4, pageSize: 10 }), {
    records: [],
    page: 4,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    unavailable: true,
  });
});
