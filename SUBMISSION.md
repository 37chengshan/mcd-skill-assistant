# Official contest submission / 报名说明

本仓库为 2026 年麦当劳程序员创意开发大赛参赛候选项目。正式报名必须由仓库 Owner 在官方比赛项目提交 Issue，且在 Issue 机器人回复“报名成功”后才可确认。

官方入口：https://github.com/M-China/mcd-developer-innovation-challenge/issues/new

## 填入以下内容

**Issue 标题：** 【参赛申请】麦麦决策实验室 McDecision Lab

**Issue 正文（保持下列字段名和格式，不要添加 Markdown 链接或空行）：**

~~~text
【参赛申请】
项目名称：麦麦决策实验室 McDecision Lab
项目地址：https://github.com/37chengshan/mcd-skill-assistant
项目简介：基于麦当劳中国 MCP 的只读营养、活动与优惠券查询，结合预算、热量和蛋白质进行可解释的多目标套餐决策。提供离线互动演示、真实 MCP 接入代码、自动化测试与开源 Skill。
~~~

## 参赛前自行确认

- GitHub 账号拥有该公开仓库，并遵守活动参赛身份、年龄、地域规定及主办方完整规则。
- 仓库含 README.md、CONTEST_DECLARATION.md（保持官方原文）、MCP_INTEGRATION.md、mcp-config.example.json 和源代码。
- 官方 MCP Token 仅保留在本机；仓库中绝无真实账号凭证。
- 自行运行 npm run live -- tools 和 npm run live -- nutrition，确保账号可真实调用麦当劳 MCP。若因环境/权限未验证成功，不能宣称完成实机联调。
- 按主办方 Issue 机器人回复判断报名状态。报名 Issue 并非由普通仓库的 CI 自动代提交。

比赛时间：2026-10-09 10:30 至 2026-10-25 23:59（北京时间）；最终排名以 2026-10-26 00:00 公开 Star 数为依据。

官方规则：https://github.com/M-China/mcd-developer-innovation-challenge/blob/main/activityGuidelines.md
