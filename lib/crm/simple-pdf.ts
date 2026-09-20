function ascii(value: unknown) {
  return String(value ?? "")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/£/g, "GBP ")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E\n]/g, "");
}

function esc(value: string) {
  return ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(value: string, max = 88) {
  const paragraphs = ascii(value).split(/\r?\n/);
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) { lines.push(""); continue; }
    const words = paragraph.trim().split(/\s+/);
    let line = "";
    for (const word of words) {
      if (!line) line = word;
      else if (`${line} ${word}`.length <= max) line += ` ${word}`;
      else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
  }
  return lines;
}

export type QuotePdfInput = {
  companyName?: string;
  companyNumber?: string;
  phone?: string;
  email?: string;
  website?: string;
  vatRegistered?: boolean;
  vatNumber?: string;
  reference: string;
  version: number;
  date: string;
  validUntil?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  site: string;
  jobType: string;
  dimensions?: string | null;
  material?: string | null;
  finish?: string | null;
  colour?: string | null;
  customerReference?: string | null;
  scope: string;
  exclusions?: string | null;
  amount: number;
  deposit?: number | null;
  leadTime?: string | null;
  companyAddress?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  sortCode?: string | null;
  defaultDepositPercent?: number;
  quoteValidityDays?: number;
  paymentTerms?: string;
  template?: "mj-signature" | "clean" | "classic";
  accentColour?: string;
};

export function buildQuotePdf(input: QuotePdfInput): Buffer {
  const template=input.template==="mj-signature"||input.template==="classic"?input.template:"clean";
  const hex=String(input.accentColour||"#e66a24").replace("#",""); const rgb=/^[0-9a-fA-F]{6}$/.test(hex)?[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255):[0.90,0.36,0.10]; const accent=template==="classic"?"0 0 0":template==="mj-signature"?rgb.map(x=>x.toFixed(3)).join(" "):"0.18 0.18 0.18";
  type Page = { commands: string[]; y: number };
  const maxPages=2;
  const pages: Page[] = [];
  const newPage = () => {
    const page: Page = { commands: [], y: 790 };
    pages.push(page);
    return page;
  };
  let page = newPage();

  const line = (text: string, size = 10, bold = false, x = 50, spacing = 15) => {
    if (page.y < 65 && pages.length < maxPages) page = newPage();
    page.commands.push(`BT /${bold ? "F2" : "F1"} ${size} Tf 0 0 0 rg ${x} ${page.y} Td (${esc(text)}) Tj ET`);
    page.y -= spacing;
  };
  const gap = (n = 8) => { page.y -= n; if (page.y < 65 && pages.length < maxPages) page = newPage(); };
  const rule = () => { page.commands.push(`${accent} rg 50 ${page.y} 495 ${template==="mj-signature"?3:1} re f`); page.y -= 18; };
  const heading = (text: string) => { gap(4); line(text, 12, true, 50, 18); };
  const paragraph = (text: string, maxLines = 40) => { const lines=wrap(text,88); for (const l of lines.slice(0,maxLines)) line(l || " ", 10, false, 50, 14); if(lines.length>maxLines) line("Continued in project documentation.",9,false,50,13); };

  page.commands.push(`BT /F2 ${template==="classic"?18:22} Tf ${accent} rg 50 800 Td (${esc((input.companyName || "Business").toUpperCase())}) Tj ET`);
  page.commands.push(`BT /F2 ${template==="classic"?16:18} Tf 0 0 0 rg 420 800 Td (${esc("QUOTATION")}) Tj ET`);
  page.y = 768;
  rule();
  line(`${input.reference} / V${input.version}`, 12, true);
  line(`Date: ${input.date}`, 9);
  if (input.validUntil) line(`Valid until: ${input.validUntil}`, 9);
  else if (input.quoteValidityDays) line(`Validity: ${input.quoteValidityDays} days`, 9);
  gap(5);

  heading("Prepared for");
  line(input.customerName, 11, true);
  if (input.site) paragraph(input.site);
  if (input.customerPhone) line(input.customerPhone, 9);
  if (input.customerEmail) line(input.customerEmail, 9);

  heading("Project");
  line(input.jobType, 11, true);
  if (input.dimensions) line(`Approx. dimensions: ${input.dimensions}`, 9);
  if (input.material) line(`Material: ${input.material}`, 9);
  if (input.finish) line(`Finish: ${input.finish}${input.colour ? `, ${input.colour}` : ""}`, 9);
  else if (input.colour) line(`Colour: ${input.colour}`, 9);
  if (input.customerReference) line(`Customer reference: ${input.customerReference}`, 9);

  heading("Scope of works");
  paragraph(input.scope, 24);
  if (input.exclusions) { heading("Notes / exclusions"); paragraph(input.exclusions, 8); }

  heading("Quotation total");
  line(`GBP ${Number(input.amount || 0).toFixed(2)}`, 18, true, 50, 24);
  if (input.deposit) line(`Deposit: GBP ${Number(input.deposit).toFixed(2)}`, 10, true);
  else if (input.defaultDepositPercent) line(`Deposit: ${input.defaultDepositPercent}%`, 10, true);
  if (input.leadTime) line(`Estimated lead time: ${input.leadTime}`, 10);

  if (pages.length < 2) page = newPage();
  page.y=790;
  line("PAYMENT & KEY TERMS",14,true);
  rule();
  const cleanTerms=input.deposit&&input.paymentTerms?input.paymentTerms.replace(/^\s*\d+(?:\.\d+)?%\s+deposit\s*,?\s*/i,""):input.paymentTerms;
  if (cleanTerms) paragraph(`Payment terms: ${input.deposit?`Deposit GBP ${Number(input.deposit).toFixed(2)}. `:""}${cleanTerms}`,12);
  else if(input.deposit) paragraph(`Payment terms: Deposit GBP ${Number(input.deposit).toFixed(2)}. Remaining balance due as agreed.`,12);
  paragraph(`Validity: This quotation is valid for ${input.quoteValidityDays||30} days unless another validity date is shown.`,6);
  paragraph("Scope: The price covers only the works specifically described in this quotation. Additional or changed works will be agreed separately.",6);
  paragraph("Measurements: Final site measurements take precedence over preliminary dimensions.",4);
  paragraph("Lead times: Dates and lead times are estimates and may change due to access, materials or circumstances outside our control.",6);
  paragraph("Ownership: Fabricated items remain the property of the supplier until paid for in full.",4);
  gap(14);
  rule();
  line((input.companyName || "Business").toUpperCase(), 9, true);
  if (input.companyNumber) line(`Company No. ${input.companyNumber}`, 8);
  if (input.companyAddress) line(input.companyAddress, 8);
  if (input.phone) line(input.phone, 8);
  if (input.email) line(input.email, 8);
  if (input.website) line(input.website, 8);
  if (input.bankName) line(`Payment: ${input.bankName}`, 8);
  if (input.sortCode || input.accountNumber) line(`Sort code ${input.sortCode || ""}  Account ${input.accountNumber || ""}`, 8);
  line(input.vatRegistered ? (input.vatNumber ? `VAT ${input.vatNumber}` : "VAT registered") : "VAT not charged", 8);

  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  const pageRefs: number[] = [];
  let next = 5;
  for (const p of pages) {
    const contentNum = next++;
    const pageNum = next++;
    const stream = p.commands.join("\n");
    objects[contentNum] = `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream`;
    objects[pageNum] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNum} 0 R >>`;
    pageRefs.push(pageNum);
  }
  objects[2] = `<< /Type /Pages /Kids [${pageRefs.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`;

  let pdf = "%PDF-1.4\n%CRMQuote\n";
  const offsets: number[] = [0];
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = Buffer.byteLength(pdf, "ascii");
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "ascii");
}
