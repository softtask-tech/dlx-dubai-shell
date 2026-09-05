import { createFileRoute } from "@tanstack/react-router";
import { DirectoryDetailPage } from "@/components/directory/directory-page";
import { RecordedActivity } from "@/components/market/recorded-activity";
import { loadDirectoryDetail, loadRecordedActivity } from "@/data/directory-route";
import { directoryDetailHead } from "@/data/directory-seo";
export const Route = createFileRoute("/directory/projects/$slug")({
  loader: async ({ params }) => {
    const result = await loadDirectoryDetail("project", params.slug, true);
    const activity = await loadRecordedActivity("project", result.record?.primary_number ?? null);
    return { ...result, activity };
  },
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
  const { record, unavailable, activity } = Route.useLoaderData();
  return (
    <DirectoryDetailPage
      result={{ record, unavailable }}
      activity={
        activity.rows.length > 0 ? (
          <RecordedActivity
            rows={activity.rows}
            subject="project"
            sourceExportDate={activity.sourceExportDate}
          />
        ) : undefined
      }
    />
  );
}
