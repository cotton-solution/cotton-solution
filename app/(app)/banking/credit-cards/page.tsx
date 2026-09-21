import { redirect } from "next/navigation";

/** Banking was removed from the menu — old links go to the dashboard. */
export default function Page() {
  redirect("/");
}
