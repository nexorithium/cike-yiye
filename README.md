# 情境书签

中文文学阅读 MVP：输入或选择情境 → 三枚固定书签 → 原文与编辑解读 → 本机收藏与反馈。

## 当前能力与边界

- 30 段古典原文（10 位作者、16 个作品/章节标题），来源及异文记录在 `content/quotes.ts`。
- 当前只使用规则匹配及项目编辑解读，无模型调用或模型密钥；页面明确标识。不得宣传为个性化 AI 已接通。
- 未保存用户输入正文。D1 仅保留匿名会话、情境类型、书签绑定、揭晓和选项反馈。
- 30 分钟后服务端拒绝访问；创建/读取时清理过期数据，主动清除立即级联删除。未配置定时清理，勿承诺到期瞬间物理删除。
- 本机收藏仅保存原文编号；无账户、无同步、无公开留言。
- 已知危险表达进入静态支持页。当前规则不是完善的危机识别服务，公开测试前需人工审阅语料及安全策略。
- 当前私密 Sites 体验链接与部署状态由原任务交付。开放公众访问需另行改变访问范围并完成上线检查。

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
```

API 测试使用正在运行的本地服务，并创建/清理合成会话。可通过 BOOKMARKS_TEST_URL 指定独立测试地址。不要在公众生产数据中执行。

## 维护

- 编辑 `content/quotes.ts` 修改语料；已发布版本应新增版本后更新，撤下设置 status=withdrawn。
- 语料核验限制见 `docs/CONTENT_REVIEW.md`。
- 产品决定、用户偏好及已打通链路见 `docs/PROJECT_MEMORY.md`，后续工作先读取，避免反复询问。
- 生产数据库更改使用新迁移，不重写已应用迁移。
- 原始输入不进入错误日志，公开页面与匿名私密接口均不做共享响应缓存。
- 支持 WebMCP 时注册 start_situation_reading；未支持的浏览器照常使用 UI。
