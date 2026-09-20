import { redirect } from "next/navigation";

/** Removed from the Transactions menu. */
export default function Page() {
  redirect("/transactions");
}
