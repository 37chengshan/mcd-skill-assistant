import test from "node:test";
import assert from "node:assert/strict";
import {evaluatePerks, simulatePayable} from "../docs/perk-engine.mjs";
const foods=[
 {id:"burger",name:"鸡肉堡",category:"main",price:25},
 {id:"wrap",name:"鸡蛋卷",category:"main",price:19},
 {id:"corn",name:"玉米杯",category:"side",price:10},
 {id:"tea",name:"清爽饮",category:"drink",price:9}
];
const perks=[
{id:"flat",title:"满 35 元省 8 元",type:"flat",minSpend:35,amount:8,day:"any",category:"any"},
{id:"main",title:"主餐满 40 元省 10 元",type:"flat",minSpend:40,amount:10,day:"any",category:"main"},
{id:"weekend",title:"周末满 30 元享 8 折",type:"percent",minSpend:30,rate:0.8,cap:12,day:"weekend",category:"any"}
];
test("discount is simulated, never stacked, and respects spending thresholds",()=>{
 const result=evaluatePerks(foods,["burger","wrap"],perks,{day:"weekday"});
 assert.equal(result.status,"ok");
 assert.equal(result.subtotal,44);
 assert.equal(result.best.id,"main");
 assert.equal(result.best.savings,10);
 assert.equal(result.best.payable,34);
 assert.equal(simulatePayable(result,"flat").payable,36);
 assert.equal(simulatePayable(result,"main").payable,34);
});
test("weekend rate and cap apply only to eligible dates",()=>{
 const weekday=evaluatePerks(foods,["burger","corn"],perks,{day:"weekday"});
 const weekend=evaluatePerks(foods,["burger","corn"],perks,{day:"weekend"});
 assert.equal(weekday.offers.find(x=>x.id==="weekend").eligible,false);
 assert.equal(weekend.offers.find(x=>x.id==="weekend").eligible,true);
 assert.equal(weekend.offers.find(x=>x.id==="weekend").savings,7);
});
test("ineligible offers show concrete, user-readable reasons",()=>{
 const result=evaluatePerks(foods,["burger"],perks,{day:"weekday"});
 assert.ok(result.offers.every(x=>!x.eligible&&x.reason));
 assert.equal(result.best,null);
 assert.equal(result.payable,25);
});
test("unknown prices, invalid selections and unsupported offers fail safely",()=>{
 assert.equal(evaluatePerks([{...foods[0],price:null}],["burger"],perks,{day:"weekday"}).status,"price-unavailable");
 assert.equal(evaluatePerks(foods,["missing"],perks,{day:"weekday"}).status,"invalid");
 assert.equal(evaluatePerks(foods,["burger"],[{...perks[0],amount:1000}],{day:"weekday"}).status,"invalid");
});
test("previews never spend money or change the input basket",()=>{
 const menu=Object.freeze(foods.map(x=>Object.freeze({...x})));
 const result=evaluatePerks(menu,["burger","corn"],perks,{day:"weekend"});
 assert.ok(result.best.savings<=result.subtotal);
 assert.equal(simulatePayable(result,null).payable,35);
 assert.deepEqual(result,evaluatePerks(menu,["burger","corn"],perks,{day:"weekend"}));
});
