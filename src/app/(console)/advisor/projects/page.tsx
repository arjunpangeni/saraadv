import { redirect } from "next/navigation";

export default function AdvisorProjectsRedirect() {
  redirect("/advisor/project-bank?tab=review");
}
