import { ProjectCard, type ProjectCardData } from "@/components/project-bank/project-card";

export function ProjectCardGrid({ projects }: { projects: ProjectCardData[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project, i) => (
        <ProjectCard key={project.slug} project={{ ...project, priority: i < 3 }} />
      ))}
    </div>
  );
}
