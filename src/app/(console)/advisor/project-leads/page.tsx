import { redirect } from "next/navigation";

export default function AdvisorProjectLeadsRedirect() {
  redirect("/advisor/crm?tab=investors");
}
