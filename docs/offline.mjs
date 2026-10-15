// Optional offline support for public demo files only, never food import or account data.
const footer=document.querySelector("footer");
if(footer&&"serviceWorker" in navigator&&window.isSecureContext){
 const panel=document.createElement("div");
 panel.className="offline-tools";
 const status=document.createElement("span");
 status.setAttribute("role","status");
 status.textContent="正在准备离线体验…";
 const clear=document.createElement("button");
 clear.type="button";clear.textContent="删除离线内容";clear.disabled=true;
 const style=document.createElement("style");
 style.textContent=".offline-tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:10px;font-size:11px;color:#6b7164}.offline-tools button{font:inherit;font-size:11px;min-height:36px;padding:6px 11px;border:1px solid #d4d9cd;border-radius:8px;background:#fff;color:#4b5549;cursor:pointer}.offline-tools button:focus-visible{outline:3px solid #bd9728;outline-offset:3px}";
 document.head.append(style);
 panel.append(status,clear);footer.append(panel);
 let registration=null;
 const setConnection=()=>{
  if(!registration)return;
  status.textContent=navigator.onLine?"离线体验已备好，下次断网也能打开演示页面。":
    "现在没有网络，已经准备过的演示页面仍可继续使用。";
 };
 navigator.serviceWorker.register("./offline-worker.js",{scope:"./"})
  .then(r=>{registration=r;return navigator.serviceWorker.ready;})
  .then(()=>{clear.disabled=false;setConnection();})
  .catch(()=>{status.textContent="当前环境暂时无法准备离线体验。";});
 window.addEventListener("online",setConnection);
 window.addEventListener("offline",setConnection);
 clear.addEventListener("click",async()=>{
  clear.disabled=true;
  try{
   const keys=await caches.keys();
   await Promise.all(keys.filter(name=>name.startsWith("mcdecision-public-"))
    .map(name=>caches.delete(name)));
   if(registration)await registration.unregister();
   registration=null;
   status.textContent="离线内容已清理。下次联网重新打开页面，可再次准备。";
  }catch{
   status.textContent="暂时无法清理离线内容，可以到浏览器设置里清除网站数据。";
  }
 });
}
