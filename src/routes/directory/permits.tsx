import { createFileRoute } from "@tanstack/react-router";
import { DirectoryPage } from "@/components/directory/directory-page";
import { directorySearchSchema, loadDirectoryList } from "@/data/directory-route";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/directory/permits")({
  validateSearch: directorySearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadDirectoryList(deps, "permit"),
  head: () =>
    pageHead({
      path: "/directory/permits",
      breadcrumbs: [
        { name: "DLD directory", path: "/directory" },
        { name: "Permits", path: "/directory/permits" },
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
      selectedType="permit"
      showTypeFilter={false}
      title="Real estate permits recorded in DLD open data"
      lead="Search official permit numbers, services and status dates from the dated export."
    />
  );
}
