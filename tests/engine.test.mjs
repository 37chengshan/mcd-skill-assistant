import test from "node:test";
import assert from "node:assert/strict";
import { optimize, normalizeFood } from "../docs/engine.mjs";
import { extractNutrition } from "../src/normalize.mjs";

const data = [
  { name: "A", calories: 400, protein: 30, price: 20 },
  { name: "B", calories: 90, protein: 8, price: 8 },
  { name: "C", calories: 600, protein: 10, price: 30 },
  { name: "D", calories: 0, protein: 0, price: 0 }
];
test("respects budget, kcal and protein limits", () => {
  const result = optimize(data, { budget: 30, maxCalories: 500, minProtein: 30 });
  assert.ok(result.plans.length > 0);
  for (const p of result.plans) {
    assert.ok(p.price <= 30 && p.calories <= 500 && p.protein >= 30);
  }
});
test("never treats unknown prices as zero in budget mode", () => {
  const result = optimize([{ name: "Mystery", calories: 200, protein: 40 }],
    { budget: 100, minProtein: 10 });
  assert.equal(result.plans.length, 0);
  assert.equal(optimize([{ name: "Mystery", calories: 200, protein: 40 }],
    { budget: null, minProtein: 10 }).plans[0].price, null);
});
test("does not modify original catalog", () => {
  const frozen = Object.freeze(data.map(x => Object.freeze({ ...x })));
  optimize(frozen, {});
  assert.equal(data[0].name, "A");
});
test("rejects malformed nutrition and negative prices", () => {
  assert.equal(normalizeFood({ name: "bad", calories: -10, protein: 2 }), null);
  assert.equal(normalizeFood({ name: "bad", calories: 100, protein: "not available" }), null);
  assert.equal(normalizeFood({ name: "good", calories: 200, protein: 20, price: -1 }).price, null);
});
test("Pareto frontier does not include dominated candidates", () => {
  const result = optimize([data[0], data[2]], { maxItems: 1, minProtein: 1 });
  assert.deepEqual(result.plans.map(p => p.foods[0]), ["A"]);
});
test("normalizes explicit kJ and kcal, never bare ambiguous energy", () => {
  const payload = { content: [{ type: "text", text: JSON.stringify({ foods: [
    { foodName: "one", nutrition: { energy_kj: 418.4, protein_g: 7 } },
    { foodName: "two", nutrition: { calories: 220, protein: 16 } },
    { foodName: "unsafe", nutrition: { energy: 300, protein: 8 } }
  ] }) }] };
  const foods = extractNutrition(payload);
  assert.equal(foods.length, 2);
  assert.ok(Math.abs(foods[0].calories - 100) < 0.0001);
});
test("results are deterministic", () => {
  assert.deepEqual(optimize(data, { budget: 50 }), optimize(data, { budget: 50 }));
});

test("evaluates outstanding items even when live response has more than 28 rows", () => {
  const many=Array.from({length:40}, (_,i)=>({
    id:String(i), name:"ordinary"+i, calories:300, protein:3, price:18
  }));
  many.push({id:"late",name:"late-high-protein",calories:280,protein:70,price:20});
  const result=optimize(many,{maxItems:1,minProtein:65,maxCalories:400,budget:30});
  assert.equal(result.inspectedSize,41);
  assert.ok(result.plans.some(p=>p.foods.includes("late-high-protein")));
});
