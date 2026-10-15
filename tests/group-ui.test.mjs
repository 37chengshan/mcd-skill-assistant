import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html=readFileSync(new URL("../docs/group.html",import.meta.url),"utf8");
const js=readFileSync(new URL("../docs/group.mjs",import.meta.url),"utf8");
test("group experience contains actual editable people and shareable result",()=>{
 for(const id of ["people","groupBudget","generate","addPerson","removePerson","result","presets"])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(js,/planGroup\(menu,people/);
 assert.match(js,/createElement/);
 assert.match(js,/navigator\.clipboard\.writeText/);
});
test("no developer jargon reaches the group front-end",()=>{
 const visible=html.replace(/<style>[\s\S]*?<\/style>/g,"").replace(/<[^>]+>/g," ");
 for(const term of ["MCP","Skill","TOON","JSON","API","Pareto","非支配","优化引擎"])
  assert.ok(!visible.includes(term),term);
});
test("mobile, accessible controls and explicit illustration disclaimer",()=>{
 assert.match(html,/prefers-reduced-motion/);
 assert.match(html,/:focus-visible/);
 assert.match(html,/href="#main"/);
 assert.match(html,/虚构的体验示例/);
 assert.match(html,/max-width:800px/);
});
