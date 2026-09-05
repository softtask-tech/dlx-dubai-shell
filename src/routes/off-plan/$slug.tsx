import { createFileRoute, notFound } from "@tanstack/react-router";

import { CommercialProjectDetail } from "@/components/commercial/project-detail";
import { getDemoProjectAccessFn } from "@/data/demo-access.functions";
import { DEMO_OFF_PLAN_PROJECTS, getDemoOffPlanProject } from "@/data/off-plan";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/off-plan/$slug")({
  loader: async ({ params }) => {
    const demoEnabled = await getDemoProjectAccessFn();
    if (!demoEnabled) throw notFound();
    const project = getDemoOffPlanProject(params.slug);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => {
    const project = loaderData?.project;
    if (!project) return {};
    return pageHead({
      path: `/off-plan/${project.slug}`,
      title: `${project.name} — concept preview`,
      description: `${project.name} is a fictional design prototype, not a real property listing, project launch or offer.`,
      tagline: "Concept preview — not a real listing.",
      image: `${project.hero.src}-1280.jpg`,
      noIndex: true,
    });
  },
  component: OffPlanProjectRoute,
});

function OffPlanProjectRoute() {
  const { project } = Route.useLoaderData();
  return <CommercialProjectDetail project={project} allProjects={DEMO_OFF_PLAN_PROJECTS} />;
}
