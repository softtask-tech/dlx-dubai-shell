import { DIRECTORY_DISCLAIMER, type DirectoryRecord } from "../directory-types.ts";

const base = {
  secondary_number: null,
  status_en: "Active",
  valid_from: "2025-01-01",
  valid_to: "2026-12-31",
  related_context: {},
  total_count: 1,
  source_export_date: "2026-09-03",
  source_dataset: "Sanitized test fixture",
  non_affiliation: DIRECTORY_DISCLAIMER,
} as const;

export const DIRECTORY_FIXTURE: readonly DirectoryRecord[] = [
  {
    ...base,
    entity_type: "developer",
    source_key: "dev-101",
    display_name_en: "Harbour Development",
    display_name_ar: "تطوير الميناء",
    primary_number: "DEV-101",
  },
  {
    ...base,
    entity_type: "broker",
    source_key: "broker-202",
    display_name_en: "Maya Rahman",
    display_name_ar: "مايا رحمن",
    primary_number: "BRN-202",
    related_context: {
      offices: [{ key: "office-1", name_en: "Harbour Office", name_ar: null, number: "ORN-1" }],
    },
  },
  {
    ...base,
    entity_type: "project",
    source_key: "project-303",
    display_name_en: "Canal House",
    display_name_ar: null,
    primary_number: "PRJ-303",
    related_context: {},
  },
  {
    ...base,
    entity_type: "licence",
    source_key: "opaque-licence-key",
    display_name_en: "Harbour Realty",
    display_name_ar: "هاربور العقارية",
    primary_number: "LIC-404",
  },
  {
    ...base,
    entity_type: "permit",
    source_key: "permit-505",
    display_name_en: null,
    display_name_ar: "تصريح عقاري",
    primary_number: "PER-505",
  },
  {
    ...base,
    entity_type: "office",
    source_key: "office-1",
    display_name_en: "Harbour Office",
    display_name_ar: null,
    primary_number: "ORN-1",
  },
];
