# 安全与合规规划

## 安全目标

TokenHub 位于企业 AI 调用链路的中心，必须默认安全：

- 不泄露 Provider 资源凭证。
- 不泄露内部 API Key。
- 不默认保存原始 Prompt 和 Response。
- 所有关键操作可审计。
- 所有模型调用可追踪。
- 支持企业身份源和权限模型。

## API Key 安全

| 规则 | 说明 |
| --- | --- |
| 明文只展示一次 | 创建 Key 后只在响应中展示一次 |
| 哈希存储 | 数据库只保存哈希，不保存明文 |
| 前后缀展示 | 用 prefix/suffix 辅助识别 |
| 过期时间 | 支持强制过期 |
| 轮换 | 支持创建新 Key 并设置旧 Key 过渡期 |
| 吊销 | 吊销后立即失效 |
| 最小权限 | 默认限制模型、额度、并发和项目范围 |

## Provider 资源凭证安全

- Provider 资源 Secret 必须加密保存。
- 本地部署可使用 `TOKENHUB_SECRET_KEY` 做 envelope encryption。
- 企业环境建议接入 KMS、Vault 或云厂商密钥服务。
- 凭证读取只允许后端 Provider 调用链路使用。
- 管理后台不回显完整凭证。
- 凭证变更必须写入 audit_events。

## 认证与授权

### MVP

- 管理员账号密码登录。
- Session 或 JWT。
- RBAC 角色：系统管理员、安全管理员、项目管理员、只读用户。

### 企业版本

- OIDC。
- LDAP。
- SAML，可选。
- 企业微信、飞书、钉钉 SSO。
- SCIM 用户同步，可选。

## RBAC 模型

| 资源 | 动作 |
| --- | --- |
| project | read、create、update、disable |
| api_key | read、create、rotate、revoke |
| provider | read、create、update、disable、test |
| model | read、create、update、disable |
| quota | read、update |
| usage | read、export |
| audit | read、export |
| alert | read、create、update、resolve |
| identity | read、create、update、disable |

授权判断应在后端完成，前端只做体验层面的菜单和按钮隐藏。

## 数据脱敏

### 默认策略

| 数据 | 默认处理 |
| --- | --- |
| Prompt | 不保存原文 |
| Response | 不保存原文 |
| Tool arguments | 不保存原文 |
| 文件内容 | 不保存 |
| API Key | 哈希存储 |
| Provider Secret | 加密存储 |
| IP | 可配置保存或脱敏 |
| User-Agent | 保存 |

### 可选策略

企业可以按合规要求启用：

- 保存 Prompt/Response 摘要。
- 保存 Prompt/Response 哈希。
- 保存脱敏后的文本。
- 对特定项目启用原文留存，但必须有明确提示、权限隔离和保留期限。

## 敏感内容检测

后续版本可支持：

- 敏感词列表。
- 正则规则。
- 身份证、手机号、银行卡、邮箱检测。
- 企业自定义分类。
- 请求前阻断。
- 请求后标记审计。

MVP 可以先预留策略接口，不强行实现复杂 DLP。

## 审计

### 请求审计

记录：

- request_id
- project_id
- api_key_id
- model
- provider
- route
- status
- latency
- token usage
- estimated cost
- error code
- client ip
- user agent
- created_at

默认不记录：

- 完整 Prompt。
- 完整 Response。
- Provider Secret。
- API Key 明文。

### 管理审计

记录：

- 登录、登出。
- 创建、禁用、删除项目。
- 创建、轮换、吊销 Key。
- 修改额度。
- 修改 Provider。
- 修改模型映射。
- 修改路由规则。
- 修改安全配置。

## 风险控制

| 风险 | 控制 |
| --- | --- |
| Key 泄露 | Key 哈希、过期、吊销、来源 IP 观察、异常告警 |
| 成本失控 | 日/月额度、成本告警、并发限制、模型白名单 |
| Provider 不可用 | 健康检查、fallback、重试、熔断 |
| 敏感数据外发 | 模型白名单、DLP、脱敏、审计、私有模型路由 |
| 越权管理 | RBAC、审计、二次确认 |
| 日志泄露 | 默认不落原文、结构化脱敏日志 |

## 合规声明建议

README、部署文档和管理后台应明确：

- 使用者必须遵守上游 Provider 服务条款。
- TokenHub 不提供规避上游计费、风控或服务条款的能力。
- TokenHub 不鼓励也不支持非授权账号账号的多人共享和 API 分发。
- 企业应确认其模型调用、数据处理和日志留存符合内部制度与所在地法律法规。

## 安全验收清单

MVP 上线前至少完成：

- API Key 明文不入库。
- Provider Secret 加密保存。
- 管理操作有审计日志。
- 请求日志不保存完整 Prompt/Response。
- 额度超限能阻断请求。
- Key 禁用和吊销立即生效。
- 后端所有 Admin API 做权限校验。
- 日志中没有 Key、Secret、Authorization header。
- Docker 默认配置不使用弱口令。
