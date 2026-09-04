import { createFileRoute } from "@tanstack/react-router";

import { DirectoryPage } from "@/components/directory/directory-page";
import { directorySearchSchema, loadDirectoryList } from "@/data/directory-route";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/directory/")({
  validateSearch: directorySearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadDirectoryList(deps),
  head: () =>
    pageHead({ path: "/directory", breadcrumbs: [{ name: "DLD directory", path: "/directory" }] }),
  component: DirectoryIndex,
});

function DirectoryIndex() {
  const result = Route.useLoaderData();
  const search = Route.useSearch();
  return <DirectoryPage result={result} query={search.q} selectedType={search.type} />;
}
