import test from "node:test";
import assert from "node:assert/strict";
import { comparePlans,explainPlan,rescueConstraints,scenarioSummary } from "../docs/lab.mjs";
const foods=[
  {id:"a",name:"A",calories:350,protein:30,price:30},
  {id:"b",name:"B",calories:190,protein:10,price:15},
  {id:"c",name:"C",calories:200,protein:20,price:19}
];
test("signed tradeoffs and missing price are explicit",()=>{
  const a={price:30,calories:350,protein:30},b={price:19,calories:200,protein:20};
  const r=comparePlans(a,b);assert.equal(r.price,-11);
  assert.equal(r.calories,-150);assert.equal(r.protein,-10);
  assert.equal(comparePlans({...a,price:null},b).price,null);
});
test("explanations quantify all three constraint margins",()=>{
  const f=explainPlan({price:24,calories:360,protein:32},{budget:40,maxCalories:700,minProtein:20});
  assert.equal(f.length,3);assert.equal(f[0].value,"¥16.0");assert.equal(f[1].value,"340 kcal");
});
test("counterfactual suggests useful relaxation only",()=>{
  const r=rescueConstraints(foods,{budget:20,maxCalories:250,minProtein:29,maxItems:1});
  assert.ok(!r.some(x=>x.axis==="budget"));
  assert.ok(r.some(x=>x.axis==="protein"&&x.after<=20));
});
test("different priority scenario still uses unchanged constraints",()=>{
  const r=scenarioSummary(foods,{budget:50,maxCalories:550,minProtein:10,maxItems:1});
  assert.ok(r.baseline.plans.length&&r.alternate.plans.length&&r.shifts);
});
