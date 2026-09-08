import { createFileRoute } from "@tanstack/react-router";
import { DirectoryPage } from "@/components/directory/directory-page";
import {
  directoryDatasetSchema,
  directorySearchSchema,
  loadDirectoryList,
} from "@/data/directory-route";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/directory/developers/")({
  validateSearch: directorySearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadDirectoryList(deps, "developer"),
  head: ({ loaderData }) =>
    pageHead({
      path: "/directory/developers",
      schema: directoryDatasetSchema({
        name: "Dubai property developers register",
        description:
          "Developer names and registration details as recorded in Dubai Land Department open data.",
        path: "/directory/developers",
        exportDate: loaderData?.records[0]?.source_export_date,
      }),
      breadcrumbs: [
        { name: "DLD directory", path: "/directory" },
        { name: "Developers", path: "/directory/developers" },
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
      selectedType="developer"
      showTypeFilter={false}
      title="Developers recorded in DLD open data"
      lead="Official developer names, registration details and licence facts from the dated DLD export."
    />
  );
}
