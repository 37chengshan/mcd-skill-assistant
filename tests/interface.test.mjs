import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html=readFileSync(new URL("../docs/index.html",import.meta.url),"utf8");
const script=readFileSync(new URL("../docs/app.mjs",import.meta.url),"utf8");
test("there is an accessible skip link to the main content",()=>{
 assert.match(html,/class="skip-link"/);
 assert.match(html,/<main[^>]+id="main-content"/);
 assert.match(html,/href="#main-content"/);
});
test("interactive controls have a consistent comfortable touch target",()=>{
 assert.match(html,/\.chip,[^}]+min-height:44px/);
 assert.match(html,/\.compare-button,[^}]+min-height:44px/);
 assert.match(html,/\.nav-link,[^}]+min-height:44px/);
});
test("page copy avoids internal developer terminology",()=>{
 const visible=html.replace(/<style>[\s\S]*?<\/style>/g,"")
 .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,"")
 .replace(/<[^>]+>/g," ");
 for(const term of ["MCP","Skill","TOON","JSON","API","Pareto","调试","非支配","优化引擎"]){
  assert.ok(!visible.includes(term),"visible UI contains internal term: "+term);
 }
 const copy=script.match(/node\("[^"]+","[^"]*","([^"]*)"\)/g)||[];
 for(const text of copy)assert.ok(!/(TOON|JSON|MCP|Pareto|API)/.test(text));
});
test("the mobile layout respects reduced motion and keyboard focus",()=>{
 assert.match(html,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(html,/:focus-visible/);
 assert.match(html,/<meta name="viewport" content="width=device-width,initial-scale=1">/);
});

test("data-import interface is available and cannot accept a live token",()=>{
 assert.match(html,/id="loadNutrition"/);
 assert.match(html,/id="loadStatus" role="status"/);
 assert.match(html,/id="backDemo"/);
 assert.match(script,/readNutritionSnapshot\(await file\.text\(\)\)/);
 assert.match(script,/budget:imported\?null:settings\.budget/);
 assert.match(script,/imported && button\.dataset\.goal==="save"/);
});
