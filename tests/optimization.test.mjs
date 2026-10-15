import test from "node:test";
import assert from "node:assert/strict";
import { optimize } from "../docs/engine.mjs";
test("28 items evaluated exactly",()=>{
 const foods=Array.from({length:28},(_,i)=>({id:"f"+i,name:"food"+i,calories:150+i*10,protein:2+i,price:15+i}));
 const r=optimize(foods,{maxCalories:250,minProtein:0,maxItems:1});
 assert.equal(r.catalogSize,28);assert.equal(r.approximate,false);
});
test("sampled catalog is marked approximate rather than globally optimal",()=>{
 const foods=Array.from({length:48},(_,i)=>({id:"f"+i,name:"food"+i,calories:300,protein:5+i,price:20+i}));
 const r=optimize(foods,{maxItems:1,minProtein:0});assert.equal(r.inspectedSize,48);assert.equal(r.approximate,true);
});
test("food exclusion excludes exact ids and has honest counts",()=>{
 const foods=[{id:"a",name:"A",calories:220,protein:24,price:20},{id:"b",name:"B",calories:210,protein:22,price:19}];
 const r=optimize(foods,{excludeIds:["a"],maxItems:1});assert.ok(r.plans.every(p=>!p.foods.includes("A")));assert.equal(r.excludedCount,1);
});
test("goal scoring preserves constraints",()=>{
 const foods=[{name:"A",calories:350,protein:32,price:36},{name:"B",calories:420,protein:20,price:18},{name:"C",calories:280,protein:16,price:30}];
 for(const goal of ["balanced","save","protein","light"]) {
  const r=optimize(foods,{goal,budget:40,maxCalories:450,minProtein:0,maxItems:1});
  assert.ok(r.plans.every(p=>p.price<=40&&p.calories<=450));
 }
});
