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

export function buildQuotePdf(input: QuotePdfInput): Buffer {
  const template=input.template==="mj-signature"||input.template==="classic"?input.template:"clean";
  const hex=String(input.accentColour||"#e66a24").replace("#","");
  const rgb=/^[0-9a-fA-F]{6}$/.test(hex)?[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255):[0.90,0.36,0.10];
  const accent=template==="classic"?"0 0 0":rgb.map(x=>x.toFixed(3)).join(" ");
  type Page={commands:string[];y:number};
  const pages:Page[]=[];
  const newPage=()=>{const p={commands:[],y:790};pages.push(p);return p;};
  let page=newPage();
  const text=(value:string,size=10,bold=false,x=50,y?:number)=>{const yy=y??page.y;page.commands.push(`BT /${bold?"F2":"F1"} ${size} Tf 0 0 0 rg ${x} ${yy} Td (${esc(value)}) Tj ET`);if(y===undefined)page.y-=size+5;};
  const orangeText=(value:string,size=10,bold=false,x=50,y?:number)=>{const yy=y??page.y;page.commands.push(`BT /${bold?"F2":"F1"} ${size} Tf ${accent} rg ${x} ${yy} Td (${esc(value)}) Tj ET`);if(y===undefined)page.y-=size+5;};
  const rule=(y:number,h=2)=>page.commands.push(`${accent} rg 50 ${y} 495 ${h} re f`);
  const para=(value:string,max=88,size=10,leading=14,maxLines=30)=>{for(const l of wrap(value,max).slice(0,maxLines)){text(l||" ",size,false,50);page.y-=Math.max(0,leading-size-5);}};
  const heading=(value:string)=>{page.y-=5;text(value,12,true);rule(page.y+5,1);page.y-=6;};

  if(template==="mj-signature"){
    orangeText((input.companyName||"Business").toUpperCase(),26,true,50,800);
    text("PROFESSIONAL QUOTATION & PROJECT PROPOSAL",18,true,50,752);
    orangeText("Built Strong. Built to Last.",12,true,50,728);
    page.y=690;
    if(input.companyAddress) para(input.companyAddress,82,9,13,3);
    const contact=[input.email,input.website,input.phone].filter(Boolean).join("   ");
    if(contact) text(contact,9,false);
    page.y-=16; rule(page.y,3); page.y-=25;

    heading("Client Information");
    text(`Quotation: ${input.reference} / V${input.version}    Date issued: ${input.date}`,10,true);
    text(`Client: ${input.customerName}`,10);
    if(input.site) para(`Project address: ${input.site}`,82,10,14,3);
    if(input.customerPhone) text(`Contact: ${input.customerPhone}`,9);
    if(input.customerEmail) text(`Email: ${input.customerEmail}`,9);

    heading("Project Overview & Lead Times");
    para(input.scope,88,10,14,24);
    if(input.dimensions) text(`Approx. dimensions: ${input.dimensions}`,9);
    if(input.material) text(`Material: ${input.material}`,9);
    if(input.finish) text(`Finish: ${input.finish}${input.colour?`, ${input.colour}`:""}`,9);
    if(input.leadTime) text(`Estimated lead time: ${input.leadTime}`,9);
    text(`Price: GBP ${Number(input.amount||0).toFixed(2)}`,13,true);
    text(input.vatRegistered&&Number(input.vatRate||0)>0?`VAT: ${Number(input.vatRate)}%`:"No VAT charge.",9);

    if(input.exclusions){heading("Project Specific Exclusions");para(input.exclusions,88,9,13,10);}

    if(page.y<250) page=newPage();
    heading("Payment Terms & Details");
    const cleanTerms=input.deposit&&input.paymentTerms?input.paymentTerms.replace(/^\\s*\\d+(?:\\.\\d+)?%\\s+deposit\\s*,?\\s*/i,""):input.paymentTerms;
    para(input.deposit?`Deposit: GBP ${Number(input.deposit).toFixed(2)}. ${cleanTerms||"Remaining balance due on completion."}`:(cleanTerms||"Payment terms as agreed for this project."),88,9,13,6);
    text("Ownership of fabricated items remains with M&J Metal until paid in full.",9);
    if(input.bankName) text(`Account Name: ${input.bankName}`,9);
    if(input.accountNumber) text(`Account Number: ${input.accountNumber}`,9);
    if(input.sortCode) text(`Sort Code: ${input.sortCode}`,9);

    heading("Assumptions & Quality");
    para("This quotation excludes works not specifically listed, including electrical work, decorating, planning applications, unforeseen structural alterations and additional requested works. M&J Metal specialises in high-quality bespoke metalwork, delivering durable, secure and professionally fabricated products built to last.",88,9,13,8);

    heading("Terms & Conditions");
    para(`This quotation remains valid for ${input.quoteValidityDays||30} days. Final measurements from site surveys take precedence over preliminary dimensions. Any variations to specification or access requirements may result in revised pricing. Delays caused by circumstances outside our control may affect lead times.`,88,9,13,8);

    heading("Acceptance of Quotation");
    para(`I/We accept this quotation and authorise ${input.companyName||"the supplier"} to proceed with the works described above.`,88,9,13,4);
    page.y-=22;
    text("Client Name: ____________________    Signature: ____________________    Date: ____________",9);
  } else {
    orangeText((input.companyName||"Business").toUpperCase(),22,true,50,800);
    text("QUOTATION",18,true,420,800); page.y=768; rule(page.y,2); page.y-=18;
    text(`${input.reference} / V${input.version}`,12,true); text(`Date: ${input.date}`,9);
    if(input.validUntil) text(`Valid until: ${input.validUntil}`,9);
    heading("Prepared for"); text(input.customerName,11,true); if(input.site)para(input.site);
    heading("Project"); text(input.jobType,11,true);
    heading("Scope of works"); para(input.scope,88,10,14,24);
    if(input.exclusions){heading("Notes / exclusions");para(input.exclusions,88,10,14,10);}
    heading("Quotation total"); text(`GBP ${Number(input.amount||0).toFixed(2)}`,18,true);
    if(input.deposit)text(`Deposit: GBP ${Number(input.deposit).toFixed(2)}`,10,true);
    page=newPage(); heading("PAYMENT & KEY TERMS");
    para(input.paymentTerms||"Payment terms as agreed for this project.",88,10,14,8);
    para(`Validity: ${input.quoteValidityDays||30} days.`,88,10,14,4);
  }

  const objects:string[]=[];
  objects[1]="<< /Type /Catalog /Pages 2 0 R >>";
  objects[3]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  const pageRefs:number[]=[];let next=5;
  for(const p of pages){const contentNum=next++,pageNum=next++,stream=p.commands.join("\\n");objects[contentNum]=`<< /Length ${Buffer.byteLength(stream,"ascii")} >>\\nstream\\n${stream}\\nendstream`;objects[pageNum]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNum} 0 R >>`;pageRefs.push(pageNum);}
  objects[2]=`<< /Type /Pages /Kids [${pageRefs.map(n=>`${n} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`;
  let pdf="%PDF-1.4\\n%CRMQuote\\n";const offsets:number[]=[0];
  for(let i=1;i<objects.length;i++){offsets[i]=Buffer.byteLength(pdf,"ascii");pdf+=`${i} 0 obj\\n${objects[i]}\\nendobj\\n`;}
  const xref=Buffer.byteLength(pdf,"ascii");pdf+=`xref\\n0 ${objects.length}\\n0000000000 65535 f \\n`;
  for(let i=1;i<objects.length;i++)pdf+=`${String(offsets[i]).padStart(10,"0")} 00000 n \\n`;
  pdf+=`trailer\\n<< /Size ${objects.length} /Root 1 0 R >>\\nstartxref\\n${xref}\\n%%EOF\\n`;
  return Buffer.from(pdf,"ascii");
}
