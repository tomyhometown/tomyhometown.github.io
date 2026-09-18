# 写作与发布说明

这个网站的每个分类、每篇记录都可以有自己的网址。当前使用静态 HTML：写文章就是编辑文件，发布就是把文件提交到 GitHub 的 `master` 分支。没有后台登录或自动生成的文章列表。

## 1. 选择分类

| 记录内容 | 分类目录 | 分类列表文件 |
| --- | --- | --- |
| 思考、随想、长文 | `thoughts` | `thoughts/index.html` |
| 人生经历、旅行、重要时刻 | `life` | `life/index.html` |
| 项目、创作、作品介绍 | `works` | `works/index.html` |
| 读书记录 | `reading` | `reading/index.html` |
| 电影、剧集记录 | `movies` | `movies/index.html` |
| 游戏体验 | `games` | `games/index.html` |

一篇记录需要做两件事：**创建正文文件 + 在分类列表里加上链接**。首页已经链接到所有分类，无须每次改首页。

## 2. 只用浏览器添加记录

1. 登录有仓库写权限的 GitHub 账号，打开 [仓库](https://github.com/tomyhometown/tomyhometown.github.io)。
2. 确认当前分支是 `master`。按键盘上的 `.`，进入 GitHub 网页编辑器（github.dev），可以一次编辑并提交多个文件。
3. 打开 `_templates/record.html.txt`，复制全部内容。
4. 在目标分类下创建一个新文件。例如添加一篇读书记录时，创建 `reading/2026-09-18-book-notes/index.html`，粘贴模板内容。这里的日期和英文名称由你决定；建议使用小写英文字母、数字、短横线，之后尽量不改路径。
5. 按下一节替换模板中的内容。
6. 在 `reading/index.html` 中添加这篇记录的入口，方法见第 4 节。
7. 打开编辑器左侧的源代码管理，核对只有你打算发布的文件有改动；正文文件和分类列表一起提交。提交说明可以写 `docs(reading): add book notes`。点击提交并推送；如果界面分开提供 Commit 和 Sync/Push，则依次完成两步。
8. 到仓库的 [Actions](https://github.com/tomyhometown/tomyhometown.github.io/actions) 查看对应提交的 `pages build and deployment`，成功后检查线上页面。

若你更习惯 GitHub 普通网页的 Add file / Edit 按钮，也可以使用：先提交正文，再提交分类链接，避免出现已列出但正文尚不存在的链接。

## 3. 填写正文模板

`_templates/record.html.txt` 是作者模板，不是正式记录。不要直接修改模板来发表文章；复制为新的 `index.html` 后再填写。

以阅读记录为例，逐项修改：

| 模板位置 | 要填的内容 |
| --- | --- |
| `<title>文章标题 · 此心安处</title>` | 浏览器标签页标题 |
| `<meta name="description" content="一句话摘要">` | 文章的简短说明 |
| `rel="canonical"` 所在行 | 正式网址，例如 `https://tomyhometown.github.io/reading/2026-09-18-book-notes/` |
| 导航里的 `aria-current="page"` | 从“思考”链接移动到“阅读”链接；只能有一个当前分类 |
| `<a class="back" href="/thoughts/">← 思考与记录</a>` | 改为 `<a class="back" href="/reading/">← 阅读</a>` |
| `<h1>文章标题</h1>` | 正文标题 |
| `<time datetime="2026-09-18">2026-09-18</time>` | 日期，两处一起修改 |
| 日期下方的“一句话摘要” | 页面上显示的摘要 |
| `article-body` 中的段落 | 你的完整正文 |

每个段落用 `<p>...</p>` 包住。不需要了解所有 HTML，日常主要用以下几种写法：

```html
<p>这是一个段落。</p>
<p>这是另一个段落，可以写得很长。</p>
<h2>一个小标题</h2>
<p>这里接着写正文，<strong>这句话加粗</strong>。</p>
<blockquote><p>一段引用。</p></blockquote>
<ul>
  <li>第一点</li>
  <li>第二点</li>
</ul>
<p><a href="https://example.com/">相关链接</a></p>
```

以上格式代码只用于说明写法，不会自动出现在网站中。正文中的 `&`、`<`、`>` 分别写成 `&amp;`、`&lt;`、`&gt;`；属性值里的英文双引号用 `&quot;`。例如在 `content="..."` 中避免直接嵌入未转义的英文双引号。中文引号“”可以直接使用。

阅读记录可以自行写作者、阅读进度和感想；观影记录可以写导演、观看日期和观后感；游戏记录可以写平台、游玩进度和体验。不强制评分或固定字段。需要标注剧透时，直接在正文开头写清楚。

## 4. 在分类页面加上链接

打开对应分类的 `index.html`，找到 `<!-- 新记录放在这里，按日期从新到旧排列。 -->`，在其后放入一条：

```html
<article class="entry">
  <time datetime="2026-09-18">2026-09-18</time>
  <div>
    <h2><a href="/reading/2026-09-18-book-notes/">这篇记录的标题</a></h2>
    <p>用一两句话介绍这篇记录。</p>
  </div>
</article>
```

- 日期、标题、摘要和链接要换成这篇文章的真实值。
- 第一篇记录发布时，删除同一页面的 `<p class="empty">暂无公开记录。</p>` 以及紧挨着的空状态提示注释。
- 每篇记录复制一整段 `<article>...</article>`；新的放在上面，旧的放在下面。
- 链接必须和创建的目录一致，以 `/` 开头，以 `/` 结尾。
- 正文和分类入口需要手动维护，不会自动同步。

例如文件 `reading/2026-09-18-book-notes/index.html` 的网址是：

`https://tomyhometown.github.io/reading/2026-09-18-book-notes/`

## 5. 添加图片

将准备公开的图片放在 `assets/images/` 下，名字可以用 `2026-09-18-book-cover.jpg`。正文中插入：

```html
<img src="/assets/images/2026-09-18-book-cover.jpg" alt="图片内容的简短说明" loading="lazy">
```

图片会自动适应页面宽度。建议上传压缩过的图片，避免单张照片过大。图片文件和文章一起提交；文件名的大小写必须一致。

## 6. 修改已有内容

- 修改一篇记录：编辑该记录的 `index.html`。标题或摘要变化时，也更新分类列表。
- 更新个人介绍：编辑 `about/index.html`。
- 修改首页介绍：编辑根目录的 `index.html`。
- 调整字体、颜色、间距：编辑 `assets/site.css`，新站各页面都会使用它。
- 删除记录：删除正文文件，并移除分类列表里的入口。若分类已经没有文章，再放回空状态文字。
- 修改导航：导航是静态 HTML，首页、分类页、关于页、404 页、已有文章以及模板需要同步修改。

## 7. 本地预览和提交（可选）

已经使用网页编辑器时，可以跳过这一节。若使用本地 Git，推送需要你自己的 GitHub 授权；本地 Git 不会自动继承聊天应用的 GitHub 连接。

首次准备：

```bash
git clone https://github.com/tomyhometown/tomyhometown.github.io.git
cd tomyhometown.github.io
```

之后每次编辑前，确认工作区状态，并在没有待处理修改时同步：

```bash
git status
git pull --ff-only origin master
```

在仓库根目录启动预览：

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

浏览器打开 `http://127.0.0.1:8000/`，按 `Ctrl+C` 停止服务器。不要直接双击 HTML 预览：网站使用 `/assets/...` 等从站点根目录开始的路径，需要通过 HTTP 服务访问。

完成编辑后，按实际路径提交正文和列表：

```bash
git diff --check
git add reading/2026-09-18-book-notes/index.html reading/index.html
git diff --cached
git commit -m "docs(reading): add book notes"
git push origin master
```

有图片时，把相应图片也加入暂存。不要提交只打算保存在本地的内容。

## 8. 发布检查与恢复

1. 在 Actions 确认对应提交的 `pages build and deployment` 已成功，不能只看仓库有新文件。
2. 打开对应分类，检查新记录的位置、日期和摘要。
3. 点击记录，检查正文、图片、返回分类链接。
4. 用手机或窄窗口打开，确认文字和导航能正常阅读。
5. 如果仍显示旧内容，强制刷新，或在网址后加 `?v=本次提交的短编号`。
6. 如果文章返回 404，检查文件路径、文件名大小写，以及目录内是否有 `index.html`。
7. 如果部署失败，先看 Actions 中失败步骤的日志；不要反复覆盖文件来碰运气。

仓库 Settings → Pages 应保持 `Deploy from a branch`、`master`、`/(root)`。不要删除 `.nojekyll`。

要恢复误改的文件，可以在 GitHub 文件历史中找到上一版，复制回来并重新提交。不要通过强制推送清空历史。旧 Gridea 文章仍在 `post/` 等原路径；旧发布客户端不再用于维护新站。
