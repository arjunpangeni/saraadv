import { redirect } from "next/navigation";

export default function CarbonProjectsRedirectPage() {
  redirect("/advisor/inquiries?type=CARBON");
}
