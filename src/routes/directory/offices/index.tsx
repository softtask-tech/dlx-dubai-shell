import { createFileRoute } from "@tanstack/react-router";
import { DirectoryPage } from "@/components/directory/directory-page";
import {
  directoryDatasetSchema,
  directorySearchSchema,
  loadDirectoryList,
} from "@/data/directory-route";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/directory/offices/")({
  validateSearch: directorySearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadDirectoryList(deps, "office"),
  head: ({ loaderData }) =>
    pageHead({
      path: "/directory/offices",
      schema: directoryDatasetSchema({
        name: "Dubai real estate offices register",
        description:
          "Registered real estate office names, licence details and registration numbers from Dubai Land Department open data.",
        path: "/directory/offices",
        exportDate: loaderData?.records[0]?.source_export_date,
      }),
      breadcrumbs: [
        { name: "DLD directory", path: "/directory" },
        { name: "Offices", path: "/directory/offices" },
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
      selectedType="office"
      showTypeFilter={false}
      title="Real estate offices recorded in DLD open data"
      lead="Official office and licence facts from the dated DLD export."
    />
  );
}
