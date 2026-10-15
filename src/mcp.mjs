import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
const ENDPOINT = "https://mcp.mcd.cn";
const ALLOWED_TOOLS = new Set([
  "list-nutrition-foods", "campaign-calendar", "query-my-coupons",
  "available-coupons", "query-my-account"
]);
export async function withMcDMcp(task) {
  const token = process.env.MCD_MCP_TOKEN;
  if (!token || !token.trim()) throw new Error("缺少 MCD_MCP_TOKEN。请在本机环境变量设置，不要写进仓库。");
  const client = new Client({ name: "mcdecision-lab", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(ENDPOINT), {
    requestInit: { headers: { Authorization: "Bearer " + token.trim() }, redirect: "manual" }
  });
  try {
    await client.connect(transport);
    return await task({
      list: () => client.listTools(),
      call: async (name, args = {}) => {
        if (!ALLOWED_TOOLS.has(name)) throw new Error("出于安全原因拒绝非只读工具：" + name);
        const manifest = await client.listTools();
        if (!manifest.tools.some(t => t.name === name)) throw new Error("服务器未提供工具：" + name);
        return client.callTool({ name, arguments: args });
      }
    });
  } finally {
    await client.close().catch(() => {});
  }
}
export const READ_ONLY_TOOLS = [...ALLOWED_TOOLS];
