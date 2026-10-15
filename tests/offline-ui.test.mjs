import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const pages=["index.html","group.html","week.html","map.html","perk.html","journey.html"];
test("all public product pages opt in to the same offline control",()=>{
 for(const page of pages){
  const html=readFileSync(new URL("../docs/"+page,import.meta.url),"utf8");
  assert.match(html,/src="\.\/offline\.mjs"/,page);
 }
});
test("the offline worker is never exposed to private source or user credentials",()=>{
 const sw=readFileSync(new URL("../docs/offline-worker.js",import.meta.url),"utf8");
 assert.match(sw,/ALLOWED\.has\(address\.pathname\)/);
 assert.match(sw,/cache\.addAll\(PUBLIC\)/);
 assert.doesNotMatch(sw,/mcp-config|\/data\/|MCD_MCP_TOKEN|query-my-coupons/);
});
