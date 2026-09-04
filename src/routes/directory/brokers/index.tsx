import { createFileRoute } from "@tanstack/react-router";
import { DirectoryPage } from "@/components/directory/directory-page";
import { directorySearchSchema, loadDirectoryList } from "@/data/directory-route";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/directory/brokers/")({
  validateSearch: directorySearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadDirectoryList(deps, "broker"),
  head: () =>
    pageHead({
      path: "/directory/brokers",
      breadcrumbs: [
        { name: "DLD directory", path: "/directory" },
        { name: "Brokers", path: "/directory/brokers" },
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
      selectedType="broker"
      showTypeFilter={false}
      title="Brokers recorded in DLD open data"
      lead="Search official broker names and registration numbers, with matched office affiliations only."
    />
  );
}
