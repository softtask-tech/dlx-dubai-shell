import { directoryRecordPath } from "./directory-contract";
import type { DirectoryRecord } from "./directory-types";
import { pageHead } from "@/lib/seo";

type DirectoryDetailHeadOptions = {
  record: DirectoryRecord | null;
  parentName: string;
  parentPath: string;
  fallbackTitle: string;
  description: string;
  image: string;
};

/** Build record-specific metadata without inventing a translated name. */
export function directoryDetailHead({
  record,
  parentName,
  parentPath,
  fallbackTitle,
  description,
  image,
}: DirectoryDetailHeadOptions) {
  const officialName = record?.display_name_en ?? record?.display_name_ar;
  const recordPath = record ? directoryRecordPath(record) : null;
  const title = officialName ?? fallbackTitle;

  return pageHead({
    path: recordPath ?? parentPath,
    title: `${title} — DLD open data record`,
    description,
    tagline: "Recorded in DLD open data.",
    image,
    noIndex: !record,
    breadcrumbs: [
      { name: "DLD directory", path: "/directory" },
      { name: parentName, path: parentPath },
      ...(recordPath ? [{ name: title, path: recordPath }] : []),
    ],
  });
}
