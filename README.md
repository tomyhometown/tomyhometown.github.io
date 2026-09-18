# 此心安处

以文字为主的个人网站，记录经历、思考、作品和书影音游。

网站地址：https://tomyhometown.github.io/

## 编辑与预览

首页是根目录的 `index.html`，样式也在同一个文件中，无须安装依赖或构建。
直接用浏览器打开即可预览。页面中的示例条目需逐步替换为真实内容；修改文字时保留 HTML 标签，正文中的 `&`、`<`、`>` 分别写为 `&amp;`、`&lt;`、`&gt;`。

主要分区的 ID 为 `thoughts`（思考）、`life`（经历）、`works`（作品）、`shelf`（书影音游）和 `about`（关于）。复制对应的条目即可添加记录。只发布自己选择公开的内容。

## 发布

GitHub Pages 使用 `master` 分支的根目录：仓库 Settings → Pages → Deploy from a branch → `master` / `/(root)`。
提交首页更新后，在 Actions 中确认 Pages 构建和部署成功，再访问网站检查内容。
`.nojekyll` 使首页作为静态文件发布。若普通刷新仍显示旧版，可强制刷新或等待缓存更新。

旧 Gridea 文章和资源保留在原路径。请勿再用旧 Gridea 配置直接发布覆盖这个仓库。
如需恢复旧首页，可从提交 `c6faec8dd039af3d4b94b55631db8ed989ab822d` 取回 `index.html`，再提交一次更新；无须重置分支历史。
