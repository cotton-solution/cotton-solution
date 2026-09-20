import { redirect } from "next/navigation";

/** Renamed: Bank Cheque Deposit is now Bank Receipts Voucher. */
export default function Page() {
  redirect("/transactions/bank-receipt-voucher");
}
