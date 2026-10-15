import test from "node:test";
import assert from "node:assert/strict";
import { planGroup, groupPresets } from "../docs/group-engine.mjs";
const foods=[
{id:"a",name:"鸡肉堡",calories:360,protein:25,price:24},
{id:"b",name:"鸡蛋卷",calories:220,protein:14,price:15},
{id:"c",name:"水果杯",calories:80,protein:1,price:9},
{id:"d",name:"牛肉堡",calories:420,protein:27,price:27},
{id:"e",name:"无糖饮品",calories:0,protein:0,price:7}
];
const guests=[
{id:"p1",name:"小林",budget:35,maxCalories:600,minProtein:20,goal:"protein",excludeIds:["d"]},
{id:"p2",name:"小赵",budget:28,maxCalories:400,minProtein:12,goal:"save",excludeIds:["a"]}
];
test("multi-person plans respect every person's limits, avoids and total budget",()=>{
 const r=planGroup(foods,guests,{groupBudget:60});
 assert.equal(r.status,"ok");
 assert.equal(r.selections.length,2);
 assert.ok(r.total<=60);
 for(let i=0;i<2;i++){
  const p=r.selections[i],g=guests[i];
  assert.ok(p.price<=g.budget);
  assert.ok(p.calories<=g.maxCalories);
  assert.ok(p.protein>=g.minProtein);
  assert.ok(!p.foodIds.some(id=>g.excludeIds.includes(id)));
  assert.equal(p.foodIds.length,new Set(p.foodIds).size);
 }
});
test("a group budget lower than minimum separate meals returns no allocation",()=>{
 const r=planGroup(foods,guests,{groupBudget:10});
 assert.equal(r.status,"budget-too-low");
 assert.ok(r.minimumTotal>10);
});
test("unknown food prices are not assumed free",()=>{
 const r=planGroup([{...foods[0],price:null}],guests,{groupBudget:100});
 assert.equal(r.status,"price-unavailable");
});
test("individual conflicts explain whose conditions cannot be met",()=>{
 const guests2=[{id:"x",name:"小鱼",budget:8,maxCalories:100,minProtein:40,goal:"light",excludeIds:[]}];
 const r=planGroup(foods,guests2,{groupBudget:100});
 assert.equal(r.status,"no-options");
 assert.equal(r.blockedMembers[0],"小鱼");
});
test("results are repeatable, bounded and do not mutate input",()=>{
 const menu=Object.freeze(foods.map(f=>Object.freeze({...f})));
 const people=guests.map(f=>({...f,excludeIds:[...f.excludeIds]}));
 assert.deepEqual(planGroup(menu,people,{groupBudget:80}),planGroup(menu,people,{groupBudget:80}));
 assert.equal(foods[0].id,"a");
 assert.equal(groupPresets().length,3);
});
test("groups are limited to avoid runaway combinatorial searches",()=>{
 const crowd=Array.from({length:8},(_,i)=>({...guests[0],id:"u"+i}));
 assert.equal(planGroup(foods,crowd,{groupBudget:500}).status,"invalid");
});
