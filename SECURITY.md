# Security / 安全

- **永远不要**把 MCP Token 写进 Issue、聊天截图、代码或 Actions 日志。
- 怀疑 Token 泄露：立即到官方 MCP 控制台撤销/重新申请；检查 GitHub 提交历史，不要只删掉最新文件。
- 本项目的 Node CLI 只允许调用只读 MCP Tool。浏览器演示绝不连接 MCP。
- 依赖由官方 @modelcontextprotocol/client 提供，升级时检查变更日志与安全公告。
- 如发现漏洞，请优先通过 GitHub 仓库的私密漏洞报告功能联系维护者，避免公开利用方法。
