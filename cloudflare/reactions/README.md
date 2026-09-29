# “有共鸣”反馈服务

这个 Cloudflare Worker 为本站正式文章提供公开的“❤️ 有共鸣”计数。GitHub Pages 仍只负责静态页面；
Worker 校验请求并通过 D1 保存每篇文章的匿名反馈。

## 数据边界

- 浏览器为每篇文章生成独立随机值，并保存在 `localStorage`；不同文章之间不复用该值。
- Worker 只保存文章路径、随机值与文章路径组合后的 SHA-256，以及创建时间；不保存正文、姓名或邮箱。
- 相同文章和随机值使用联合主键去重，重复提交不会增加计数。
- 写请求检查 `Origin: https://tomyhometown.github.io`，这是基础误用防护，不是不可绕过的身份认证。
- 当前不使用 Turnstile。若出现明显刷量，应先增加服务端验证，再把计数视为可信。

## 部署

前提：拥有对应 Cloudflare 账户的授权维护窗口，且本机 Wrangler 已完成登录。不要把 OAuth 凭据写入仓库。

```bash
cd cloudflare/reactions
npx --yes wrangler d1 execute cixinanchu-reactions --remote --file schema.sql --yes
npx --yes wrangler deploy
```

`schema.sql` 使用 `IF NOT EXISTS`，可重复执行。部署后核对 Wrangler 输出的 Worker 名称、D1 binding 和版本 ID。

## 验证

先运行仓库测试：

```bash
node --check assets/reactions.js
node --check cloudflare/reactions/worker.mjs
node --test tests/*.test.cjs tests/*.test.mjs
```

再对一篇测试文章按顺序调用 API：查询应为原值，首次 `add` 增加 1，同 token 再次 `add` 不增加，`remove`
恢复原值，非本站 Origin 的写请求返回 403。测试结束必须取消测试反馈，不能把测试数据留在公开计数中。

若 `workers.dev` 在当前网络被 DNS 污染或阻断，可先通过 Wrangler 本地运行时验证行为；生产网络可达性仍需在目标
浏览器核对。前端获取计数失败时会隐藏整个反馈区域，不影响正文阅读。

## 恢复

- 前端故障：从文章和模板中移除 `/assets/reactions.js` 与 `reaction-panel`，或回退对应网站提交。
- Worker 故障：使用 Cloudflare Workers 的版本回滚恢复上一部署；不要删除 D1。
- 数据恢复：D1 是计数真源。修改或删除记录前先导出备份，并确认目标文章路径。
