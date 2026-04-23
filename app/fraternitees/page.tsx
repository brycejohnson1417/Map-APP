import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "FraterniTees Integrations",
  description: "FraterniTees tenant workspace for Printavo CRM and order-history lead scoring.",
};

export default function FraterniteesPage() {
  redirect("/integrations?org=fraternitees");
}
