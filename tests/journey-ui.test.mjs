import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../docs/journey.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../docs/journey.mjs",import.meta.url),"utf8");
test("wizard presents real scene previews and reversible steps",()=>{
 for(const id of ["main","view","next","back","save","clear","status"])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(app,/previewJourney\(menu,settings\)/);
 assert.match(app,/deepLinkJourney\(settings\)/);
 assert.match(app,/step===2\?0:step\+1/);
});
test("non-sensitive saved settings are removable",()=>{
 assert.match(app,/localStorage\.setItem/);assert.match(app,/localStorage\.removeItem/);
 assert.doesNotMatch(app,/fetch\s*\(|MCD_MCP_TOKEN/);
});
test("accessible, plain-language mobile page",()=>{
 const text=html.replace(/<style>[\s\S]*?<\/style>/g,"").replace(/<[^>]+>/g," ");
 for(const word of ["MCP","Skill","TOON","JSON","API","Pareto","非支配"])
  assert.ok(!text.includes(word),word);
 assert.match(html,/href="#main"/);assert.match(html,/prefers-reduced-motion/);
});
