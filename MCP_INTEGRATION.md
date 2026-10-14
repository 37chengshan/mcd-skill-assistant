# 麦当劳 MCP 集成设计与验证

## 一、真实接入（非模拟）

- 官方服务端： https://mcp.mcd.cn
- 协议：MCP / Streamable HTTP，认证：Authorization: Bearer （仅从本机环境变量读取）。
- 标准客户端：官方开源 @modelcontextprotocol/client v2。
- 入口：src/mcp.mjs （连接、握手、工具清单、只读白名单）和 src/cli.mjs （实际调用与报告）。
- 与演示区别：docs/index.html 使用明示的虚构样例；浏览器完全不会发出 MCP 请求，保护 Token。
- 正式环境运行要求：个人申请有效的麦当劳 MCP Token 后在本地设置 MCD_MCP_TOKEN，不在 GitHub Actions 中放个人 Token。

## 二、实际调用的工具及价值

| 真实 MCP Tool | 用法 | 价值 |
| --- | --- | --- |
| list-nutrition-foods | npm run live -- nutrition / analyze | 取得官方营养结构，筛选多目标组合 |
| campaign-calendar | npm run live -- calendar | 查看当月营销活动，不编造活动日期 |
| query-my-coupons | npm run live -- coupons | 读取自己的优惠券，不自动领取 |
| listTools 协议方法 | npm run live -- tools | 自我发现服务端可用 Tool 与 inputSchema |

调用链：Node CLI → 官方 TypeScript MCP Client → HTTPS 认证握手 → listTools → read-only callTool → 输出官方返回 → 严格营养字段归一化 → Pareto 约束搜索 → 解释性结果。

## 三、演示与验证边界

1. 离线演示 / 单元测试：无需 Token，可复现优化算法，数据全为虚构样例。
2. 真实 MCP：执行 live 命令会向 mcp.mcd.cn 发出请求；是否成功取决于有效 Token、网络、实时工具授权与服务器 schema。
3. 工具返回若缺少可核实的每份 kcal / 蛋白质 g 字段，则停止计算，不把 kJ 当 kcal，不编造价格。
4. MCP 营养响应未必包含当日门店实际价格；真实优化默认不使用预算约束，并明确说明价格未知。**不能将离线模拟称为实盘结算。**
5. 下单、取消订单、领券、积分兑换、积分抽奖均属于改变账户状态的行为：本项目不提供自动执行。

## 四、在个人机器上验证

~~~bash
npm install
# 在终端的本地环境中设置 MCD_MCP_TOKEN（切勿提交 GitHub）
npm run live -- tools
npm run live -- nutrition
npm run live -- analyze
npm run live -- calendar
~~~

如 list-nutrition-foods 的正式响应字段与 src/normalize.mjs 不同，请先运行 nutrition 核对字段单位，再添加映射并补充测试。**切勿在 Issue 中粘贴包含个人信息、Token 的响应。**

官方文档：https://github.com/M-China/mcd-mcp-server
