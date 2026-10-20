import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFood, optimize } from "../docs/engine.mjs";
import { planGroup } from "../docs/group-engine.mjs";
import { buildChoiceMap } from "../docs/map-engine.mjs";

const base={id:"meal",name:"演示餐品",calories:200,protein:20,price:10};
test("blank, boolean and array prices are unknown, never free",()=>{
 for(const price of [" ", "\t", false, []]){
  const food={...base,price};
  assert.equal(normalizeFood(food).price,null);
  assert.equal(optimize([food],{budget:100,maxItems:1,minProtein:10}).plans.length,0);
  assert.equal(buildChoiceMap([food],{budget:100}).status,"price-unavailable");
 }
});
test("group decisions reject unknown prices before allocation",()=>{
 const guests=[
  {id:"a",name:"甲",budget:50,maxCalories:600,minProtein:10,goal:"save",excludeIds:[]},
  {id:"b",name:"乙",budget:50,maxCalories:600,minProtein:10,goal:"save",excludeIds:[]}
 ];
 assert.equal(planGroup([{...base,price:"  "}],guests,{groupBudget:100}).status,"price-unavailable");
});
test("blank or non-numeric nutrition is invalid rather than zero",()=>{
 for(const value of [" ", "\t", false, true, []]){
  assert.equal(normalizeFood({...base,calories:value}),null);
  assert.equal(normalizeFood({...base,protein:value}),null);
 }
});
test("legitimate numeric zeros and numeric strings remain accepted",()=>{
 const zero=normalizeFood({...base,calories:0,protein:0,price:0});
 assert.deepEqual([zero.calories,zero.protein,zero.price],[0,0,0]);
 const text=normalizeFood({...base,calories:" 200 ",protein:"20",price:" 10 "});
 assert.deepEqual([text.calories,text.protein,text.price],[200,20,10]);
 assert.equal(normalizeFood({...base,price:null}).price,null);
});
