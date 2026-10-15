# 🍔 麦麦决策实验室 · McDecision Lab

**把“今天吃什么”变成可解释的多目标决策。** 基于麦当劳中国官方 MCP 的独立开源 Skill，集成营养信息、活动日历、个人优惠券读取，并提供预算 × 热量 × 蛋白质的帕累托优化算法。

> 🟡 **参赛作品，非麦当劳官方产品。** 在线静态界面仅展示虚构样例，不会读取你的 Token、不会自动下单。真实数据通过本地 MCP Client 查询；实际餐品、价格、活动和权益均以麦当劳官方实时结果为准。

**[🎨 交互页面](docs/index.html)** · **[🔍 十轮质量迭代记录](ITERATION_REPORT.md)** · **[🧠 Skill 指令](skills/mcdecision-lab/SKILL.md)** · **[🔌 MCP 集成详情](MCP_INTEGRATION.md)** · **[📢 官方比赛](https://github.com/M-China/mcd-developer-innovation-challenge)**

## ✨ 它能做什么？

| 模式 | 能力 | 数据边界 |
| --- | --- | --- |
| 互动决策面板 | 调预算、热量和蛋白质，实时重新计算方案与可解释理由 | 100% 虚构离线数据 |
| 多目标规划器 | 组合搜索、硬约束过滤、帕累托前沿、确定性排序 | 独立纯函数，可复现 |
| 真实营养分析 | 通过官方 MCP 的 list-nutrition-foods 查询，安全映射字段与单位 | 真实 MCP；字段不明确时拒绝编造 |
| 活动提醒素材 | campaign-calendar 获取实时活动日历 | 真实 MCP，查询不意味着活动一定可用 |
| 我的券包 | query-my-coupons 仅读取本人可用券 | 真实 MCP，绝不自动领券或下单 |

## 🪄 面向普通用户的创新玩法

- **今天想怎么吃？** 均衡一点、更省一点、更有料、轻盈一点，四种心情可以一键切换。
- **各有理由的推荐**：直观看到参考花费、能量和蛋白质，还能了解每一项距离自己定的目标有多少余量。
- **“帮我拍板”**：纠结时随机选一份高亮展示；真实的选择感，而不只是静态卡片。
- **两份摆在一起**：查看预算、能量、蛋白质的差别，不凭空宣称“最省钱”。
- **如果换个想法**：试试另一种目标，看看推荐会如何变化；条件过严时给出可操作的放宽建议。
- **不想吃的排除**：轻点食物标签就能排除；也可以复制安全的分享链接，让朋友沿用同样的偏好。
- **全新手机体验**：暖黄色视觉、紧凑标题、键盘操作支持和适配触控的按钮；页面不向普通用户展示开发者术语。

> **重要**：当前网页完全采用演示数据，真实营养、菜单和价格仍须以麦当劳官方实时信息为准。我们的浏览器页面不会连接你的个人账户，也不接收 Token。

## 🖥 30 秒玩起来

最直观的体验：安装 Node.js 22+ 后用下面的命令启动本地页面。直接双击 HTML 文件可能因浏览器安全限制而不能加载互动功能。

~~~bash
# 电脑已经安装 Node.js 22+ 的情况下
git clone https://github.com/37chengshan/mcd-skill-assistant.git
cd mcd-skill-assistant
npm install
npm run demo
npm test
npm run preview
~~~

然后在浏览器打开 http://127.0.0.1:4173 ，手机和电脑都可使用。页面中的食品和价格属于**明确标注的演示内容**，无需 Token 就能体验创新玩法。

### 一次性开启在线展示

仓库管理者进入 **Settings → Pages → Build and deployment → Source → GitHub Actions** 并保存。之后在 GitHub 的 **Actions → Static preview → Run workflow** 运行一次发布，完成后在线地址通常为 `https://37chengshan.github.io/mcd-skill-assistant/`。在 Actions 显示真正的 `deploy` 成功之前，请勿宣称页面已上线。配置后的后续前端更新会自动发布。

## 🔌 真正连接麦当劳 MCP

1. 按官方指南前往 https://open.mcd.cn/mcp 登录并申请个人 MCP Token。
2. 只在自己的本机终端设置环境变量 MCD_MCP_TOKEN；**切勿提交 .env、真实 mcp-config.json 或 Token**。
3. 在项目目录运行：

~~~bash
npm run live -- tools
npm run live -- nutrition
npm run live -- analyze
npm run live -- calendar
npm run live -- coupons
~~~

终端中 analyze 会对实际返回的营养字段尝试优化；**如果官方数据不含可靠售价，它不会捏造价格或节省金额。** 详见 [MCP_INTEGRATION.md](MCP_INTEGRATION.md)。云端静态演示永远不使用用户凭证。

## 💡 技术架构

~~~text
                          ┌─ docs/index.html + app.mjs  [完全离线·虚构样例]
用户选择约束 ────────────────┤
                          └─ src/cli.mjs                [本地真实数据模式]
                                 │
                           官方 MCP TypeScript SDK v2
                                 │ HTTPS / Streamable HTTP
                           mcp.mcd.cn (仅只读工具)
                                 │
                    src/normalize.mjs (严格单位 / 缺失检查)
                                 │
                   docs/engine.mjs (统一约束 / Pareto 搜索)
                                 │
                          JSON 输出 + 推荐解释
~~~

优化原则：先筛掉超预算、超热量、蛋白质不足的组合，再保留**不存在其他组合在成本、热量、蛋白质上全面不差且至少一项更好**的非支配方案。最后按透明的启发式得分排序。这是决策辅助，不是绝对最佳饮食建议。

## 🧪 可复现质量与安全

- 纯函数优化，Node.js 自带测试框架；不需要付费 AI API、数据库或个人账号即可测试。
- GitHub Actions 自动检查 Node 语法、单元测试、离线 CLI 示例、参赛必备文件。
- 官方 MCP SDK 负责连接与协议，避免重复实现握手或认证。
- 工具调用采用只读白名单，明确阻止下单、领券、积分兑换及抽奖等副作用操作。
- Web 演示不调用真实 MCP，个人 Token 只从本机环境变量加载。
- 每份营养信息的来源、价格可验证性都明确标注；不会把千焦误当千卡。

## 📂 项目导航

~~~text
docs/                 交互演示 + 通用多目标优化引擎
src/cli.mjs           命令行：离线 / 真实 MCP
src/mcp.mjs           官方 SDK 接入与只读白名单
src/normalize.mjs     MCP 结构化响应的安全字段解析
fixtures/             明确声明为虚构的示例数据
tests/                约束、Pareto、可靠性与映射测试
skills/               AI 助手可阅读的 Skill 指令
.github/workflows/    自动化测试
MCP_INTEGRATION.md    真实 Tool、调用顺序与验证边界
CONTEST_DECLARATION.md 官方原文参赛声明（未做改动）
~~~

## 🌱 开源与参与

欢迎提 Issue 反馈 MCP 字段兼容、算法测试和界面无障碍问题；不要分享个人优惠券、地址、手机号或 Token。项目采用 [MIT 协议](LICENSE)，官方示例配置仅按其许可和服务规则使用。本仓库不使用麦当劳官方徽标，也不暗示品牌背书。

如果它让你少纠结一次“今天吃什么”，欢迎点个 ⭐ Star，让更多开发者看到 **“透明、可验证、不乱花你的钱”的 AI Skill**。

[CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) · [比赛规则](https://github.com/M-China/mcd-developer-innovation-challenge/blob/main/activityGuidelines.md)
