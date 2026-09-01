import { redirect } from "next/navigation";

export default function AssetManagementRedirectPage() {
  redirect("/advisor/inquiries?type=ASSET_MANAGEMENT");
}
