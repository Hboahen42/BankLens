import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import SettingsPage from "@/components/banklens/settings-page";

export default async function Settings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/sign-in");
  return <SettingsPage userEmail={user.email ?? ""} />;
}
