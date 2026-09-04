import { createFileRoute } from "@tanstack/react-router";
import { DirectoryPage } from "@/components/directory/directory-page";
import { directorySearchSchema, loadDirectoryList } from "@/data/directory-route";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/directory/escrow-agents")({
  validateSearch: directorySearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadDirectoryList(deps, "escrow_agent"),
  head: () =>
    pageHead({
      path: "/directory/escrow-agents",
      breadcrumbs: [
        { name: "DLD directory", path: "/directory" },
        { name: "Escrow agents", path: "/directory/escrow-agents" },
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
      selectedType="escrow_agent"
      showTypeFilter={false}
      title="Approved escrow agents recorded in DLD open data"
      lead="Official escrow-agent names and numbers from the dated DLD export."
    />
  );
}
