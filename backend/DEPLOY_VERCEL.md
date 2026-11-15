# XG Prime AI 网关：Vercel 部署（无需 Cloudflare）

## 目标
用户无需填写 API Key、模型名称或接口地址。Vercel 后端统一连接模型服务，密钥只保存在 Vercel 环境变量中。

## 部署步骤

1. 注册/登录 Vercel：https://vercel.com/
2. 选择 Add New -> Project，导入 GitHub 仓库 `XGodxx999/XG`。
3. 在项目 Settings -> Environment Variables 添加：
   - `OPENAI_API_KEY`：平台自己的模型服务 API Key（Sensitive）
   - `OPENAI_MODEL`：平台选定且账号有权限使用的模型 ID
   - `ALLOWED_ORIGIN`：`https://xgodxx999.github.io`
4. 部署项目。Vercel 会自动识别仓库中的 `api/ai.js`，创建 `/api/ai` 接口。
5. 测试 `https://你的项目域名.vercel.app/api/ai/health`。应返回服务正常的 JSON。
6. 在 Vercel 项目中设置使用量告警，并配置适合的速率限制/防滥用规则。公开开放前必须做好预算控制。

## 安全说明

- API Key 和模型 ID 只由服务器环境变量提供，不会发送到浏览器。
- 服务端固定模型，限制消息数量、单条内容长度和最大输出 token。
- CORS 来源校验不是身份认证，不能阻止所有自动化滥用。公开发布前应增加用户登录、服务端配额和速率限制。
- 模型调用会产生费用。平台需要承担费用并监控用量；没有配置预算和滥用保护前，不应向公众开放。
- 当前只是单一平台密钥的基础网关，不包含用户账号、个人额度、支付或账单系统。

## 前端切换

前端 AI 工作台需要改为只请求：
`https://你的项目域名.vercel.app/api/ai`

请求体只传 `messages`、`stream`、`temperature`，不得再让用户输入 API Key、模型名称或第三方地址。
