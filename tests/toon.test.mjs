import test from "node:test";
import assert from "node:assert/strict";
import { parseToon, extractNutrition } from "../src/normalize.mjs";

const officialShape = {
  content:[{type:"text",text:JSON.stringify({
    success:true, code:200,
    data:'[2]{productName,nutritionDescription,energyKj,energyKcal,protein}:\n  猪柳麦满分,null,1288,308,16\n  "套餐,测试",null,418.4,100,7'
  })}]
};
test("parses official documented nested TOON nutrition response",()=>{
  const foods=extractNutrition(officialShape);
  assert.equal(foods.length,2);
  assert.equal(foods[0].name,"猪柳麦满分");
  assert.equal(foods[0].calories,308);
  assert.equal(foods[0].protein,16);
  assert.equal(foods[1].name,"套餐,测试");
  assert.equal(foods[0].price,null);
});
test("rejects truncated and malformed TOON",()=>{
  assert.deepEqual(parseToon('[2]{productName,energyKcal,protein}:\n  Example,100,10'),[]);
  assert.deepEqual(parseToon('[1]{productName,energyKcal,protein}:\n  Example,100'),[]);
});
test("rejects ambiguous units or incompatible columns",()=>{
  const data={data:'[1]{productName,energy,protein}:\n  Mystery,400,20'};
  assert.equal(extractNutrition(data).length,0);
  assert.deepEqual(parseToon('[1]{productName,protein,protein}:\n  Foo,20,20'),[]);
});
test("prevents unconstrained huge TOON payloads",()=>{
  assert.deepEqual(parseToon('[999999]{productName,energyKcal,protein}:\n  Foo,100,10'),[]);
});

const nutritionRow=(fields)=>extractNutrition({
  data:'[1]{productName,energyKcal,energyKj,protein,referencePrice}:\n  Food,'+fields
});
test("rejects yuan as protein",()=>{
  assert.equal(nutritionRow('100,null,20元,10元').length,0);
});
test("rejects wrong units in calorie fields",()=>{
  assert.equal(nutritionRow('100g,null,20g,10元').length,0);
  assert.equal(nutritionRow('100元,null,20g,10元').length,0);
});
test("accepts matching kcal, g, yuan units",()=>{
  const foods=nutritionRow('100kcal,null,20g,10元');
  assert.equal(foods.length,1);
  assert.equal(foods[0].calories,100);
  assert.equal(foods[0].price,10);
});
test("keeps accepting bare numbers",()=>{
  const foods=nutritionRow('100,null,20,10');
  assert.equal(foods.length,1);
  assert.equal(foods[0].protein,20);
});
test("converts kJ only when supplied in kJ column",()=>{
  const foods=nutritionRow('null,418.4kJ,20g,10元');
  assert.equal(foods.length,1);
  assert.ok(Math.abs(foods[0].calories-100)<1e-9);
  assert.equal(nutritionRow('null,418.4kcal,20g,10元').length,0);
});
test("rejects mismatched price unit without rejecting nutrition",()=>{
  const foods=nutritionRow('100kcal,null,20g,10g');
  assert.equal(foods.length,1);
  assert.equal(foods[0].price,null);
});
test("rejects nonfinite or negative numeric strings",()=>{
  assert.equal(nutritionRow('Infinity,null,20g,10元').length,0);
  assert.equal(nutritionRow('-100,null,20g,10元').length,0);
});
