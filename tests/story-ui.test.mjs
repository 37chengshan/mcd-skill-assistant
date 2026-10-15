import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../docs/story.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../docs/story.mjs",import.meta.url),"utf8");
test("story lab generates actual accessible images and text export",()=>{
 for(const id of ["storyCanvas","scenes","shuffle","download","copy","storyText"]){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(app,/canvas\.toBlob/);
 assert.match(app,/createStoryCard\(mode,storySource\(\)\)/);
 assert.match(app,/story\.disclaimer\[0\]/);
 assert.match(app,/story\.disclaimer\[1\]/);
});
test("story artwork embeds its fictional disclaimer and no personal data",()=>{
 assert.match(html,/图片也会完整保留/);
 assert.doesNotMatch(app,/fetch\s*\(|MCD_MCP_TOKEN|localStorage/);
 const shown=html.replace(/<style>[\s\S]*?<\/style>/g,"").replace(/<[^>]+>/g," ");
 for(const term of ["MCP","Skill","TOON","JSON","API","Pareto","非支配"])
  assert.ok(!shown.includes(term),term);
});
test("story studio adapts to phones and reduced motion",()=>{
 assert.match(html,/max-width:530px/);
 assert.match(html,/prefers-reduced-motion/);
 assert.match(html,/href="#main"/);
});
