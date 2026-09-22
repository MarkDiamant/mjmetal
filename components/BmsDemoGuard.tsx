"use client";
import {useLayoutEffect} from "react";

const rewrite=(value:string)=>{
  if(value.startsWith("/api/admin")) return "/api/demo"+value.slice("/api/admin".length);
  if(value.startsWith("/api/integrations")) return "/api/demo/integrations"+value.slice("/api/integrations".length);
  return value;
};

export default function BmsDemoGuard(){
  useLayoutEffect(()=>{
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

    const originalPush=history.pushState.bind(history);
    const originalReplace=history.replaceState.bind(history);
    const demoUrl=(value:string|URL|null|undefined)=>{
      if(value==null)return value as any;
      const url=new URL(String(value),window.location.href);
      if(url.origin===window.location.origin&&(url.pathname==="/admin"||url.pathname.startsWith("/admin/"))){
        const sample=new URLSearchParams(window.location.search).get("sample");
        url.pathname="/demo"+url.pathname.slice("/admin".length);
        if(sample&&!url.searchParams.has("sample"))url.searchParams.set("sample",sample);
        return url.pathname+url.search+url.hash;
      }
      return value as any;
    };
    history.pushState=((data:any,unused:string,url?:string|URL|null)=>originalPush(data,unused,demoUrl(url))) as typeof history.pushState;
    history.replaceState=((data:any,unused:string,url?:string|URL|null)=>originalReplace(data,unused,demoUrl(url))) as typeof history.replaceState;

    const click=(event:MouseEvent)=>{
      const target=event.target as Element|null;
      const anchor=target?.closest?.("a") as HTMLAnchorElement|null;
      if(!anchor) return;
      const url=new URL(anchor.href,window.location.href);
      if(url.origin!==window.location.origin) return;
      if(url.pathname==="/admin"||url.pathname.startsWith("/admin/")){
        event.preventDefault();
        const sample=new URLSearchParams(window.location.search).get("sample");
        url.pathname="/demo"+url.pathname.slice("/admin".length);
        if(sample&&!url.searchParams.has("sample"))url.searchParams.set("sample",sample);
        window.location.assign(url.pathname+url.search+url.hash);
        return;
      }
      if(url.pathname.startsWith("/api/integrations")){
        event.preventDefault();
        window.location.assign("/api/demo/integrations"+url.pathname.slice("/api/integrations".length)+url.search+url.hash);
      }
    };
    document.addEventListener("click",click,true);
    return ()=>{window.fetch=originalFetch;history.pushState=originalPush as typeof history.pushState;history.replaceState=originalReplace as typeof history.replaceState;document.removeEventListener("click",click,true);};
  },[]);
  return null;
}
