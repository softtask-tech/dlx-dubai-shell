import { createFileRoute } from "@tanstack/react-router";
import { DirectoryPage } from "@/components/directory/directory-page";
import { directorySearchSchema, loadDirectoryList } from "@/data/directory-route";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/directory/projects/")({
  validateSearch: directorySearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadDirectoryList(deps, "project"),
  head: () =>
    pageHead({
      path: "/directory/projects",
      breadcrumbs: [
        { name: "DLD directory", path: "/directory" },
        { name: "Projects", path: "/directory/projects" },
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
      selectedType="project"
      showTypeFilter={false}
      title="Projects recorded in DLD open data"
      lead="Official project numbers, recorded status and matched developer or community relationships."
    />
  );
}
