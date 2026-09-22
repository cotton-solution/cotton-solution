export type Party = {
  id: string;
  /**
   * The Party sub head (Buyer / Seller / Misc Parties / your own) this party is
   * listed under in the Chart of Accounts. Left empty it follows the party's ID
   * block (62… = Buyer, 63… = Seller, 64… = Misc Parties).
   */
  subHeadCode?: string;
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
  beneficiaryName: string;
  contactPerson: string;
  canAlsoBeVendor: boolean;
  /** Region / Territory / Ranking — free-form groupings used by the
   *  Parties Information popup, independent of Town/Sector above. */
  region: string;
  territory: string;
  ranking: string;
  /** Filled in by hand for a party carried over from another system;
   *  otherwise leave blank and the auto Account No is used. */
  manualNo: string;
  debitLimit: number;
  creditLimit: number;
  province: string;
  hsCode: string;
  efsCode: string;
  isActive: boolean;
};

/** The Party sub heads every business starts with (they can add more in Chart of Accounts). */
export const defaultPartySubHeads = [
  { code: "6200000", name: "Buyer" },
  { code: "6300000", name: "Seller" },
  { code: "6400000", name: "Misc Parties" },
];
export const SELLER_HEAD_CODE = "6300000";

/** A party's ID block tells which sub head it belongs to: 6210001 -> 6200000. */
export function subHeadFromId(id: string): string {
  const n = parseInt(id, 10);
  if (isNaN(n) || n < 6000000 || n >= 7000000) return defaultPartySubHeads[0].code;
  return String(Math.floor(n / 100000) * 100000);
}

/** The sub head this party is listed under. */
export function partySubHead(p: Party): string {
  return p.subHeadCode || subHeadFromId(p.id);
}

/** Sellers are always vendors; any other party can be flagged as one too. */
export function isVendorParty(p: Party): boolean {
  return p.canAlsoBeVendor || partySubHead(p) === SELLER_HEAD_CODE;
}

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
    beneficiaryName: "Muhammad Ashraf",
    region: "South Punjab",
    territory: "Multan Zone",
    ranking: "A",
    manualNo: "",
    debitLimit: 500000,
    creditLimit: 500000,
    province: "Punjab",
    hsCode: "",
    efsCode: "",
    isActive: true,
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
    beneficiaryName: "Al-Barkat Cotton Factory (Pvt) Ltd",
    region: "South Punjab",
    territory: "Khanewal Zone",
    ranking: "B",
    manualNo: "",
    debitLimit: 0,
    creditLimit: 300000,
    province: "Punjab",
    hsCode: "",
    efsCode: "",
    isActive: true,
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
    beneficiaryName: "",
    region: "South Punjab",
    territory: "Bahawalpur Zone",
    ranking: "C",
    manualNo: "",
    debitLimit: 100000,
    creditLimit: 100000,
    province: "Punjab",
    hsCode: "",
    efsCode: "",
    isActive: true,
  },
];

/**
 * Next free party ID inside a sub head's block: under Buyer (6200000) that is
 * 6210001, 6210002…; under Seller (6300000) 6310001…; and so on.
 */
export function nextPartyId(
  existing: Party[],
  subHeadCode: string = defaultPartySubHeads[0].code
): string {
  const base = parseInt(subHeadCode, 10) + 10000;
  const nums = existing
    .map((p) => parseInt(p.id, 10))
    .filter((n) => !isNaN(n) && n > base && n < base + 90000);
  const max = nums.length ? Math.max(...nums) : base;
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
    beneficiaryName: "",
    contactPerson: "",
    canAlsoBeVendor: false,
    region: "",
    territory: "",
    ranking: "",
    manualNo: "",
    debitLimit: 0,
    creditLimit: 0,
    province: "Punjab",
    hsCode: "",
    efsCode: "",
    isActive: true,
  };
}

/** Ranking options for the Parties Information popup. */
export const partyRankings = ["A", "B", "C", "D"];
export const provinces = ["Punjab", "Sindh", "KPK", "Balochistan", "Islamabad (ICT)", "AJK", "Gilgit-Baltistan"];

/**
 * A/C Extension: the digits of a party's ID after its sub head block —
 * e.g. under Buyer (6200000) party 6210001 has extension "10001".
 * The popup shows Parent Account + A/C Extension and computes Account No
 * as their sum, exactly like the legacy desktop screen.
 */
export function accountExtensionOf(partyId: string, subHeadCode: string): string {
  const n = parseInt(partyId, 10) - parseInt(subHeadCode || "0", 10);
  return n > 0 ? String(n) : "";
}

export function computeAccountNo(subHeadCode: string, extension: string): string {
  const base = parseInt(subHeadCode, 10) || 0;
  const ext = parseInt(extension, 10) || 0;
  if (!base || !ext) return "";
  return String(base + ext);
}
