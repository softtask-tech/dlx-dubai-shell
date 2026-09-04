import { createFileRoute } from "@tanstack/react-router";
import { DirectoryDetailPage } from "@/components/directory/directory-page";
import { loadDirectoryDetail } from "@/data/directory-route";
import { directoryDetailHead } from "@/data/directory-seo";
export const Route = createFileRoute("/directory/offices/$id")({
  loader: ({ params }) => loadDirectoryDetail("office", params.id),
  head: ({ loaderData }) =>
    directoryDetailHead({
      record: loaderData?.record ?? null,
      parentName: "Offices",
      parentPath: "/directory/offices",
      fallbackTitle: "DLD real estate office record",
      description:
        "Official real estate office and licence facts recorded in Dubai Land Department open data.",
      image: "/og/about.png",
    }),
  component: OfficeDetail,
});

function OfficeDetail() {
  return <DirectoryDetailPage result={Route.useLoaderData()} />;
}
