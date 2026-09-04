import { createFileRoute } from "@tanstack/react-router";
import { DirectoryPage } from "@/components/directory/directory-page";
import { directorySearchSchema, loadDirectoryList } from "@/data/directory-route";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/directory/valuators")({
  validateSearch: directorySearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadDirectoryList(deps, "valuator"),
  head: () =>
    pageHead({
      path: "/directory/valuators",
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
