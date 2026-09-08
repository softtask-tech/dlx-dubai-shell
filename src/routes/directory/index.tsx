import { createFileRoute } from "@tanstack/react-router";

import { DirectoryPage } from "@/components/directory/directory-page";
import {
  directoryDatasetSchema,
  directorySearchSchema,
  loadDirectoryList,
} from "@/data/directory-route";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/directory/")({
  validateSearch: directorySearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadDirectoryList(deps),
  head: ({ loaderData }) =>
    pageHead({
      path: "/directory",
      breadcrumbs: [{ name: "DLD directory", path: "/directory" }],
      schema: directoryDatasetSchema({
        name: "Dubai Land Department public register",
        description:
          "Brokers, offices, developers, projects, licences, permits, escrow agents and valuators as recorded in Dubai Land Department open data, searchable in one place.",
        path: "/directory",
        exportDate: loaderData?.records[0]?.source_export_date,
      }),
    }),
  component: DirectoryIndex,
});

function DirectoryIndex() {
  const result = Route.useLoaderData();
  const search = Route.useSearch();
  return <DirectoryPage result={result} query={search.q} selectedType={search.type} />;
}
