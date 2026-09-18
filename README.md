# 情境书签

中文文学阅读 MVP：输入或选择情境 → 1–3 枚语义匹配书签 → 原文与个性化解读 → 本机收藏与反馈。

## 当前能力与边界

- 输入与支持情境通过知乎直答 zhida-fast-1p5 理解、匹配和生成。单次请求生成全部候选解读，翻页/刷新复用结果；纯阅读预设走编辑解读，不调用模型。原文只能从内容库按 ID 读取。
- 未保存用户输入正文。D1 保留匿名会话、情境类型、书签绑定、揭晓和选项反馈，并加密存储个性化解读。AES-GCM 密钥由随机 HttpOnly owner cookie 和会话 ID 派生；明文 cookie 不在 D1 存储。
- 30 分钟后服务端拒绝访问；创建/读取时清理过期数据，主动清除立即级联删除。未配置定时清理，勿承诺到期瞬间物理删除。
- 本机收藏仅保存原文编号；无账户、无同步、无公开留言。
- 模型判断迫近自伤/伤人风险时进入静态支持页。此判断可能出错，不是危机识别或救援服务。
- 现有公开网址 https://a-page-for-now.zooxz7c.chatgpt.site ，访客无需账户。保持现有访问范围。

## 技术

React 19 / TypeScript / Vinext（Next.js App Router 兼容）/ Cloudflare Workers + D1 / Drizzle。为匹配 Sites 托管，用 D1 替代参考文档中的 PostgreSQL。页面数据请求、授权与出处均由服务端处理。

## 本地运行

需要 Node >=22.13 与 npm。依赖固定在 package-lock.json。

```sh
npm run install:ci
npm run db:generate
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_futuristic_maginty.sql
npm run dev
```

只对尚未应用的本地数据库执行迁移。已有数据库不要重复执行。默认预览 http://localhost:5173/ 。服务器配置保持在 .openai/hosting.json；不要重新注册已有项目。

```sh
node node_modules/typescript/bin/tsc --noEmit
node tests/reading-api.mjs
node tests/model-contract.mjs
# 显式允许消耗 3 次模型调用：
BOOKMARKS_LIVE_TEST=1 node tests/model-live.mjs
```

API 测试使用正在运行的本地服务，并创建/清理合成会话。可通过 BOOKMARKS_TEST_URL 指定独立测试地址。不要在公众生产数据中执行。

## 维护

- 编辑 `content/quotes.ts` 修改语料；已发布版本应新增版本后更新，撤下设置 status=withdrawn。
- 语料核验限制见 `docs/CONTENT_REVIEW.md`。
- 产品决定、用户偏好及已打通链路见 `docs/PROJECT_MEMORY.md`，后续工作先读取，避免反复询问。
- 生产数据库更改使用新迁移，不重写已应用迁移。
- 原始输入不进入错误日志，公开页面与匿名私密接口均不做共享响应缓存。
- 支持 WebMCP 时注册 start_situation_reading；未支持的浏览器照常使用 UI。

## 模型运行配置

生产环境通过 Sites 配置 ZHIHU_ACCESS_SECRET（secret）、ZHIHU_MODEL（默认 zhida-fast-1p5）、AI_DAILY_LIMIT（默认全站每天 80 次，北京时间重置）。单 IP 每小时最多 10 次模型调用。限流包括失败尝试，不自动重试 POST；已完成的同会话幂等请求不重复调用模型。

本地使用忽略的 .env.local，勿提交密钥。凭证已在当前电脑的知乎 CLI 钥匙串配置；其底层 go-keyring-base64 包装必须解码，不能把包装值当成 Access Secret。生产配置已完成，不要重复索要。

知乎直答实测未可靠遵循独立 system message，因此将任务规则、受控候选与显式分隔的用户数据放在单条 user 消息中。服务端仍执行 JSON 校验、候选 ID 白名单、重复 ID 拒绝与行动禁用约束。自由输入遇到上游错误、截断或不合规输出时返回可重试错误；预设情境改用对应主题的编辑书签兜底，并明确标为编辑解读。模型 45 秒超时，前端 55 秒；不记录请求正文或上游响应。
