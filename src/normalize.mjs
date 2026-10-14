// Conservative MCP payload reader. Never invents missing price or nutrition units.
function collect(value, output, depth = 0) {
  if (depth > 8 || output.length > 1500 || value == null) return;
  if (typeof value === "string") {
    try { collect(JSON.parse(value), output, depth + 1); } catch { /* text is not structured data */ }
  } else if (Array.isArray(value)) {
    for (const part of value) collect(part, output, depth + 1);
  } else if (typeof value === "object") {
    output.push(value);
    for (const [key, v] of Object.entries(value)) {
      if (["content", "structuredContent", "data", "list", "items", "foods",
        "result", "results", "nutrition", "nutritionInfo", "foodList"].includes(key)) {
        collect(v, output, depth + 1);
      }
    }
  }
}
function numeric(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !/^\s*\d+(?:\.\d+)?\s*(?:kcal|g|元)?\s*$/i.test(value)) return null;
  return parseFloat(value);
}
function pick(obj, keys) {
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  return undefined;
}
export function extractNutrition(payload) {
  const nodes = [];
  collect(payload, nodes);
  const seen = new Set();
  const foods = [];
  for (const item of nodes) {
    const n = item.nutrition && typeof item.nutrition === "object" ? item.nutrition :
      item.nutritionInfo && typeof item.nutritionInfo === "object" ? item.nutritionInfo : item;
    const name = pick(item, ["name", "foodName", "food_name", "productName", "餐品名称", "名称"]);
    let calories = numeric(pick(n, ["calories", "kcal", "energyKcal", "energy_kcal", "热量", "能量(kcal)"]));
    const kilojoules = numeric(pick(n, ["energyKj", "energy_kj", "能量(kJ)"]));
    if (calories === null && kilojoules !== null) calories = kilojoules / 4.184;
    const protein = numeric(pick(n, ["protein", "proteinG", "protein_g", "蛋白质", "蛋白质(g)"]));
    const price = numeric(pick(item, ["priceYuan", "price_yuan", "referencePrice"]));
    if (typeof name !== "string" || !name.trim() || calories === null ||
      protein === null || calories < 0 || protein < 0) continue;
    const id = String(pick(item, ["foodCode", "code", "id"]) ?? name);
    if (seen.has(id)) continue;
    seen.add(id);
    foods.push({ id, name: name.trim(), calories, protein, price });
  }
  return foods;
}
