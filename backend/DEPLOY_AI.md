# XG Prime AI Gateway 部署说明

目标：用户无需填写 API Key、模型名或接口地址。所有模型凭据只保存在 Cloudflare Worker Secret 中，浏览器只请求 XG 自己的网关。

## 当前状态

- 前端仍托管在 GitHub Pages，不能保存服务端密钥。
- 本目录提供 Cloudflare Worker 网关代码。
- 网关部署并配置密钥、模型、来源域名及限流规则后，才能正式开放 AI。
- 不要把任何真实 API Key 写入 GitHub 仓库、网页 JS、HTML 或公开配置文件。

## 部署

1. 在 Cloudflare 创建一个 Worker，例如 `xg-prime-ai`。
2. 将 `cloudflare-worker.js` 内容部署为 Worker 入口。
3. 在 Worker Settings -> Variables and Secrets 添加：
   - Secret: `OPENAI_API_KEY` = 平台自己的 API Key
   - Variable: `OPENAI_MODEL` = 平台选定且账号有权限使用的模型 ID
   - Variable: `ALLOWED_ORIGIN` = `https://xgodxx999.github.io`
4. 绑定自定义域名或使用 Cloudflare Worker 提供的 HTTPS 地址。
5. 测试 `GET https://你的网关域名/health`，应返回 `{"ok":true,"service":"XG AI Gateway"}`。
6. 在 Worker 入口配置 Cloudflare Rate Limiting：按 IP 对 `POST /api/ai` 限流，并设置每日/每月预算告警。没有完成限流和预算控制前，不要公开发布网关。
7. 将网关地址写入 XG 前端的受控配置，再把 AI 前端改为只请求 `POST https://你的网关域名/api/ai`。前端请求只发送 messages、stream、temperature；不再收集用户密钥或模型名称。

## 安全边界

- Worker 固定使用服务端 `OPENAI_MODEL`，忽略浏览器传入的 model，限制输入长度、消息数和输出长度。
- API Key 只通过 Worker Secret 注入，绝不返回给浏览器。
- 必须保留来源校验、Cloudflare 限流、用量监控和预算告警。CORS 不是身份认证，不能单独阻止脚本滥用。
- 当前基础版本不提供用户账户体系和个人配额；正式面向公众开放前，应增加登录身份、服务端配额/计量和滥用封禁。
- 模型调用按服务商价格计费。平台需要自行承担费用，并配置硬性预算或及时停用开关。

## API

`POST /api/ai`

请求示例：

```json
{
  "messages": [
    {"role":"system","content":"你是 XG Prime 助手。"},
    {"role":"user","content":"你好"}
  ],
  "stream": true,
  "temperature": 0.7
}
```

模型名和密钥由服务端环境变量控制，用户不需要提供。
