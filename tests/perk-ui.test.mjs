import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../docs/perk.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../docs/perk.mjs",import.meta.url),"utf8");
test("voucher preview is a working shopping scenario, not only marketing prose",()=>{
 for(const id of ["menu","offers","basket","subtotal","discount","payable","dayLabel","reset"]){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(app,/evaluatePerks\(foods/);
 assert.match(app,/simulatePayable\(result,chosen\)/);
});
test("explicitly fictional prices, no checkout or sensitive credential workflow",()=>{
 assert.match(html,/均为虚构演示/);
 assert.match(html,/不会领券、下单或支付/);
 const visible=html.replace(/<style>[\s\S]*?<\/style>/g,"").replace(/<[^>]+>/g," ");
 for(const term of ["MCP","Skill","TOON","JSON","API","Pareto","优化引擎","非支配"])
  assert.ok(!visible.includes(term),term);
 assert.doesNotMatch(app,/fetch\s*\(|localStorage|MCD_MCP_TOKEN/);
});
test("small screen, reduced motion and keyboard navigation are considered",()=>{
 assert.match(html,/href="#main"/);
 assert.match(html,/:focus-visible/);
 assert.match(html,/max-width:520px/);
 assert.match(html,/prefers-reduced-motion:reduce/);
});
