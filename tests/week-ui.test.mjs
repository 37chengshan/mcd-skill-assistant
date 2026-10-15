import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../docs/week.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../docs/week.mjs",import.meta.url),"utf8");
test("weekly experience has editable meal targets and seven-day journey",()=>{
 for(const id of ["presets","budget","calories","protein","variety","calendar","regenerate","save","export","clear"]){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(app,/buildWeek\(menu,options\(\)\)/);
 assert.match(app,/replaceDay\(menu,current,i,options\(\)\)/);
});
test("week demo never displays developer vocabulary",()=>{
 const text=html.replace(/<style>[\s\S]*?<\/style>/g,"").replace(/<[^>]+>/g," ");
 for(const term of ["MCP","Skill","TOON","JSON","API","Pareto","调试","非支配","优化引擎"]){
  assert.ok(!text.includes(term),term);
 }
});
test("weekly planner gives honest provenance, accessibility and deletion",()=>{
 assert.match(html,/虚构演示/);
 assert.match(html,/prefers-reduced-motion/);
 assert.match(html,/href="#main"/);
 assert.match(app,/localStorage\.removeItem/);
 assert.match(app,/new Blob/);
});
