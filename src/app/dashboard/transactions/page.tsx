import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import TransactionsPage from "@/components/banklens/transactions-page";

export default async function Transactions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/sign-in");
  return <TransactionsPage userEmail={user.email} />;
}
