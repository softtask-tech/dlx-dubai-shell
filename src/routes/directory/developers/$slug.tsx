import { createFileRoute } from "@tanstack/react-router";
import { DirectoryDetailPage } from "@/components/directory/directory-page";
import { loadDirectoryDetail } from "@/data/directory-route";
import { directoryDetailHead } from "@/data/directory-seo";
export const Route = createFileRoute("/directory/developers/$slug")({
  loader: ({ params }) => loadDirectoryDetail("developer", params.slug, true),
  head: ({ loaderData }) =>
    directoryDetailHead({
      record: loaderData?.record ?? null,
      parentName: "Developers",
      parentPath: "/directory/developers",
      fallbackTitle: "DLD developer record",
      description:
        "Official developer registration and licence facts recorded in Dubai Land Department open data.",
      image: "/og/developers.png",
    }),
  component: DeveloperDetail,
});

function DeveloperDetail() {
  return <DirectoryDetailPage result={Route.useLoaderData()} />;
}
