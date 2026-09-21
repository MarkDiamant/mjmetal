"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
const items=[["/admin","Dashboard"],["/admin/customers","Customers"],["/admin/jobs","Jobs"],["/admin/quotes","Quotes"],["/admin/invoices","Invoices"],["/admin/payments","Payments"],["/admin/files","Files"],["/admin/team","Team"]];
export default function AdminPrimaryNav(){const p=usePathname();if(p==="/admin/login"||p.includes("/quote/")||p.includes("/quote-preview"))return null;return <nav className="border-b border-black/10 bg-white print:hidden"><div className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-4 py-2 sm:px-5 lg:px-8">{items.map(([href,label])=>{const active=href==="/admin"?p==="/admin":p.startsWith(href);return <Link key={href} href={href} className={"whitespace-nowrap rounded-lg px-3 py-2 text-xs font-black transition "+(active?"bg-black text-white":"text-black/60 hover:bg-black/5 hover:text-black")}>{label}</Link>})}</div></nav>}
