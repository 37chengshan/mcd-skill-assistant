import test from "node:test";
import assert from "node:assert/strict";
import { createStoryCard, storyModes } from "../docs/story-engine.mjs";
const inputs=[{name:"香煎鸡肉堡",price:22,calories:360,protein:24},{name:"酸奶杯",price:12,calories:130,protein:8}];
test("three sharing stories have a fixed visible provenance stamp",()=>{
 for(const mode of storyModes()){
  const story=createStoryCard(mode.id,inputs);
  assert.equal(story.status,"ok");
  assert.ok(story.disclaimer.some(x=>x.includes("虚构")));
  assert.ok(story.disclaimer.some(x=>x.includes("非官方")));
  assert.ok(story.entries.length===2);
  assert.ok(story.title.length>=3);
 }
});
test("unknown prices remain unknown, never convert to free",()=>{
 const story=createStoryCard("solo",[{...inputs[0],price:null}]);
 assert.equal(story.status,"ok");
 assert.match(story.entries[0].secondary,/价格未知/);
 assert.doesNotMatch(story.shareText,/¥0/);
});
test("reject unsafe or malformed names and out-of-range quantities",()=>{
 assert.equal(createStoryCard("solo",[{...inputs[0],name:"<script>"}]).status,"invalid");
 assert.equal(createStoryCard("solo",[{...inputs[0],protein:-1}]).status,"invalid");
 assert.equal(createStoryCard("solo",Array(15).fill(inputs[0])).status,"invalid");
});
test("public story discards any extra account, token or address fields",()=>{
 const story=createStoryCard("group",[{...inputs[0],token:"secret-value",phone:"999999999",address:"street"}]);
 assert.equal(story.status,"ok");
 assert.doesNotMatch(JSON.stringify(story),/secret-value|999999999|street/);
});
test("story output is deterministic for the same inputs",()=>{
 assert.deepEqual(createStoryCard("week",inputs),createStoryCard("week",inputs));
});
