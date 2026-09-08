import { createFileRoute } from "@tanstack/react-router";
import { DirectoryPage } from "@/components/directory/directory-page";
import {
  directoryDatasetSchema,
  directorySearchSchema,
  loadDirectoryList,
} from "@/data/directory-route";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/directory/licences")({
  validateSearch: directorySearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadDirectoryList(deps, "licence"),
  head: ({ loaderData }) =>
    pageHead({
      path: "/directory/licences",
      schema: directoryDatasetSchema({
        name: "Dubai real estate licences register",
        description:
          "Real estate licences and their status as recorded in Dubai Land Department open data.",
        path: "/directory/licences",
        exportDate: loaderData?.records[0]?.source_export_date,
      }),
      breadcrumbs: [
        { name: "DLD directory", path: "/directory" },
        { name: "Licences", path: "/directory/licences" },
      ],
    }),
  component: Page,
});
function Page() {
  const result = Route.useLoaderData();
  const search = Route.useSearch();
  return (
    <DirectoryPage
      result={result}
      query={search.q}
      selectedType="licence"
      showTypeFilter={false}
      title="Real estate licences recorded in DLD open data"
      lead="Search public professional licence facts and their recorded status dates."
    />
  );
}
