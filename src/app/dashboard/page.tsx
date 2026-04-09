import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import BankLensDashboard from "@/components/banklens/banklens-dashboard";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return <BankLensDashboard userEmail={user.email} />;
}
