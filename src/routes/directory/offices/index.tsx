import { createFileRoute } from "@tanstack/react-router";
import { DirectoryPage } from "@/components/directory/directory-page";
import { directorySearchSchema, loadDirectoryList } from "@/data/directory-route";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/directory/offices/")({
  validateSearch: directorySearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadDirectoryList(deps, "office"),
  head: () =>
    pageHead({
      path: "/directory/offices",
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
