import { requireDesk } from "@/lib/guard";

export default async function AdvisorLayout({ children }: { children: React.ReactNode }) {
  await requireDesk();
  return children;
}
