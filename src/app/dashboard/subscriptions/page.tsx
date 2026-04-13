import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import SubscriptionsPage from "@/components/banklens/subscriptions-page";

export default async function Subscriptions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/sign-in");
  return <SubscriptionsPage userEmail={user.email} />;
}
