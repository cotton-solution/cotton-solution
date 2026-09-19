/**
 * Properly formatted voucher PDF — used by the Print and Download PDF
 * buttons on every voucher screen.
 *
 * Built with pdf-lib (pure JS, runs in the browser, no server round
 * trip). Standard PDF fonts only, so any character outside Latin-1 is
 * swapped for "?" rather than crashing the export.
 */

import { formatAmount } from "@/lib/format";

export type VoucherPdfLine = {
  accountNo: string;
  accountName: string;
  narration: string;
  debit: number;
  credit: number;
};

export type VoucherPdfData = {
  business: {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    taxNumber?: string | null;
  };
  /** PNG bytes of the business logo, if it could be loaded. */
  logoPng?: Uint8Array | null;
  title: string;
  voucherNo: string;
  date: string; // YYYY-MM-DD
  chequeNo?: string | null;
  chequeDate?: string | null;
  lines: VoucherPdfLine[];
  preparedBy?: string | null;
};

/* ------------------------------------------------------------------ */
/* Amount in words (South Asian: thousand / lakh / crore)              */
/* ------------------------------------------------------------------ */

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function below100(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}

function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? ONES[h] + " Hundred" : "", r ? below100(r) : ""]
    .filter(Boolean)
    .join(" ");
}

function wholeToWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  // "crore" itself can be large (e.g. 150 crore) — read it recursively.
  if (crore) parts.push((crore >= 100 ? wholeToWords(crore) : below100(crore)) + " Crore");
  if (lakh) parts.push(below100(lakh) + " Lakh");
  if (thousand) parts.push(below100(thousand) + " Thousand");
  if (n) parts.push(below1000(n));
  return parts.join(" ");
}

/** 125050.5 -> "Rupees One Lakh Twenty Five Thousand Fifty and Fifty Paisa Only" */
export function amountInWords(value: number): string {
  const safe = Number.isFinite(value) ? Math.abs(value) : 0;
  const rupees = Math.floor(safe);
  const paisa = Math.round((safe - rupees) * 100);
  let out = `Rupees ${wholeToWords(rupees)}`;
  if (paisa > 0) out += ` and ${below100(paisa)} Paisa`;
  return out + " Only";
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Standard PDF fonts speak WinAnsi — keep Latin-1, blank out the rest. */
function clean(text: string | null | undefined): string {
  return (text ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?")
    .trim();
}

function prettyDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Measurer = { widthOfTextAtSize(text: string, size: number): number };

function wrap(text: string, font: Measurer, size: number, maxWidth: number): string[] {
  const words = clean(text).split(" ").filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(attempt, size) <= maxWidth) {
      current = attempt;
      continue;
    }
    if (current) lines.push(current);
    // A single very long word: hard-split it so it never overflows.
    let rest = word;
    while (font.widthOfTextAtSize(rest, size) > maxWidth && rest.length > 1) {
      let cut = rest.length - 1;
      while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) cut--;
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    current = rest;
  }
  if (current) lines.push(current);
  return lines;
}

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

export async function buildVoucherPdf(data: VoucherPdfData): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const doc = await PDFDocument.create();
  doc.setTitle(`${data.title} ${data.voucherNo}`);
  doc.setCreator(clean(data.business.name) || "Voucher");
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let logo: Awaited<ReturnType<typeof doc.embedPng>> | null = null;
  if (data.logoPng?.length) {
    try {
      logo = await doc.embedPng(data.logoPng);
    } catch {
      logo = null;
    }
  }

  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const M = 40;
  const CONTENT_W = PAGE_W - M * 2;

  const ink = rgb(0.09, 0.11, 0.16);
  const muted = rgb(0.42, 0.45, 0.5);
  const line = rgb(0.8, 0.83, 0.87);
  const tint = rgb(0.95, 0.96, 0.97);

  // Column layout (left edges); Debit / Credit are right-aligned.
  const COL_NO = M + 6;
  const W_NO = 56;
  const COL_NAME = COL_NO + W_NO + 6;
  const W_NAME = 130;
  const COL_NARR = COL_NAME + W_NAME + 6;
  const RIGHT_CREDIT = PAGE_W - M - 6;
  const RIGHT_DEBIT = RIGHT_CREDIT - 84;

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - M;

  const text = (
    t: string,
    x: number,
    yy: number,
    size = 9,
    f = regular,
    color = ink
  ) => page.drawText(clean(t), { x, y: yy, size, font: f, color });

  const textRight = (t: string, xRight: number, yy: number, size = 9, f = regular, color = ink) => {
    const c = clean(t);
    page.drawText(c, { x: xRight - f.widthOfTextAtSize(c, size), y: yy, size, font: f, color });
  };

  const hr = (yy: number, thickness = 0.6, color = line) =>
    page.drawLine({
      start: { x: M, y: yy },
      end: { x: PAGE_W - M, y: yy },
      thickness,
      color,
    });

  /* ---------------- Letterhead ---------------- */
  const LOGO = 48;
  let textX = M;
  if (logo) {
    const scale = Math.min(LOGO / logo.width, LOGO / logo.height);
    const w = logo.width * scale;
    const h = logo.height * scale;
    page.drawImage(logo, { x: M, y: y - h, width: w, height: h });
    textX = M + LOGO + 12;
  }

  const bizName = clean(data.business.name) || "Business";
  text(bizName, textX, y - 14, 17, bold);
  let hy = y - 14;
  const contactBits = [
    data.business.address,
    [data.business.phone && `Tel: ${data.business.phone}`, data.business.email]
      .filter(Boolean)
      .join("   "),
    data.business.taxNumber ? `NTN / Tax No: ${data.business.taxNumber}` : "",
  ].filter((v): v is string => !!v && !!v.trim());
  for (const bit of contactBits) {
    for (const l of wrap(bit, regular, 8.5, PAGE_W - M - textX)) {
      hy -= 12;
      text(l, textX, hy, 8.5, regular, muted);
    }
  }
  y = Math.min(hy, y - LOGO) - 12;
  hr(y, 1.2, ink);
  y -= 22;

  /* ---------------- Title band ---------------- */
  page.drawRectangle({ x: M, y: y - 8, width: CONTENT_W, height: 26, color: tint });
  const title = clean(data.title).toUpperCase();
  const tw = bold.widthOfTextAtSize(title, 12.5);
  text(title, (PAGE_W - tw) / 2, y, 12.5, bold);
  y -= 30;

  /* ---------------- Meta ---------------- */
  text("Voucher No:", M, y, 9, regular, muted);
  text(data.voucherNo, M + 62, y, 10, bold);
  const dateStr = prettyDate(data.date);
  textRight(dateStr, PAGE_W - M, y, 10, bold);
  textRight("Date:", PAGE_W - M - bold.widthOfTextAtSize(dateStr, 10) - 6, y, 9, regular, muted);

  if (data.chequeNo || data.chequeDate) {
    y -= 16;
    const parts: string[] = [];
    if (data.chequeNo) parts.push(`Cheque No: ${data.chequeNo}`);
    if (data.chequeDate) parts.push(`Cheque Date: ${prettyDate(data.chequeDate)}`);
    text(parts.join("      "), M, y, 9);
  }
  y -= 20;

  /* ---------------- Table ---------------- */
  const drawTableHead = () => {
    page.drawRectangle({ x: M, y: y - 20, width: CONTENT_W, height: 20, color: ink });
    const white = rgb(1, 1, 1);
    const by = y - 14;
    text("A/C NO", COL_NO, by, 8, bold, white);
    text("ACCOUNT NAME", COL_NAME, by, 8, bold, white);
    text("NARRATION", COL_NARR, by, 8, bold, white);
    textRight("DEBIT", RIGHT_DEBIT, by, 8, bold, white);
    textRight("CREDIT", RIGHT_CREDIT, by, 8, bold, white);
    y -= 20;
  };

  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - M;
    drawTableHead();
  };

  drawTableHead();

  const narrW = Math.max(60, RIGHT_DEBIT - 84 - COL_NARR - 6);
  const LINE_H = 11;
  const ROW_PAD = 5;

  let totalDebit = 0;
  let totalCredit = 0;

  data.lines.forEach((l, i) => {
    totalDebit += l.debit;
    totalCredit += l.credit;

    const nameLines = wrap(l.accountName, regular, 9, W_NAME);
    const narrLines = wrap(l.narration, regular, 9, narrW);
    const rows = Math.max(nameLines.length, narrLines.length, 1);
    const rowH = rows * LINE_H + ROW_PAD * 2;

    if (y - rowH < M + 200) newPage(); // keep room for totals + signatures

    const rowTop = y;
    const rowBottom = y - rowH;
    if (i % 2 === 1) {
      page.drawRectangle({ x: M, y: rowBottom, width: CONTENT_W, height: rowH, color: rgb(0.975, 0.98, 0.985) });
    }
    const baseY = rowTop - ROW_PAD - 8;
    text(l.accountNo, COL_NO, baseY, 9, regular, muted);
    nameLines.forEach((t, k) => text(t, COL_NAME, baseY - k * LINE_H, 9));
    narrLines.forEach((t, k) => text(t, COL_NARR, baseY - k * LINE_H, 9, regular, muted));
    if (l.debit) textRight(formatAmount(l.debit, true), RIGHT_DEBIT, baseY, 9, bold);
    if (l.credit) textRight(formatAmount(l.credit, true), RIGHT_CREDIT, baseY, 9, bold);

    page.drawLine({
      start: { x: M, y: rowBottom },
      end: { x: PAGE_W - M, y: rowBottom },
      thickness: 0.4,
      color: line,
    });
    y = rowBottom;
  });

  // Totals row
  page.drawRectangle({ x: M, y: y - 22, width: CONTENT_W, height: 22, color: tint });
  text("TOTAL", COL_NAME, y - 15, 9.5, bold);
  textRight(formatAmount(totalDebit, true), RIGHT_DEBIT, y - 15, 9.5, bold);
  textRight(formatAmount(totalCredit, true), RIGHT_CREDIT, y - 15, 9.5, bold);
  y -= 22 + 26;

  /* ---------------- Amount in words ---------------- */
  const words = amountInWords(Math.max(totalDebit, totalCredit));
  text("Amount in words", M, y, 8.5, regular, muted);
  y -= 13;
  for (const l of wrap(words, bold, 10, CONTENT_W)) {
    text(l, M, y, 10, bold);
    y -= 13;
  }

  /* ---------------- Signatures ---------------- */
  const sigY = Math.min(y - 46, M + 70);
  const labels = ["Prepared By", "Checked By", "Approved By", "Received By"];
  const gap = 18;
  const sigW = (CONTENT_W - gap * (labels.length - 1)) / labels.length;
  labels.forEach((label, i) => {
    const x = M + i * (sigW + gap);
    if (label === "Prepared By" && data.preparedBy) {
      const n = clean(data.preparedBy);
      text(n, x + (sigW - regular.widthOfTextAtSize(n, 8.5)) / 2, sigY + 5, 8.5, regular, muted);
    }
    page.drawLine({ start: { x, y: sigY }, end: { x: x + sigW, y: sigY }, thickness: 0.7, color: ink });
    text(label, x + (sigW - regular.widthOfTextAtSize(label, 8.5)) / 2, sigY - 12, 8.5, regular, muted);
  });

  /* ---------------- Footer on every page ---------------- */
  const pages = doc.getPages();
  const printed = new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: M - 6 }, end: { x: PAGE_W - M, y: M - 6 }, thickness: 0.4, color: line });
    p.drawText(clean(`${bizName}  |  ${data.title} ${data.voucherNo}  |  Printed ${printed}`), {
      x: M, y: M - 18, size: 7.5, font: regular, color: muted,
    });
    const pn = `Page ${i + 1} of ${pages.length}`;
    p.drawText(pn, {
      x: PAGE_W - M - regular.widthOfTextAtSize(pn, 7.5), y: M - 18, size: 7.5, font: regular, color: muted,
    });
  });

  return doc.save();
}

/* ------------------------------------------------------------------ */
/* Browser helpers                                                     */
/* ------------------------------------------------------------------ */

/** Loads the business logo and re-encodes it as PNG (handles JPG / WebP
 *  too). Returns null if the image can't be read — the voucher then
 *  simply prints without a logo. */
export async function loadLogoAsPng(url: string | null | undefined): Promise<Uint8Array | null> {
  if (!url || typeof document === "undefined") return null;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("logo failed to load"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    // Cap the size so the PDF stays small.
    const scale = Math.min(1, 400 / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
    if (!blob) return null;
    return new Uint8Array(await blob.arrayBuffer());
  } catch {
    return null;
  }
}

function toBlobUrl(bytes: Uint8Array): string {
  // Copy into a fresh ArrayBuffer so the Blob typing is unambiguous.
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return URL.createObjectURL(new Blob([copy.buffer], { type: "application/pdf" }));
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const url = toBlobUrl(bytes);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/** Opens the browser's print dialog for the PDF. If the browser won't
 *  print from a hidden frame, the PDF opens in a new tab instead (which
 *  has its own print button). */
export function printPdf(bytes: Uint8Array) {
  const url = toBlobUrl(bytes);
  const frame = document.createElement("iframe");
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;";
  frame.src = url;
  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {
      window.open(url, "_blank");
    }
  };
  document.body.appendChild(frame);
  setTimeout(() => {
    frame.remove();
    URL.revokeObjectURL(url);
  }, 5 * 60 * 1000);
}
