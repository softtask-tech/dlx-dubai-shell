/** Public-only shapes for the DLD directory. Internal matching columns never belong here. */
export const DIRECTORY_RECORD_TYPES = [
  "developer",
  "project",
  "broker",
  "office",
  "licence",
  "permit",
  "valuator",
  "escrow_agent",
  "owner_association",
  "community",
  "free_zone_company",
] as const;

export type DirectoryRecordType = (typeof DIRECTORY_RECORD_TYPES)[number];

export type DirectoryRelatedReference = {
  key: string;
  name_en: string | null;
  name_ar: string | null;
  number: string | null;
};

export type DirectoryRelatedContext = Record<
  string,
  DirectoryRelatedReference | DirectoryRelatedReference[] | undefined
>;

export type DirectoryRecord = {
  entity_type: DirectoryRecordType;
  source_key: string;
  display_name_en: string | null;
  display_name_ar: string | null;
  primary_number: string | null;
  secondary_number: string | null;
  status_en: string | null;
  valid_from: string | null;
  valid_to: string | null;
  related_context: DirectoryRelatedContext;
  total_count?: number;
  source_export_date: string;
  source_dataset: string;
  non_affiliation: string;
};

export type DirectorySearchInput = {
  query?: string | undefined;
  types?: DirectoryRecordType[] | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
};

export type DirectorySearchResult = {
  records: DirectoryRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  unavailable: boolean;
};

export const DIRECTORY_DISCLAIMER =
  "Independent directory using Dubai Land Department open data; no affiliation or endorsement is implied.";

export const DIRECTORY_RECORDED_LABEL = "Recorded in DLD open data";

export function directoryStatusNotice(exportDate: string): string {
  return `Status as recorded in the DLD export dated ${exportDate}. Verify current status with the relevant authority.`;
}

export const DIRECTORY_TYPE_LABELS: Record<DirectoryRecordType, string> = {
  developer: "Developers",
  project: "Projects",
  broker: "Brokers",
  office: "Offices",
  licence: "Licences",
  permit: "Permits",
  valuator: "Valuators",
  escrow_agent: "Escrow agents",
  owner_association: "Owner associations",
  community: "Communities",
  free_zone_company: "Free-zone companies",
};
