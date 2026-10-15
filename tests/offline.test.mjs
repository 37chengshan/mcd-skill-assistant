import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const src=readFileSync(new URL("../docs/offline-worker.js",import.meta.url),"utf8");
const client=readFileSync(new URL("../docs/offline.mjs",import.meta.url),"utf8");
test("service worker caches only audited public demo files",()=>{
 assert.match(src,/cache\.addAll\(PUBLIC\)/);
 assert.match(src,/group\.html/);
 assert.match(src,/journey\.html/);
 assert.doesNotMatch(src,/MCD_MCP_TOKEN|mcp-config|query-my-coupons|\/src\/|\/data\/|Authorization/);
 assert.match(src,/request\.method !== "GET"/);
});
test("worker only intercepts allowlisted routes, not server or private files",async()=>{
 const handlers={};
 const cacheEntries=new Map();
 const scope="https://example.test/show/";
 const cache={addAll:async(paths)=>{for(const path of paths)cacheEntries.set(new URL(path,scope).href,new Response("offline "+path));},
   match:async url=>cacheEntries.get(typeof url==="string"?url:url.url)||undefined,
   put:async()=>{}};
 const caches={open:async()=>cache,keys:async()=>[],delete:async()=>true};
 const self={registration:{scope},addEventListener:(type,fn)=>handlers[type]=fn,skipWaiting:async()=>{},
   clients:{claim:async()=>{}}};
 const sandbox={self,caches,URL,Request,Response,Set,fetch:async()=>{throw Error("offline");},Promise};
 vm.runInNewContext(src,sandbox,{timeout:1000});
 let install;
 handlers.install({waitUntil:x=>{install=x}});
 await install;
 let response;
 handlers.fetch({request:new Request(scope+"week.html"),
  respondWith:x=>{response=x}});
 assert.match(await (await response).text(),/offline \.\/week\.html/);
 let called=false;
 handlers.fetch({request:new Request("https://example.test/show/.env"),
  respondWith:()=>{called=true}});
 assert.equal(called,false);
});
test("client can clear cached offline demo without storing private data",()=>{
 assert.match(client,/caches\.keys/);
 assert.match(client,/registration\.unregister/);
 assert.doesNotMatch(client,/localStorage|MCD_MCP_TOKEN|Authorization/);
});
