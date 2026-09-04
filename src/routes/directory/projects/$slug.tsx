import { createFileRoute } from "@tanstack/react-router";
import { DirectoryDetailPage } from "@/components/directory/directory-page";
import { loadDirectoryDetail } from "@/data/directory-route";
import { directoryDetailHead } from "@/data/directory-seo";
export const Route = createFileRoute("/directory/projects/$slug")({
  loader: ({ params }) => loadDirectoryDetail("project", params.slug, true),
  head: ({ loaderData }) =>
    directoryDetailHead({
      record: loaderData?.record ?? null,
      parentName: "Projects",
      parentPath: "/directory/projects",
      fallbackTitle: "DLD project record",
      description:
        "Official project facts and relationships recorded in Dubai Land Department open data.",
      image: "/og/properties.png",
    }),
  component: ProjectDetail,
});

function ProjectDetail() {
  return <DirectoryDetailPage result={Route.useLoaderData()} />;
}
