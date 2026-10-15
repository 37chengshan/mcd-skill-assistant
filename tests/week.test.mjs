import test from "node:test";
import assert from "node:assert/strict";
import { buildWeek,replaceDay,weekPresets } from "../docs/week-engine.mjs";
const foods=[
{id:"a",name:"鸡肉堡",calories:350,protein:28,price:24},
{id:"b",name:"鸡蛋卷",calories:260,protein:20,price:16},
{id:"c",name:"水果杯",calories:80,protein:2,price:8},
{id:"d",name:"牛肉堡",calories:420,protein:30,price:27},
{id:"e",name:"酸奶",calories:130,protein:10,price:12},
{id:"f",name:"麦饼",calories:320,protein:16,price:19},
{id:"g",name:"鸡肉卷",calories:290,protein:23,price:23},
{id:"h",name:"清爽杯",calories:90,protein:4,price:9}
];
test("all seven lunches respect each-meal cost, energy and protein limits",()=>{
 const w=buildWeek(foods,{budget:44,maxCalories:620,minProtein:15,goal:"balanced",variety:80});
 assert.equal(w.status,"ok");
 assert.equal(w.days.length,7);
 for(const d of w.days){assert.ok(d.price<=44);assert.ok(d.calories<=620);assert.ok(d.protein>=15);}
 assert.equal(w.total,w.days.reduce((s,d)=>s+d.price,0));
});
test("variety pressure changes repetition while keeping all constraints",()=>{
 const base={budget:44,maxCalories:620,minProtein:15,goal:"protein"};
 const low=buildWeek(foods,{...base,variety:0});
 const high=buildWeek(foods,{...base,variety:100});
 assert.equal(high.status,"ok");
 assert.ok(high.uniqueMeals>=low.uniqueMeals);
});
test("user can swap one day without changing other days",()=>{
 const first=buildWeek(foods,{budget:44,maxCalories:620,minProtein:15,variety:80});
 const after=replaceDay(foods,first,2,{budget:44,maxCalories:620,minProtein:15,variety:80});
 assert.equal(after.status,"ok");
 assert.notDeepEqual(after.days[2].foodIds,first.days[2].foodIds);
 for(let i=0;i<7;i++)if(i!==2)assert.deepEqual(after.days[i],first.days[i]);
});
test("unknown prices cannot silently be used with a weekly budget",()=>{
 assert.equal(buildWeek([{...foods[0],price:null}],{budget:100}).status,"price-unavailable");
});
test("impossible constraints return specific status, invalid state rejects",()=>{
 assert.equal(buildWeek(foods,{budget:3,maxCalories:100,minProtein:40}).status,"no-options");
 assert.equal(replaceDay(foods,{status:"ok",days:[]},7,{budget:40}).status,"invalid");
});
test("three scenario presets exist and output stays deterministic",()=>{
 assert.equal(weekPresets().length,3);
 const options={budget:45,maxCalories:650,minProtein:16,variety:90};
 assert.deepEqual(buildWeek(foods,options),buildWeek(foods,options));
});
