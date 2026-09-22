"use client";

import { useState } from "react";

declare global {
  interface Window { html2canvas?: (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>; }
}

function bytes(text:string){return new TextEncoder().encode(text);}
function join(parts:Uint8Array[]){const n=parts.reduce((s,p)=>s+p.length,0),out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;}
async function jpegBytes(canvas:HTMLCanvasElement){const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Could not render quote")),"image/jpeg",0.96));return new Uint8Array(await blob.arrayBuffer());}
function pdfFromPages(images:{data:Uint8Array;width:number;height:number}[]){
  const parts:Uint8Array[]=[bytes("%PDF-1.4\n%M&J Quote\n")], offsets:number[]=[0]; let length=parts[0].length;
  const add=(num:number,body:Uint8Array)=>{offsets[num]=length;const h=bytes(`${num} 0 obj\n`),t=bytes("\nendobj\n");parts.push(h,body,t);length+=h.length+body.length+t.length;};
  const pageNums=images.map((_,i)=>3+i*3), imageNums=images.map((_,i)=>4+i*3), contentNums=images.map((_,i)=>5+i*3);
  add(1,bytes("<< /Type /Catalog /Pages 2 0 R >>"));
  add(2,bytes(`<< /Type /Pages /Kids [${pageNums.map(n=>`${n} 0 R`).join(" ")}] /Count ${images.length} >>`));
  images.forEach((img,i)=>{
    const page=pageNums[i],image=imageNums[i],content=contentNums[i],stream=bytes(`q\n595 0 0 842 0 0 cm\n/Im0 Do\nQ\n`);
    add(page,bytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${image} 0 R >> >> /Contents ${content} 0 R >>`));
    add(image,join([bytes(`<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.data.length} >>\nstream\n`),img.data,bytes("\nendstream")]));
    add(content,join([bytes(`<< /Length ${stream.length} >>\nstream\n`),stream,bytes("endstream")]));
  });
  const size=2+images.length*3,xref=length;let trailer=`xref\n0 ${size+1}\n0000000000 65535 f \n`;for(let i=1;i<=size;i++)trailer+=`${String(offsets[i]).padStart(10,"0")} 00000 n \n`;trailer+=`trailer\n<< /Size ${size+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;parts.push(bytes(trailer));return join(parts);
}
async function ensureRenderer(){
  if(window.html2canvas)return;
  await new Promise<void>((resolve,reject)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";s.onload=()=>resolve();s.onerror=()=>reject(new Error("Could not load PDF renderer"));document.head.appendChild(s);});
}

export default function QuotePdfActions({ reference, quoteId }: { reference: string; quoteId: string }) {
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  async function generate(){
    setBusy(true);setMessage("Creating PDF...");
    try{
      await ensureRenderer();
      const pages=Array.from(document.querySelectorAll<HTMLElement>(".quote-page")).filter(el=>getComputedStyle(el).display!=="none");
      if(!pages.length||!window.html2canvas)throw new Error("Quote preview is not ready");
      const images=[] as {data:Uint8Array;width:number;height:number}[];
      for(const page of pages){const canvas=await window.html2canvas(page,{scale:2,useCORS:true,backgroundColor:"#ffffff",logging:false});images.push({data:await jpegBytes(canvas),width:canvas.width,height:canvas.height});}
      const pdf=pdfFromPages(images),blob=new Blob([pdf],{type:"application/pdf"});
      setMessage("Saving PDF to job...");
      const response=await fetch(`/api/admin/jobs/${encodeURIComponent(reference)}/quotes/${encodeURIComponent(quoteId)}/pdf`,{method:"POST",headers:{"Content-Type":"application/pdf"},body:blob});
      const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||"Could not save PDF");
      const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`${reference}-Quote.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setMessage("PDF saved and downloaded");setTimeout(()=>setMessage(""),3500);
    }catch(e){setMessage(e instanceof Error?e.message:"Could not create PDF");}
    finally{setBusy(false);}
  }
  return <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2 print:hidden"><button id="save-quote-pdf" onClick={()=>void generate()} disabled={busy} className="hidden">{busy?"Creating...":"Save PDF"}</button>{message&&<span className="rounded-xl bg-white px-3 py-2 text-xs font-bold shadow">{message}</span>}</div>;
}
