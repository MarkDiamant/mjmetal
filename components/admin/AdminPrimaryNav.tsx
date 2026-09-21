"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
const items=[["/admin","Dashboard"],["/admin/customers","Customers"],["/admin/jobs","Jobs"],["/admin/quotes","Quotes"],["/admin/invoices","Invoices"],["/admin/payments","Payments"],["/admin/files","Files"],["/admin/team","Team"]];
export default function AdminPrimaryNav(){
 const p=usePathname();
 if(p==="/admin"||p==="/admin/login"||p.includes("/quote/")||p.includes("/quote-preview")) return null;
 return <nav aria-label="Main business software navigation" className="border-b border-black/10 bg-[#fffaf6] print:hidden">
  <div className="mx-auto flex max-w-[1500px] items-center gap-1.5 overflow-x-auto px-4 py-2 sm:px-5 lg:px-8">
   {items.map(([href,label])=>{const active=p.startsWith(href)&&href!=="/admin";return <Link key={href} href={href} className={"whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-black "+(active?"border-[#e66a24] bg-[#e66a24] text-white":"border-black/10 bg-white text-black/65 hover:text-black")}>{label}</Link>})}
  </div>
 </nav>;
}
