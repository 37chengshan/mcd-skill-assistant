import test from "node:test";
import assert from "node:assert/strict";
import { createNutritionSnapshot,readNutritionSnapshot } from "../docs/snapshot.mjs";

test("exports only public food nutrition, never prices or account values",()=>{
 const original=[{id:"f-1",name:"一份演示餐品",calories:320,protein:21,price:39,memberId:"private"}];
 const snap=createNutritionSnapshot(original,"2026-10-15T00:00:00.000Z");
 assert.equal(snap.foods.length,1);
 assert.deepEqual(snap.foods[0],{id:"f-1",name:"一份演示餐品",calories:320,protein:21,price:null});
 assert.equal(snap.priceStatus,"unknown");
 assert.ok(!JSON.stringify(snap).includes("private"));
 assert.equal(readNutritionSnapshot(JSON.stringify(snap)).foods[0].name,"一份演示餐品");
});
test("rejects added private fields, future formats and invented prices",()=>{
 const snap=createNutritionSnapshot([{id:"a",name:"A",calories:180,protein:17}]);
 assert.throws(()=>readNutritionSnapshot(JSON.stringify({...snap,token:"secret"})),/unexpected/i);
 assert.throws(()=>readNutritionSnapshot({...snap,format:"unknown"}),/format/i);
 assert.throws(()=>readNutritionSnapshot({...snap,foods:[{...snap.foods[0],price:10}]}),/price/i);
 assert.throws(()=>readNutritionSnapshot({...snap,foods:[{...snap.foods[0],phone:"1234"}]}),/unexpected/i);
});
test("rejects empty, broken, duplicate or oversized catalogs",()=>{
 const snap=createNutritionSnapshot([{id:"a",name:"A",calories:180,protein:17}]);
 assert.throws(()=>readNutritionSnapshot({...snap,foods:[]}),/catalog/i);
 assert.throws(()=>readNutritionSnapshot({...snap,foods:[snap.foods[0],snap.foods[0]]}),/duplicate/i);
 assert.throws(()=>createNutritionSnapshot([]),/catalog/i);
 assert.throws(()=>readNutritionSnapshot("x".repeat(700000)),/size/i);
});
test("limits suspicious food names and nutritional units",()=>{
 const snap=createNutritionSnapshot([{id:"a",name:"A",calories:180,protein:17}]);
 assert.throws(()=>readNutritionSnapshot({...snap,foods:[{...snap.foods[0],name:"<script>"}]}),/name/i);
 assert.throws(()=>readNutritionSnapshot({...snap,foods:[{...snap.foods[0],calories:1e8}]}),/calories/i);
 assert.throws(()=>readNutritionSnapshot({...snap,foods:[{...snap.foods[0],protein:NaN}]}),/protein/i);
});
