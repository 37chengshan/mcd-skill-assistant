#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { optimize } from "../docs/engine.mjs";
import { extractNutrition } from "./normalize.mjs";

const guide = [
  "麦麦决策实验室 | McDecision Lab",
  "  npm run demo             # 安全离线示例，不调用真实 MCP",
  "  npm run live -- tools     # 从真实 MCP 发现可用工具",
  "  npm run live -- nutrition # 真实营养查询（只读）",
  "  npm run live -- analyze   # 真实营养数据 + 多目标方案",
  "  npm run live -- calendar  # 活动日历（只读）",
  "  npm run live -- coupons   # 个人优惠券查询（只读）",
  "所有价格以官方实时结算为准；本项目不会自动下单、领券或扣积分。"
].join("\n");

export async function run(args = process.argv.slice(2)) {
  const [mode, action] = args;
  if (mode === "demo") {
    const fixture = JSON.parse(await readFile(new URL("../fixtures/illustrative-menu.json", import.meta.url)));
    console.log(JSON.stringify(optimize(fixture, { budget: 45, maxCalories: 850,
      minProtein: 25, source: "illustrative" }), null, 2));
    return;
  }
  if (mode !== "live" || !["tools", "nutrition", "analyze", "calendar", "coupons"].includes(action)) {
    console.log(guide);
    return;
  }
  const { withMcDMcp } = await import("./mcp.mjs");
  await withMcDMcp(async ({ list, call }) => {
    if (action === "tools") {
      const manifest = await list();
      console.log(JSON.stringify(manifest.tools.map(t => ({
        name: t.name, description: t.description, inputSchema: t.inputSchema
      })), null, 2));
      return;
    }
    const tool = { nutrition: "list-nutrition-foods", analyze: "list-nutrition-foods",
      calendar: "campaign-calendar", coupons: "query-my-coupons" }[action];
    const result = await call(tool);
    if (result.isError) throw new Error("MCP 工具返回错误：" + tool);
    if (action !== "analyze") {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    const foods = extractNutrition(result);
    if (!foods.length) {
      console.log("真实 MCP 已响应，但营养字段无法安全映射为每份 kcal 和 g；拒绝编造数据。");
      console.log("可运行 npm run live -- nutrition 查看结构并更新 src/normalize.mjs。");
      return;
    }
    const solution = optimize(foods, { budget: null, maxCalories: 850,
      minProtein: 25, source: "live-mcd-mcp" });
    console.log(JSON.stringify({
      disclaimer: "仅使用识别为每份 kcal / g 的真实营养字段；没有实时价格，不能推断优惠或应付金额。",
      ...solution
    }, null, 2));
  });
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  run().catch(error => {
    console.error("运行失败：" + error.message.replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]"));
    process.exitCode = 1;
  });
}
