import type { Metadata } from "next";
import { ConsoleShell } from "@/components/console/console-shell";
import { requireSession } from "@/lib/guard";

export const metadata: Metadata = {
  title: "Workspace",
  robots: { index: false, follow: false },
};

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <ConsoleShell>{children}</ConsoleShell>;
}
