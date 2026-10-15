# V1 原型：十项局部优化记录（2026-10-15）

> 纠正：以下仅是 V1 的小功能/修复，不是十轮产品大版本。真正产品级版本请看 [MAJOR_RELEASE_ROADMAP.md](MAJOR_RELEASE_ROADMAP.md)。

目标：创新体验、可解释推荐、移动端设计、参赛安全与测试。**完成代码迭代不代表真实麦当劳 MCP 联调、报名或获奖成功。**

| 轮次 | 已交付 | 代码 |
|---|---|---|
| 1 | 官方报名标题与正文格式统一 | [af4e4d5](https://github.com/37chengshan/mcd-skill-assistant/commit/af4e4d506b31a30796301b2b61854e7d849b575f) |
| 2 | TOON 营养响应解析、异常数据拒绝、恢复完整项目树 | [facb82c](https://github.com/37chengshan/mcd-skill-assistant/commit/facb82cddd5f262c6537a12b24bda23a8d0c089c) · [0a91083](https://github.com/37chengshan/mcd-skill-assistant/commit/0a91083764cee3c467b19ddbc1de0961b567b3ba) |
| 3 | 用户排除食物、偏好得分、大型菜单明确标记近似结果 | [0c08775](https://github.com/37chengshan/mcd-skill-assistant/commit/0c087751728c43845b2c139187f8422a077934c8) |
| 4 | 预算、热量、蛋白质对照与无可选搭配时的调整建议 | [53bc80c](https://github.com/37chengshan/mcd-skill-assistant/commit/53bc80c79f93a2329290333db7f97ad93ad94bac) |
| 5 | 全新暖色视觉和手机布局，面向用户的简洁文字 | [2547f67](https://github.com/37chengshan/mcd-skill-assistant/commit/2547f67283620ade41aae1863e3b4b3bb6527612) |
| 6 | “帮我拍板”随机选择、突出显示与焦点恢复 | [dc9273b](https://github.com/37chengshan/mcd-skill-assistant/commit/dc9273b4da6a347a0ce1d0783015b7c2f527582e) |
| 7 | “换种心情”对照实验：同样条件，不同侧重点 | [89d8c5e](https://github.com/37chengshan/mcd-skill-assistant/commit/89d8c5e21563c93df0dd141124c7d0668922c227) |
| 8 | 分享可复现的偏好链接，不分享密钥或个人账号信息 | [d89cf88](https://github.com/37chengshan/mcd-skill-assistant/commit/d89cf88a5941f2055a66905e2eb3f0c51598d3a7) |
| 9 | 跳到主内容、触控目标、键盘焦点和前端禁用术语测试 | [78834be](https://github.com/37chengshan/mcd-skill-assistant/commit/78834bef325bfb4f2e69d87ec860b8cf5403b652) |
| 10 | 浏览器模块真实 HTTP 可达性测试，修复本地预览缺少模块问题 | [406ba64](https://github.com/37chengshan/mcd-skill-assistant/commit/406ba640eab901beb8def723378c3b9213c09c47) |

验收示例：[CI #24（通过）](https://github.com/37chengshan/mcd-skill-assistant/actions/runs/38663034780)。

## 验证

~~~sh
npm install
npm run check
npm run demo
npm run preview
~~~

浏览器打开 http://127.0.0.1:4173 。以上离线检查覆盖数据约束、比较、解析、分享链接与预览服务路径；未代替真实 MCP 账号联调和实机浏览器截图审查。

## 参赛与发布尚存待办

1. **正式参赛报名**：官方 Issue 尚未检索到，须由参赛者在 [官方报名入口](https://github.com/M-China/mcd-developer-innovation-challenge/issues/new) 提交并获得机器人确认；请使用 [SUBMISSION.md](SUBMISSION.md) 的格式。
2. **真实 MCP 验证**：需要有效 Token 和可访问官方服务的网络，只能在安全环境中进行。
3. **GitHub Pages**：已有静态前端，但管理者需要在 Settings → Pages 选择 GitHub Actions 作为发布源；否则在线网址不可用。
4. **Star 公平竞争**：10 月 26 日 00:00（北京时间）为最终结算点，不能刷 Star 或自动操纵排名。

## 用户界面用词底线

网页用户可见文字必须通俗：今天吃什么、为什么推荐、换一种吃法、和其他方案比一比、分享给朋友。不得出现 MCP、Skill、TOON、JSON、API、Pareto、非支配、优化引擎、调试等开发者术语。开发者 README 与代码注释可保留技术信息。

设计参考（仅参考方法、不搬运素材）：[Anthropic Frontend Design](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)、[Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)。
