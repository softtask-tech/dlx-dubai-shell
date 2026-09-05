import { createFileRoute } from "@tanstack/react-router";
import { DirectoryDetailPage } from "@/components/directory/directory-page";
import { RecordedActivity } from "@/components/market/recorded-activity";
import { loadDirectoryDetail, loadRecordedActivity } from "@/data/directory-route";
import { directoryDetailHead } from "@/data/directory-seo";
export const Route = createFileRoute("/directory/developers/$slug")({
  loader: async ({ params }) => {
    const result = await loadDirectoryDetail("developer", params.slug, true);
    const activity = await loadRecordedActivity("developer", result.record?.primary_number ?? null);
    return { ...result, activity };
  },
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
  const { record, unavailable, activity } = Route.useLoaderData();
  return (
    <DirectoryDetailPage
      result={{ record, unavailable }}
      activity={
        activity.rows.length > 0 ? (
          <RecordedActivity
            rows={activity.rows}
            subject="developer"
            sourceExportDate={activity.sourceExportDate}
          />
        ) : undefined
      }
    />
  );
}
