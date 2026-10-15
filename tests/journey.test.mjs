import test from "node:test";
import assert from "node:assert/strict";
import { previewJourney,deepLinkJourney } from "../docs/journey-engine.mjs";
const foods=[
 {id:"a",name:"A",price:24,calories:330,protein:28},
 {id:"b",name:"B",price:18,calories:290,protein:20},
 {id:"c",name:"C",price:9,calories:90,protein:3},
 {id:"d",name:"D",price:21,calories:300,protein:22},
 {id:"e",name:"E",price:12,calories:140,protein:10}
];
const base={goal:"balanced",budget:45,maxCalories:800,minProtein:15,variety:70,guests:2};
test("guided single meal renders actual recommendations and deep link",()=>{
 const p=previewJourney(foods,{...base,scene:"solo"});
 assert.equal(p.status,"ok");assert.equal(p.scene,"solo");assert.ok(p.cards.length);
 assert.match(deepLinkJourney({...base,scene:"solo"}),/^\.\/index\.html\?/);
});
test("guided group preview uses real group allocation and personal constraints",()=>{
 const p=previewJourney(foods,{...base,scene:"group",guests:3});
 assert.equal(p.status,"ok");assert.equal(p.cards.length,3);
 assert.match(deepLinkJourney({...base,scene:"group",guests:3}),/group\.html\?/);
});
test("guided week preview renders 7 distinct days from week planner",()=>{
 const p=previewJourney(foods,{...base,scene:"week"});
 assert.equal(p.status,"ok");assert.equal(p.cards.length,7);
 assert.match(deepLinkJourney({...base,scene:"week"}),/week\.html\?/);
});
test("invalid or extreme inputs rejected instead of triggering unbounded work",()=>{
 assert.equal(previewJourney(foods,{...base,scene:"other"}).status,"invalid");
 assert.equal(previewJourney(foods,{...base,scene:"group",guests:500}).status,"invalid");
 assert.equal(previewJourney(foods,{...base,budget:Infinity,scene:"solo"}).status,"invalid");
});
