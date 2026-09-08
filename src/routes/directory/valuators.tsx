import { createFileRoute } from "@tanstack/react-router";
import { DirectoryPage } from "@/components/directory/directory-page";
import {
  directoryDatasetSchema,
  directorySearchSchema,
  loadDirectoryList,
} from "@/data/directory-route";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/directory/valuators")({
  validateSearch: directorySearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadDirectoryList(deps, "valuator"),
  head: ({ loaderData }) =>
    pageHead({
      path: "/directory/valuators",
      schema: directoryDatasetSchema({
        name: "Dubai property valuators register",
        description:
          "Registered property valuators as recorded in Dubai Land Department open data.",
        path: "/directory/valuators",
        exportDate: loaderData?.records[0]?.source_export_date,
      }),
      breadcrumbs: [
        { name: "DLD directory", path: "/directory" },
        { name: "Valuators", path: "/directory/valuators" },
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
      selectedType="valuator"
      showTypeFilter={false}
      title="Valuators recorded in DLD open data"
      lead="Official valuator and valuation-company registration facts from the dated DLD export."
    />
  );
}
