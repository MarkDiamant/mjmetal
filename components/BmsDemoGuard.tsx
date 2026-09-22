"use client";
import {useEffect} from "react";

const rewrite=(value:string)=>{
  if(value.startsWith("/api/admin")) return "/api/demo"+value.slice("/api/admin".length);
  if(value.startsWith("/api/integrations")) return "/api/demo/integrations"+value.slice("/api/integrations".length);
  return value;
};

export default function BmsDemoGuard(){
  useEffect(()=>{
    const originalFetch=window.fetch.bind(window);
    window.fetch=((input:RequestInfo|URL,init?:RequestInit)=>{
      if(typeof input==="string") return originalFetch(rewrite(input),init);
      if(input instanceof URL && input.origin===window.location.origin){
        const next=new URL(input.toString()); next.pathname=rewrite(next.pathname); return originalFetch(next,init);
      }
      if(input instanceof Request){
        const url=new URL(input.url);
        if(url.origin===window.location.origin && (url.pathname.startsWith("/api/admin")||url.pathname.startsWith("/api/integrations"))){
          url.pathname=rewrite(url.pathname);
          return originalFetch(new Request(url,input),init);
        }
      }
      return originalFetch(input,init);
    }) as typeof window.fetch;

    const click=(event:MouseEvent)=>{
      const target=event.target as Element|null;
      const anchor=target?.closest?.("a") as HTMLAnchorElement|null;
      if(!anchor) return;
      const url=new URL(anchor.href,window.location.href);
      if(url.origin!==window.location.origin) return;
      if(url.pathname==="/admin"||url.pathname.startsWith("/admin/")){
        event.preventDefault();
        const next="/demo"+url.pathname.slice("/admin".length)+url.search+url.hash;
        window.location.assign(next);
      }
    };
    document.addEventListener("click",click,true);
    return ()=>{window.fetch=originalFetch;document.removeEventListener("click",click,true);};
  },[]);
  return null;
}
