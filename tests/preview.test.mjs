import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

test("interactive preview serves its own imported modules but not private files",async t=>{
 const cli=fileURLToPath(new URL("../src/preview.mjs",import.meta.url));
 const server=spawn(process.execPath,[cli],{stdio:"ignore"});
 t.after(()=>server.kill());
 let started=false;
 for(let attempt=0;attempt<40;attempt++){
  try{
   const response=await fetch("http://127.0.0.1:4173/",{signal:AbortSignal.timeout(300)});
   if(response.ok){started=true;break;}
  }catch{}
  await delay(50);
 }
 assert.ok(started,"preview server did not start");
 for(const path of ["/","/index.html","/app.mjs","/engine.mjs","/lab.mjs","/share.mjs","/snapshot.mjs"]){
  const response=await fetch("http://127.0.0.1:4173"+path);
  assert.equal(response.status,200,path+" must be readable");
  assert.equal(response.headers.get("x-content-type-options"),"nosniff");
  if(path.endsWith(".mjs"))assert.match(response.headers.get("content-type"),/javascript/);
 }
 for(const path of ["/.env","/src/mcp.mjs","/package.json","/MCP_INTEGRATION.md","/data/nutrition-snapshot.json"]){
  const response=await fetch("http://127.0.0.1:4173"+path);
  assert.equal(response.status,404,path+" must stay private");
 }
 const head=await fetch("http://127.0.0.1:4173/",{method:"HEAD"});
 assert.equal(head.status,200);
 assert.equal((await head.text()).length,0);
});
