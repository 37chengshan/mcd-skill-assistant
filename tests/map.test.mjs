import test from "node:test";
import assert from "node:assert/strict";
import { buildChoiceMap, compareChoices } from "../docs/map-engine.mjs";
const foods=[
{id:"a",name:"轻巧餐",price:20,calories:240,protein:24},
{id:"b",name:"不如轻巧餐",price:25,calories:320,protein:17},
{id:"c",name:"节省餐",price:12,calories:270,protein:12},
{id:"d",name:"高蛋白餐",price:28,calories:300,protein:36},
{id:"e",name:"免费水",price:0,calories:0,protein:0}
];
test("map keeps full candidates, clearly separates dominated options",()=>{
 const r=buildChoiceMap(foods,{budget:30,maxCalories:400,minProtein:0,maxItems:1});
 assert.equal(r.status,"ok");assert.equal(r.choices.length,5);
 assert.ok(r.choices.find(x=>x.foodIds[0]==="b").dominated);
 assert.ok(!r.choices.find(x=>x.foodIds[0]==="a").dominated);
});
test("budget, energy and protein filtering all apply before comparisons",()=>{
 const r=buildChoiceMap(foods,{budget:20,maxCalories:300,minProtein:20,maxItems:1});
 assert.equal(r.status,"ok");assert.deepEqual(r.choices.map(x=>x.foodIds),[["a"]]);
});
test("missing prices and broken input never look like free food",()=>{
 assert.equal(buildChoiceMap([{...foods[0],price:null}],{budget:40}).status,"price-unavailable");
 assert.equal(buildChoiceMap(foods,{budget:-1}).status,"invalid");
 assert.equal(buildChoiceMap(foods,{budget:0,maxCalories:0,minProtein:200}).status,"no-options");
});
test("pairwise comparison has signed differences and no false single winner",()=>{
 const a={id:"a",price:20,calories:240,protein:24};
 const b={id:"c",price:12,calories:270,protein:12};
 const r=compareChoices(a,b);
 assert.deepEqual(r,{price:-8,calories:30,protein:-12});
 assert.equal(compareChoices(a,a).price,0);
});
test("two-item combos have stable IDs and no accidental duplicated item",()=>{
 const r=buildChoiceMap(foods,{budget:45,maxCalories:800,minProtein:0,maxItems:2});
 assert.ok(r.choices.some(x=>x.foodIds.length===2));
 assert.ok(r.choices.every(x=>new Set(x.foodIds).size===x.foodIds.length));
 assert.deepEqual(r,buildChoiceMap(foods,{budget:45,maxCalories:800,minProtein:0,maxItems:2}));
});
