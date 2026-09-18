export type ReportConfig = {
  title: string;
  description: string;
  columns: string[];
  rows: (string | number)[][];
  numericCols?: number[]; // right-align + tabular-nums for these column indexes
};

export const reportData: Record<string, ReportConfig> = {
  "account-ledger": {
    title: "Account Ledger",
    description: "Muhammad Ashraf & Sons (6210001) — 01 Jul 2026 to 12 Sep 2026",
    columns: ["Date", "Voucher #", "Description", "Debit", "Credit", "Balance"],
    numericCols: [3, 4, 5],
    rows: [
      ["03-Jul-2026", "CRV-1042", "Cash received against invoice #881", 0, 250000, 250000],
      ["11-Jul-2026", "SLE-2210", "Cotton sale invoice", 480000, 0, -230000],
      ["22-Jul-2026", "CRV-1078", "Partial payment received", 0, 150000, -80000],
      ["05-Aug-2026", "JV-0334", "Brokerage commission adjustment", 12000, 0, -92000],
      ["19-Aug-2026", "CRV-1121", "Cash received", 0, 92000, 0],
    ],
  },
  "account-payable": {
    title: "Account Payable",
    description: "Outstanding balances owed to vendors as of 12 Sep 2026",
    columns: ["Party", "Contact", "Opening Balance", "Debit", "Credit", "Closing Balance"],
    numericCols: [2, 3, 4, 5],
    rows: [
      ["Al-Barkat Cotton Factory", "Zafar Iqbal", 0, 320000, 500000, 180000],
      ["Punjab Ginning Mills", "Tariq Mehmood", 45000, 0, 60000, 105000],
      ["Chenab Traders", "Naveed Anjum", 0, 0, 25000, 25000],
    ],
  },
  "account-receivable": {
    title: "Account Receivable",
    description: "Outstanding balances owed by customers as of 12 Sep 2026",
    columns: ["Party", "Contact", "Opening Balance", "Debit", "Credit", "Closing Balance"],
    numericCols: [2, 3, 4, 5],
    rows: [
      ["Muhammad Ashraf & Sons", "Muhammad Ashraf", 0, 480000, 480000, 0],
      ["DHA Traders", "Imran Sheikh", 60000, 90000, 40000, 110000],
      ["Al-Barkat Cotton Factory", "Zafar Iqbal", 0, 220000, 0, 220000],
    ],
  },
  "bank-statement": {
    title: "Bank Statement",
    description: "HBL Multan Cotton Market Branch — A/C ...4567 — Aug 2026",
    columns: ["Date", "Description", "Cheque #", "Debit", "Credit", "Balance"],
    numericCols: [3, 4, 5],
    rows: [
      ["02-Aug-2026", "Cheque deposit - DHA Traders", "CHQ-8891", 0, 400000, 1400000],
      ["08-Aug-2026", "Cheque issued - Al-Barkat Cotton", "CHQ-0231", 320000, 0, 1080000],
      ["15-Aug-2026", "Bank charges", "-", 1200, 0, 1078800],
      ["27-Aug-2026", "Cheque deposit - Ashraf & Sons", "CHQ-9004", 0, 250000, 1328800],
    ],
  },
  "cash-book": {
    title: "Cash Book",
    description: "Daily cash inflows and outflows — Aug 2026",
    columns: ["Date", "Voucher #", "Description", "Receipts", "Payments", "Balance"],
    numericCols: [3, 4, 5],
    rows: [
      ["01-Aug-2026", "CRV-1099", "Opening cash", 0, 0, 85000],
      ["04-Aug-2026", "CRV-1102", "Cash received - DHA Traders", 90000, 0, 175000],
      ["09-Aug-2026", "CPV-2041", "Labour & loading charges", 0, 18000, 157000],
      ["21-Aug-2026", "CPV-2058", "Office expenses", 0, 6500, 150500],
    ],
  },
  "daily-vouchers": {
    title: "Daily Vouchers Details",
    description: "All vouchers posted on 11 Sep 2026",
    columns: ["Voucher #", "Type", "Party", "Amount", "Narration"],
    numericCols: [3],
    rows: [
      ["CRV-1145", "Cash Receiving", "Muhammad Ashraf & Sons", 150000, "Against invoice #904"],
      ["CPV-2077", "Cash Payment", "Al-Barkat Cotton Factory", 90000, "Purchase advance"],
      ["JV-0361", "Journal", "-", 12500, "Brokerage commission accrual"],
      ["BCD-0044", "Bank Cheque Deposit", "DHA Traders", 60000, "Cheque #8891 deposited"],
    ],
  },
  "trial-balance": {
    title: "Trial Balance",
    description: "As of 12 Sep 2026",
    columns: ["Account Code", "Account Name", "Debit", "Credit"],
    numericCols: [2, 3],
    rows: [
      ["1010001", "Cash in Hand", 150500, 0],
      ["1020001", "HBL Bank Account", 1328800, 0],
      ["6210001", "Muhammad Ashraf & Sons", 0, 0],
      ["6210003", "DHA Traders", 110000, 0],
      ["6500002", "Al-Barkat Cotton Factory (Vendor)", 0, 180000],
      ["4010001", "Brokerage Commission Income", 0, 340000],
      ["5010001", "Office & Admin Expenses", 24500, 0],
    ],
  },
  "profit-and-loss": {
    title: "Profit & Loss Statement",
    description: "01 Jul 2026 to 12 Sep 2026",
    columns: ["Head", "Amount"],
    numericCols: [1],
    rows: [
      ["Brokerage Commission Income", 340000],
      ["Crop Trading Income", 980000],
      ["Office & Admin Expenses", -24500],
      ["Labour & Loading Charges", -38000],
      ["Bank Charges", -1200],
      ["Net Profit", 1256300],
    ],
  },
  "balance-sheet": {
    title: "Balance Sheet",
    description: "As of 12 Sep 2026",
    columns: ["Head", "Type", "Amount"],
    numericCols: [2],
    rows: [
      ["Cash in Hand", "Asset", 150500],
      ["HBL Bank Account", "Asset", 1328800],
      ["Accounts Receivable", "Asset", 330000],
      ["Accounts Payable", "Liability", -310000],
      ["Owner's Equity", "Equity", -1499300],
    ],
  },
};
