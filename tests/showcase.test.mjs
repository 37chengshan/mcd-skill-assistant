import test from "node:test";
import assert from "node:assert/strict";
import {createShowcase} from "../docs/showcase-engine.mjs";
const foods=[
{id:"a",name:"鸡肉堡",nameEn:"Chicken sandwich",calories:350,protein:28,price:24},
{id:"b",name:"鸡蛋卷",nameEn:"Egg wrap",calories:260,protein:20,price:16},
{id:"c",name:"玉米杯",nameEn:"Corn cup",calories:80,protein:2,price:9},
{id:"d",name:"牛肉堡",nameEn:"Beef sandwich",calories:420,protein:27,price:27},
{id:"e",name:"酸奶",nameEn:"Yogurt",calories:130,protein:9,price:12},
{id:"f",name:"鸡肉卷",nameEn:"Chicken wrap",calories:300,protein:22,price:21}
];
test("showcase explains all existing products with computed examples",()=>{
 const s=createShowcase(foods);
 assert.equal(s.status,"ok");assert.equal(s.chapters.length,9);
 assert.equal(new Set(s.chapters.map(x=>x.id)).size,9);
 for(const chapter of s.chapters){
  assert.ok(chapter.title.length>=3);
  assert.ok(chapter.summary.length>15);
  assert.ok(chapter.highlights.length>=2);
  assert.match(chapter.href,/^\.\/[a-z]+\.html$/);
  assert.match(chapter.provenance,/演示|虚构/);
 }
});
test("showcase does not advertise completed signup or real ordering",()=>{
 const s=createShowcase(foods);
 const serialized=JSON.stringify(s);
 assert.doesNotMatch(serialized,/报名成功|已正式报名|实时优惠已验证|已经下单|已付款/);
 for(const w of ["MCP","Skill","TOON","JSON","API","Pareto"])assert.ok(!serialized.includes(w),w);
});
test("no unknown prices are smuggled into illustrative totals",()=>{
 const s=createShowcase(foods);
 const first=s.chapters[0];
 assert.match(first.summary,/价格未知/);
});
test("no arbitrary account data is reflected into visitor-facing descriptions",()=>{
 const withExtras=foods.map(x=>({...x,phone:"012345",token:"hidden",address:"private"}));
 const s=createShowcase(withExtras);
 assert.equal(s.status,"ok");
 assert.doesNotMatch(JSON.stringify(s),/012345|hidden|private/);
});
