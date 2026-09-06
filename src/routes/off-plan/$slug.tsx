import { createFileRoute, notFound } from "@tanstack/react-router";

import { CommercialProjectDetail } from "@/components/commercial/project-detail";
import { OFF_PLAN_PROJECTS, getOffPlanProject } from "@/data/off-plan";
import { pageHead } from "@/lib/seo";
import { projectSchema } from "@/lib/schema";

export const Route = createFileRoute("/off-plan/$slug")({
  loader: ({ params }) => {
    const project = getOffPlanProject(params.slug);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => {
    const project = loaderData?.project;
    if (!project) return {};
    return pageHead({
      path: `/off-plan/${project.slug}`,
      title: `${project.name} — ${project.locationName}`,
      description: project.headline,
      tagline: `${project.developerName} · ${project.projectType}`,
      image: `${project.hero.src}-1280.jpg`,
      breadcrumbs: [
        { name: "Off-plan", path: "/off-plan" },
        { name: project.name, path: `/off-plan/${project.slug}` },
      ],
      /* Only what the page itself states. No price and no handover date are
       * asserted here, because for these two projects we hold neither in
       * writing. */
      schema: [
        projectSchema({
          name: project.name,
          path: `/off-plan/${project.slug}`,
          description: project.headline,
          image: `${project.hero.src}-1280.jpg`,
          developerName: project.developerName,
          locationName: project.locationName,
          constructionStatus: project.constructionStatus,
          numberOfRooms: project.bedrooms,
        }),
      ],
    });
  },
  component: OffPlanProjectRoute,
});


function OffPlanProjectRoute() {
  const { project } = Route.useLoaderData();
  return <CommercialProjectDetail project={project} allProjects={OFF_PLAN_PROJECTS} />;
}
