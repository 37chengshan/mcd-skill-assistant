// Pure decision engine. Runs in Node.js and in the browser, with no network or credentials.
function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
export function normalizeFood(food) {
  if (!food || typeof food !== "object") return null;
  const name = String(food.name ?? "").trim().slice(0, 80);
  const calories = numberOrNull(food.calories);
  const protein = numberOrNull(food.protein);
  const price = numberOrNull(food.price);
  if (!name || calories === null || protein === null) return null;
  return { id: String(food.id ?? name), name, calories, protein, price };
}
export function optimize(foods, options = {}) {
  const budget = numberOrNull(options.budget);
  const maxCalories = numberOrNull(options.maxCalories) ?? 800;
  const minProtein = numberOrNull(options.minProtein) ?? 15;
  const maxItems = Math.max(1, Math.min(3, Math.floor(Number(options.maxItems) || 3)));
  const limit = Math.max(1, Math.min(12, Math.floor(Number(options.limit) || 6)));
  const catalog = (Array.isArray(foods) ? foods : []).map(normalizeFood).filter(Boolean).slice(0, 28);
  const candidates = [];
  function visit(start, chosen) {
    if (chosen.length) {
      const calories = chosen.reduce((sum, f) => sum + f.calories, 0);
      const protein = chosen.reduce((sum, f) => sum + f.protein, 0);
      const priced = chosen.every(f => f.price !== null);
      const price = priced ? chosen.reduce((sum, f) => sum + f.price, 0) : null;
      if (calories <= maxCalories && protein >= minProtein &&
        (budget === null || (price !== null && price <= budget))) {
        candidates.push({
          foods: chosen.map(f => f.name), calories, protein, price,
          score: protein * 3 - calories * 0.045 - (price ?? 0) * 0.8 + chosen.length * 1.5
        });
      }
    }
    if (chosen.length === maxItems) return;
    for (let i = start; i < catalog.length; i++) visit(i + 1, [...chosen, catalog[i]]);
  }
  visit(0, []);
  // Pareto dominance: no more calories/cost, no less protein, better on >=1 axis.
  const dominates = (b, a) => {
    if (a.price === null && b.price !== null) return false;
    if (a.price !== null && b.price === null) return false;
    const costNoWorse = a.price === null || b.price <= a.price;
    const costStrict = a.price !== null && b.price < a.price;
    return costNoWorse && b.calories <= a.calories && b.protein >= a.protein &&
      (costStrict || b.calories < a.calories || b.protein > a.protein);
  };
  const frontier = candidates.filter((a, i) =>
    !candidates.some((b, j) => i !== j && dominates(b, a)));
  frontier.sort((a, b) => b.score - a.score || a.calories - b.calories ||
    a.foods.join("|").localeCompare(b.foods.join("|")));
  return {
    plans: frontier.slice(0, limit).map((p, i) => ({
      rank: i + 1, ...p,
      reason: "蛋白质 " + p.protein.toFixed(1) + "g · 能量 " +
        Math.round(p.calories) + "kcal" +
        (p.price === null ? " · 未提供实时价格" : " · 参考价格 ¥" + p.price.toFixed(1))
    })),
    eligible: candidates.length, frontierSize: frontier.length, catalogSize: catalog.length,
    priceVerified: false, source: options.source || "illustrative"
  };
}
