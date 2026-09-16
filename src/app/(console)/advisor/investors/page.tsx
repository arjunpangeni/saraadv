import { redirect } from "next/navigation";

export default function AdvisorInvestorsPage() {
  redirect("/advisor/crm?tab=investors");
}
