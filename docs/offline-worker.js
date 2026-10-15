// v8 public-only offline cache. Never cache account responses, credentials or user files.
const CACHE_NAME="mcdecision-public-v10";
const CACHE_PREFIX="mcdecision-public-";
const PUBLIC=[
 "./","./index.html","./app.mjs","./engine.mjs","./lab.mjs","./share.mjs","./snapshot.mjs",
 "./group.html","./group.mjs","./group-engine.mjs",
 "./week.html","./week.mjs","./week-engine.mjs",
 "./map.html","./map.mjs","./map-engine.mjs",
 "./perk.html","./perk.mjs","./perk-engine.mjs",
 "./journey.html","./journey.mjs","./journey-engine.mjs",
 "./offline.mjs","./story.html","./story.mjs","./story-engine.mjs","./readable.html","./readable.mjs","./readable-engine.mjs"
];
const SCOPE=self.registration.scope;
const ROOT=new URL(SCOPE);
const ALLOWED=new Set(PUBLIC.map(p=>new URL(p,SCOPE).pathname));
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(PUBLIC))
   .then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME)
    .map(name=>caches.delete(name)));
  await self.clients.claim();
 })());
});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method !== "GET")return;
 const address=new URL(request.url);
 if(address.origin!==ROOT.origin||!ALLOWED.has(address.pathname))return;
 const canonical=new URL(address.pathname,ROOT.origin).href;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE_NAME);
  try{
   const response=await fetch(request);
   if(response.ok&&response.type!=="opaque")await cache.put(canonical,response.clone());
   return response;
  }catch{
   const saved=await cache.match(canonical);
   return saved||Response.error();
  }
 })());
});
