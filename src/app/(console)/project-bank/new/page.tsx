import { PageHeader } from "@/components/console/page-header";
import { NewProjectForm } from "@/components/project-bank/new-project-form";
import { requirePermission } from "@/lib/guard";

export default async function NewProjectPage() {
  await requirePermission("project:create", "/project-bank/new");
  return (
    <main className="flex-1 bg-background">
      <PageHeader
        withGrid
        compact
        narrow
        eyebrow="Project Bank"
        title="List your idea"
        description="Investors see a teaser. Your name, WhatsApp, and exact site stay with the desk."
      />
      <NewProjectForm />
    </main>
  );
}
