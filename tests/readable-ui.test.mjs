import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../docs/readable.html",import.meta.url),"utf8");
const script=readFileSync(new URL("../docs/readable.mjs",import.meta.url),"utf8");
test("bilingual controls and accessibility preferences exist",()=>{
 for(const id of ["language","largeText","contrast","budget","calories","protein","cards","stop","clear"]){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(script,/document\.documentElement\.lang/);
 assert.match(script,/body\.classList\.toggle/);
});
test("speech never plays until the user activates a meal button",()=>{
 assert.match(script,/speak\.addEventListener\("click"/);
 assert.match(script,/SpeechSynthesisUtterance\(plan\.speech\)/);
 assert.doesNotMatch(script,/setInterval\s*\(/);
});
test("plain-language and usable fallback remain when speech is unavailable",()=>{
 assert.match(html,/aria-live="polite"/);
 assert.match(html,/href="#main"/);
 assert.match(html,/prefers-reduced-motion/);
 assert.match(script,/speak\.disabled=true/);
 const shown=html.replace(/<style>[\s\S]*?<\/style>/g,"").replace(/<[^>]+>/g," ");
 for(const w of ["MCP","Skill","TOON","JSON","API","Pareto"])assert.ok(!shown.includes(w),w);
});
