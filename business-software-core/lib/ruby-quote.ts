/** Tenant-independent Ruby quotation planning and safety checks. No business names or storage credentials. */
export type RubyQuoteContext={job:unknown;question:string;existingScope?:string};
export function rubyQuotePrompt({job,question,existingScope=""}:RubyQuoteContext){return `Extract and revise the COMPLETE customer-facing quotation. Return ONLY JSON {"items":[{"description":"Side gate: Supply and install ...","quantity":1,"unit_price":0}],"notes":""}. Every separately requested work item must remain separate. Preserve exact measurements, finishes, materials, quantities, and explicit prices. Never invent prices: new items without a stated price are £0. Never repeat a short item label after its colon. When editing a draft, preserve every unrelated existing item, quantity and price verbatim. Return ALL existing and new items, not just changes. Do not send or issue the quote.\nJOB: ${JSON.stringify(job)}\nEXISTING DRAFT: ${existingScope}\nINSTRUCTION: ${question}`;}
export function validateRubyQuoteUpdate(previousScope:string,nextScope:string,instruction:string){const previous=previousScope.split("\n").map(x=>x.trim()).filter(Boolean);const next=nextScope.split("\n").map(x=>x.trim()).filter(Boolean);const remove=/\b(remove|delete|omit|drop|take out|replace all|start over|from scratch)\b/i.test(instruction);if(!remove&&next.length<previous.length)throw Error("Ruby omitted existing quotation items. Nothing saved.");if(!remove&&(/\b(price|prices|amount|cost|charge)\b|£/i).test(instruction)){const query=instruction.toLowerCase();for(const line of previous){const label=line.split(":")[0].trim().toLowerCase();if(label.length>2&&!query.includes(label)&&!next.includes(line))throw Error("Ruby modified an unrelated priced item. Nothing saved.");}}return nextScope;}

/** Parse the user-visible saved format so Ruby sees existing prices as structured data. */
export function parseRubyQuoteLines(scope:string){return String(scope||"").split("\n").map(line=>line.trim()).filter(Boolean).map(line=>{const multi=line.match(/^(.*?)\s*:\s*(\d+(?:\.\d+)?)\s*[×x]\s*£([\d,]+(?:\.\d{1,2})?)\s*=\s*£([\d,]+(?:\.\d{1,2})?)\s*$/);if(multi)return {description:multi[1],quantity:Number(multi[2]),unit_price:Number(multi[3].replace(/,/g,"")),original:line};const single=line.match(/^(.*?)\s*:\s*£([\d,]+(?:\.\d{1,2})?)\s*$/);if(single)return {description:single[1],quantity:1,unit_price:Number(single[2].replace(/,/g,"")),original:line};return {description:line,quantity:1,unit_price:0,original:line};});}
export function rubyQuoteTotal(scope:string){return parseRubyQuoteLines(scope).reduce((sum,item)=>sum+item.quantity*item.unit_price,0);}

/** Protect quote lines and money from an AI tidy operation before returning any edited wording. */
export function validateRubyTidy(before:string,after:string){
 const lines=(value:string)=>String(value||"").split("\n").map(x=>x.trim()).filter(Boolean);
 const old=lines(before),next=lines(after);
 if(next.length!==old.length)throw Error("Ruby changed the number of quotation lines. Original wording preserved.");
 const priced=(line:string)=>/£[\d,]+(?:\.\d{1,2})?/.test(line);
 for(let i=0;i<old.length;i++){
   if(priced(old[i])&&old[i]!==next[i])throw Error("Ruby altered an existing priced quotation line. Original wording preserved.");
 }
 return after;
}
