import { readFileSync } from "fs";
import { join } from "path";
import { inflateSync, deflateSync } from "zlib";

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
  vatRate?: number;
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

function logoImage() {
  try {
    const png=readFileSync(join(process.cwd(),"public","images","logo.png"));
    if(png.toString("ascii",1,4)!=="PNG") return null;
    let pos=8,width=0,height=0,bit=0,type=0; const chunks:Buffer[]=[];
    while(pos<png.length){const len=png.readUInt32BE(pos);const kind=png.toString("ascii",pos+4,pos+8);const data=png.subarray(pos+8,pos+8+len);pos+=12+len;
      if(kind==="IHDR"){width=data.readUInt32BE(0);height=data.readUInt32BE(4);bit=data[8];type=data[9];}
      if(kind==="IDAT")chunks.push(data); if(kind==="IEND")break;
    }
    if(bit!==8||![2,6].includes(type)||!width||!height)return null;
    const bpp=type===6?4:3,row=width*bpp,raw=inflateSync(Buffer.concat(chunks)),rgb=Buffer.alloc(width*height*3);
    let prev=Buffer.alloc(row),off=0,out=0;
    const paeth=(a:number,b:number,c:number)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
    for(let y=0;y<height;y++){const filter=raw[off++],cur=Buffer.alloc(row);for(let x=0;x<row;x++){const v=raw[off++],left=x>=bpp?cur[x-bpp]:0,up=prev[x]||0,ul=x>=bpp?prev[x-bpp]:0;cur[x]=(v+(filter===0?0:filter===1?left:filter===2?up:filter===3?Math.floor((left+up)/2):paeth(left,up,ul)))&255;}
      for(let x=0;x<width;x++){const i=x*bpp,alpha=type===6?cur[i+3]/255:1;rgb[out++]=Math.round(cur[i]*alpha+255*(1-alpha));rgb[out++]=Math.round(cur[i+1]*alpha+255*(1-alpha));rgb[out++]=Math.round(cur[i+2]*alpha+255*(1-alpha));}prev=cur;}
    return {width,height,data:deflateSync(rgb)};
  } catch { return null; }
}

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

  const logo=template==="mj-signature"?logoImage():null;
  if(logo){
    const maxW=112,maxH=44,scale=Math.min(maxW/logo.width,maxH/logo.height),w=logo.width*scale,h=logo.height*scale;
    page.commands.push(`q ${w.toFixed(1)} 0 0 ${h.toFixed(1)} 50 ${(810-h).toFixed(1)} cm /Im1 Do Q`);
  } else {
    page.commands.push(`BT /F2 ${template==="classic"?18:22} Tf ${accent} rg 50 800 Td (${esc((input.companyName || "Business").toUpperCase())}) Tj ET`);
  }
  page.commands.push(`BT /F2 ${template==="mj-signature"?15:template==="classic"?16:18} Tf 0 0 0 rg ${template==="mj-signature"?330:420} 802 Td (${esc(template==="mj-signature"?"QUOTATION":"QUOTATION")}) Tj ET`);
  if(template==="mj-signature") page.commands.push(`BT /F1 8 Tf 0.35 0.35 0.35 rg 330 786 Td (${esc("BESPOKE METALWORK PROPOSAL")}) Tj ET`);
  page.y = template==="mj-signature"?750:768;
  rule();
  line(template==="mj-signature"?input.reference:`${input.reference} / V${input.version}`, 12, true);
  line(`Date: ${input.date}`, 9);
  if (input.validUntil) line(`Valid until: ${input.validUntil}`, 9);
  else if (input.quoteValidityDays) line(`Validity: ${input.quoteValidityDays} days`, 9);
  gap(5);

  heading(template==="mj-signature" ? "Client Information" : "Prepared for");
  line(input.customerName, 11, true);
  if (input.site) paragraph(input.site);
  if (input.customerPhone) line(input.customerPhone, 9);
  if (input.customerEmail) line(input.customerEmail, 9);

  heading(template==="mj-signature" ? "Project Details" : "Project");
  line(input.jobType, 11, true);
  if (input.dimensions) line(`Approx. dimensions: ${input.dimensions}`, 9);
  if (input.material) line(`Material: ${input.material}`, 9);
  if (input.finish) line(`Finish: ${input.finish}${input.colour ? `, ${input.colour}` : ""}`, 9);
  else if (input.colour) line(`Colour: ${input.colour}`, 9);
  if (input.customerReference) line(`Customer reference: ${input.customerReference}`, 9);

  heading("Scope of Works");
  paragraph(input.scope, 24);
  if (input.exclusions) { heading(template==="mj-signature" ? "Project Specific Exclusions" : "Notes / exclusions"); paragraph(input.exclusions, 8); }

  gap(6); rule(); heading("Quotation");
  line(`Total: GBP ${Number(input.amount || 0).toFixed(2)}`, 16, true, 50, 22);
  if (input.deposit) line(`Deposit: GBP ${Number(input.deposit).toFixed(2)}`, 10, true);
  else if (input.defaultDepositPercent) line(`Deposit: ${input.defaultDepositPercent}%`, 10, true);
  if (input.leadTime) line(`Estimated lead time: ${input.leadTime}`, 10);

  if (pages.length < 2) page = newPage();
  page.y=790;
  line(template==="mj-signature" ? "TERMS, PAYMENT & ACCEPTANCE" : "PAYMENT & KEY TERMS",14,true);
  rule();
  const cleanTerms=input.deposit&&input.paymentTerms?input.paymentTerms.replace(/^\s*\d+(?:\.\d+)?%\s+deposit\s*,?\s*/i,""):input.paymentTerms;
  if (cleanTerms) paragraph(`Payment terms: ${input.deposit?`Deposit GBP ${Number(input.deposit).toFixed(2)}. `:""}${cleanTerms}`,12);
  else if(input.deposit) paragraph(`Payment terms: Deposit GBP ${Number(input.deposit).toFixed(2)}. Remaining balance due as agreed.`,12);
  paragraph(`Validity: This quotation is valid for ${input.quoteValidityDays||30} days unless another validity date is shown.`,6);
  paragraph("Scope: The price covers only the works specifically described in this quotation. Additional or changed works will be agreed separately.",6);
  paragraph("Measurements: Final site measurements take precedence over preliminary dimensions.",4);
  paragraph("Lead times: Dates and lead times are estimates and may change due to access, materials or circumstances outside our control.",6);
  paragraph(template==="mj-signature" ? "Ownership: Fabricated items remain the property of M&J Metal Ltd until paid for in full." : "Ownership: Fabricated items remain the property of the supplier until paid for in full.",4);
  if(template==="mj-signature"){
    gap(8); heading("Assumptions & Quality");
    paragraph("Unless specifically included in the scope, this quotation excludes electrical work, decorating, planning applications, unforeseen structural alterations and additional requested works. M&J Metal specialises in high-quality bespoke metalwork, delivering durable, secure and professionally fabricated products built to last.",10);
    heading("Terms & Conditions");
    paragraph(`This quotation remains valid for ${input.quoteValidityDays||30} days. Final site measurements take precedence over preliminary dimensions. Variations to specification, site conditions or access requirements may affect the price or programme.`,8);
    heading("Acceptance of Quotation");
    paragraph(`I/We accept this quotation and authorise ${input.companyName||"the supplier"} to proceed with the works described above.`,4);
    gap(8); line("Client Name: ____________________   Signature: ____________________   Date: ____________",8);
  }
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
  line(input.vatRegistered && Number(input.vatRate||0)>0 ? `${input.vatNumber ? `VAT ${input.vatNumber} - ` : ""}VAT ${Number(input.vatRate)}%` : "VAT not charged", 8);

  const objects: (string|Buffer)[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  const logoObj=logo?5:0;
  if(logo) objects[5]=Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${logo.data.length} >>\nstream\n`,"ascii"),logo.data,Buffer.from("\nendstream","ascii")]);
  const pageRefs: number[] = [];
  let next = logo?6:5;
  for (const p of pages) {
    const contentNum = next++;
    const pageNum = next++;
    const stream = p.commands.join("\n");
    objects[contentNum] = `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream`;
    objects[pageNum] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>${logoObj?" /XObject << /Im1 5 0 R >>":""} >> /Contents ${contentNum} 0 R >>`;
    pageRefs.push(pageNum);
  }
  objects[2] = `<< /Type /Pages /Kids [${pageRefs.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`;

  const parts:Buffer[]=[Buffer.from("%PDF-1.4\n%CRMQuote\n","ascii")]; const offsets:number[]=[0]; let length=parts[0].length;
  for(let i=1;i<objects.length;i++){offsets[i]=length;const head=Buffer.from(`${i} 0 obj\n`,"ascii"),body=Buffer.isBuffer(objects[i])?objects[i] as Buffer:Buffer.from(String(objects[i]),"ascii"),tail=Buffer.from("\nendobj\n","ascii");parts.push(head,body,tail);length+=head.length+body.length+tail.length;}
  const xref=length;let trailer=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let i=1;i<objects.length;i++)trailer+=`${String(offsets[i]).padStart(10,"0")} 00000 n \n`;trailer+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;parts.push(Buffer.from(trailer,"ascii"));return Buffer.concat(parts);
}
