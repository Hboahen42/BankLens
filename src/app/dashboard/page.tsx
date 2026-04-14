import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import DashboardOverview from "@/components/banklens/dashboard-overview";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return <DashboardOverview userEmail={user.email} />;
}
