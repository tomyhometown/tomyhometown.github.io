# 此心安处

个人网站：<https://tomyhometown.github.io/>。存放经历、思考、作品，以及阅读、观影和游戏记录。

## 如何维护

**添加记录请阅读 [写作与发布说明](WRITING.md)**，包含浏览器编辑、本地编辑、文章模板、图片、分类链接和发布检查。

网站由静态 HTML、CSS、JavaScript 和预生成的发布索引组成，没有后台，也不需要安装第三方依赖。发布记录前需用仓库内的 Node.js 脚本更新索引；GitHub Pages 仍从 `master` 分支根目录直接发布，`.nojekyll` 保留在根目录。

| 内容 | 文件 |
| --- | --- |
| 首页 | `index.html` |
| 思考与记录 | `thoughts/index.html` |
| 重要经历 | `life/index.html` |
| 作品 | `works/index.html` |
| 阅读 | `reading/index.html` |
| 观影 | `movies/index.html` |
| 游戏 | `games/index.html` |
| 小说 | `novels/index.html` |
| 关于 | `about/index.html` |
| 发布热力图脚本 | `assets/heatmap.js` |
| 预生成的发布索引 | `assets/publications.json` |
| 发布索引生成脚本 | `scripts/build-publication-index.cjs` |
| 全站新页面样式 | `assets/site.css` |
| 文章模板 | `_templates/record.html.txt` |
| 作品案例模板 | `_templates/work.html.txt` |
| 找不到页面时的提示 | `404.html` |
| 搜索引擎入口 | `sitemap.xml`、`robots.txt` |

旧 Gridea 文章和资源仍保留在原路径，新站不依赖 Gridea。不要再用旧 Gridea 发布流程覆盖此仓库。

首页从发布时预生成的索引读取统计及最近三篇，不会在访客打开页面时逐篇下载正文，详细口径见
[写作与发布说明](WRITING.md#9-小说与发布统计)。
