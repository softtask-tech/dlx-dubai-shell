import { createFileRoute } from "@tanstack/react-router";
import { DirectoryDetailPage } from "@/components/directory/directory-page";
import { loadDirectoryDetail } from "@/data/directory-route";
import { directoryDetailHead } from "@/data/directory-seo";
export const Route = createFileRoute("/directory/brokers/$id")({
  loader: ({ params }) => loadDirectoryDetail("broker", params.id),
  head: ({ loaderData }) =>
    directoryDetailHead({
      record: loaderData?.record ?? null,
      parentName: "Brokers",
      parentPath: "/directory/brokers",
      fallbackTitle: "DLD broker record",
      description:
        "Official broker registration facts and matched office affiliations recorded in DLD open data.",
      image: "/og/team.png",
    }),
  component: BrokerDetail,
});

function BrokerDetail() {
  return <DirectoryDetailPage result={Route.useLoaderData()} />;
}
