import { redirect } from "next/navigation";

/** Renamed: Bank Payment Voucher is now Bank Issue Voucher. */
export default function Page() {
  redirect("/transactions/bank-issue-voucher");
}
