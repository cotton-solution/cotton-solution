export type Party = {
  id: string;
  name: string;
  nameUrdu: string;
  englishBusinessName: string;
  group: string;
  town: string;
  sector: string;
  address: string;
  city: string;
  mobile: string;
  phone: string;
  email: string;
  fax: string;
  stn: string;
  ntnCnic: string;
  bankAccount: string;
  contactPerson: string;
  canAlsoBeVendor: boolean;
};

export const towns = [
  "Multan",
  "Vehari",
  "Khanewal",
  "Bahawalpur",
  "Rahim Yar Khan",
  "Dera Ghazi Khan",
];

export const sectors = [
  "Cotton",
  "Wheat",
  "Textile Mills",
  "General Trading",
  "Ginning Factory",
];

export const partyGroups = [
  "--- Without Group ---",
  "Bopari",
  "Cotton Factory",
  "DHA Group",
  "Ginner",
  "Textile Mill",
];

export const mockParties: Party[] = [
  {
    id: "6210001",
    name: "Muhammad Ashraf & Sons",
    nameUrdu: "محمد اشرف اینڈ سنز",
    englishBusinessName: "Muhammad Ashraf & Sons",
    group: "Bopari",
    town: "Multan",
    sector: "Cotton",
    address: "Cotton Market, Hussain Agahi Road",
    city: "Multan",
    mobile: "0300-1234567",
    phone: "061-4567890",
    email: "ashraf.sons@example.com",
    fax: "",
    stn: "STN-11-2233",
    ntnCnic: "36302-1234567-1",
    bankAccount: "PK00HABB0001234567890",
    contactPerson: "Muhammad Ashraf",
    canAlsoBeVendor: true,
  },
  {
    id: "6210002",
    name: "Al-Barkat Cotton Factory",
    nameUrdu: "البرکت کاٹن فیکٹری",
    englishBusinessName: "Al-Barkat Cotton Factory (Pvt) Ltd",
    group: "Cotton Factory",
    town: "Khanewal",
    sector: "Ginning Factory",
    address: "Multan Road, Industrial Area",
    city: "Khanewal",
    mobile: "0301-9988776",
    phone: "065-2233445",
    email: "info@albarkatcotton.example",
    fax: "065-2233446",
    stn: "STN-09-8871",
    ntnCnic: "3520112223",
    bankAccount: "PK00MEZN0009876543210",
    contactPerson: "Zafar Iqbal",
    canAlsoBeVendor: false,
  },
  {
    id: "6210003",
    name: "DHA Traders",
    nameUrdu: "ڈی ایچ اے ٹریڈرز",
    englishBusinessName: "DHA Traders",
    group: "DHA Group",
    town: "Bahawalpur",
    sector: "General Trading",
    address: "Model Town Market",
    city: "Bahawalpur",
    mobile: "0333-4455667",
    phone: "",
    email: "",
    fax: "",
    stn: "",
    ntnCnic: "31303-7654321-9",
    bankAccount: "",
    contactPerson: "Imran Sheikh",
    canAlsoBeVendor: true,
  },
];

export function nextPartyId(existing: Party[]): string {
  const nums = existing.map((p) => parseInt(p.id, 10)).filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 6210000;
  return String(max + 1);
}

export function emptyParty(id: string): Party {
  return {
    id,
    name: "",
    nameUrdu: "",
    englishBusinessName: "",
    group: partyGroups[0],
    town: towns[0],
    sector: sectors[0],
    address: "",
    city: "",
    mobile: "",
    phone: "",
    email: "",
    fax: "",
    stn: "",
    ntnCnic: "",
    bankAccount: "",
    contactPerson: "",
    canAlsoBeVendor: false,
  };
}
