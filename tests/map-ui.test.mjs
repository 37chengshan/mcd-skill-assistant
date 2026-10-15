import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../docs/map.html",import.meta.url),"utf8");
const js=readFileSync(new URL("../docs/map.mjs",import.meta.url),"utf8");
test("visual map has filters, choice list and accessible SVG",()=>{
 for(const id of ["plot","choiceList","compare","budget","calories","protein","allChoices","mode"])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/viewBox="0 0 660 370"/);
 assert.match(html,/role="img"/);
 assert.match(js,/tabindex:0,role:"button"/);
 assert.match(js,/event\.key==="Enter"/);
});
test("map is functional rather than a decorative image",()=>{
 assert.match(js,/buildChoiceMap\(menu/);
 assert.match(js,/compareChoices\(pair\[0\],pair\[1\]\)/);
 assert.match(js,/addPick\(c\.id\)/);
});
test("user-facing text remains friendly and fictional provenance explicit",()=>{
 const words=html.replace(/<style>[\s\S]*?<\/style>/g,"").replace(/<[^>]+>/g," ");
 for(const word of ["MCP","Skill","TOON","JSON","API","Pareto","优化引擎","非支配"])
  assert.ok(!words.includes(word),word);
 assert.match(html,/虚构/);
 assert.match(html,/prefers-reduced-motion/);
});
