import test from "node:test";
import assert from "node:assert/strict";
import { accessibleSuggestions, readableLabels } from "../docs/readable-engine.mjs";
const foods=[
 {id:"a",name:"鸡肉堡",nameEn:"Chicken sandwich",price:22,calories:340,protein:27},
 {id:"b",name:"玉米杯",nameEn:"Corn cup",price:10,calories:90,protein:3},
 {id:"c",name:"牛肉堡",nameEn:"Beef sandwich",price:26,calories:400,protein:25}
];
test("both language modes render real recommendations with price and nutrient narration",()=>{
 for(const locale of ["zh","en"]){
  const r=accessibleSuggestions(foods,{budget:50,maxCalories:750,minProtein:20},locale);
  assert.equal(r.status,"ok");assert.ok(r.plans.length);
  assert.ok(r.plans[0].speech.length>35);
  assert.ok(r.plans[0].spokenFacts.includes(locale==="en"?"Protein":"蛋白质"));
  assert.ok(r.disclaimer.includes(locale==="en"?"fictional":"虚构"));
 }
});
test("english narration uses english sample meal names",()=>{
 const r=accessibleSuggestions(foods,{budget:50,maxCalories:750,minProtein:20},"en");
 assert.ok(r.plans[0].title.includes("sandwich"));
 assert.equal(readableLabels("en").budget,"Budget limit");
});
test("missing prices never appear as zero cost in either locale",()=>{
 const data=[{...foods[0],price:null}];
 const r=accessibleSuggestions(data,{budget:null,maxCalories:750,minProtein:20},"en");
 assert.equal(r.status,"ok");
 assert.match(r.plans[0].speech,/unknown/);
});
test("invalid locale or constraints are rejected",()=>{
 assert.equal(accessibleSuggestions(foods,{budget:50,maxCalories:750,minProtein:20},"xx").status,"invalid");
 assert.equal(accessibleSuggestions(foods,{budget:-5,maxCalories:750,minProtein:20},"zh").status,"invalid");
});
test("spoken summary includes explicit non-official provenance",()=>{
 const r=accessibleSuggestions(foods,{budget:50,maxCalories:750,minProtein:20},"en");
 assert.match(r.plans[0].speech,/not an official/i);
});
