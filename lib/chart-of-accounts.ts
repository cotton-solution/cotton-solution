export const bankAccounts = [
  "HBL - Multan Cotton Market Branch (...4567)",
  "MCB - Vehari Branch (...8821)",
  "Meezan Bank - Khanewal Branch (...3345)",
];

export type JournalAccount = { code: string; name: string };

export const journalAccounts: JournalAccount[] = [
  { code: "1010001", name: "Cash in Hand" },
  { code: "1020001", name: "HBL - Multan Cotton Market Branch" },
  { code: "1020002", name: "MCB - Vehari Branch" },
  { code: "4010001", name: "Brokerage Commission Income" },
  { code: "5010001", name: "Office & Admin Expenses" },
  { code: "5010002", name: "Labour & Loading Charges" },
  { code: "2010001", name: "Withholding Tax Payable" },
  { code: "6210001", name: "Muhammad Ashraf & Sons" },
  { code: "6210002", name: "Al-Barkat Cotton Factory" },
  { code: "6210003", name: "DHA Traders" },
];
