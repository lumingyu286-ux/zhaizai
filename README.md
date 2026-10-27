# 宅家导航

按分类整理的休闲网址：10 个分类、51 个站点，带站内查找、本地收藏和深浅主题。无框架、无构建、无网络字体。

姊妹项目：[`changyong`](https://github.com/lumingyu286-ux/changyong)（工作日常向的分类导航）、[`baike-nav`](https://github.com/lumingyu286-ux/baike-nav)（索引页）、[`nav-hub`](https://github.com/lumingyu286-ux/nav-hub)（入口页）。四个项目视觉方向和内容刻意互不相同，仓库与部署各自独立——其中一个被下架不会连累其余三个。

和 `changyong` 的分工：那个站收的是搜索、AI、办公、开发、购物这类**工作日常**站点；这个站收的是影视、动漫、音乐、游戏、小说、社区这类**休闲娱乐**站点。两边几乎不重叠，不是互为镜像。

## 文件

| 文件 | 说明 |
|---|---|
| `sites.js` | **只需要改这一个文件**：站名、分类、网址 |
| `index.html` | 页面骨架 |
| `style.css` | 样式（浅色为主，可切深色，默认跟随系统） |
| `app.js` | 渲染、查找、收藏、主题、成人条目确认 |
| `404.html` | 找不到页面时的落地页，样式内联 |
| `robots.txt` | 收录策略，见「主力站还是镜像站」 |
| `.nojekyll` | GitHub Pages 用 |
| `.gitlab-ci.yml` | GitLab Pages 用 |

## 改 sites.js

```js
const GROUPS = [
  ['分类名', '角标', [
    ['站点名', 'https://example.com', '一句话说明'],
    ['成人站', 'https://example.com', '说明', 'adult'],   // ← 第四项
  ]],
];
```

- **顺序即显示顺序**，第一个分类排最上面。成人内容百科现在排第一位。
- 第四项写 `'adult'` 的条目会带 `18+` 角标，点击时先弹年龄确认。
- 每张卡片会自动显示目标域名（去掉 `www.`），不用手写。
- 分类只有一条时卡片宽度收窄，不会拉成一整行。

## 关于年龄确认

这个站绝大部分是豆瓣、Steam、Spotify 这类常规站点，所以**没有做进站全屏年龄门**——那等于把豆瓣锁在 18+ 警告后面，既荒唐也会把正常访客劝退。

做法是只拦成人条目：

- 条目带 `18+` 角标
- 点击时弹确认框，确认过一次就不再问（只存在本机）
- **成人条目的 `href` 是 `#`，真实地址放在 `data-url`**

最后一条别改回真地址。中键点击和右键「在新标签页中打开」都不会触发 `click` 事件，`href` 里有真地址就能直接绕过年龄确认。地址藏在 data 属性里，只能走确认后的 `window.open`。

代价是这一条没法「复制链接地址」，对一个需要确认才能进的链接来说可以接受。

## 代码里几处别动的地方

这些都是前一轮代码审查实际修出来的，不是预防性写法：

- **JS 注入的提示框用 `.notice`，不能用 `.boot`。** `.js-ok .boot { display:none }` 是给静态兜底块准备的隐藏规则，同名的话提示框刚创建就被藏掉，两层兜底互相抵消，`sites.js` 被拦时访客看到的是一个只有搜索框的空壳。
- **主题当前值记在模块变量 `themeNow` 里**，`localStorage` 只当尽力而为的持久化。每次回头读存储的话，隐私模式下写入失败、再读又拿到系统值，切换按钮从第二下起就死了。
- **`paintError()` 要把分类条一起清空**，否则留下一排指向已被清空的 `#g0…#gN` 的死链接。
- **确认框打开时给 `#shell` 设 `inert`**，并让 `/` 快捷键让路。`aria-modal` 只影响读屏器，管不住键盘焦点。
- **`@media (hover: none)` 下星标常驻显示**。触屏没有 hover，否则收藏功能在手机上等于不存在。

## 部署

### Cloudflare Pages

```
npx wrangler pages deploy . --project-name=zhaizai --branch main
```

新建项目时要加 `--force`，否则会被路由到 Workers 平台、拿到 `<项目名>.<账号名>.workers.dev` 这种带账号名的长域名，而不是 `<项目名>.pages.dev`。只有创建那一次需要。

当前部署：<https://zhaizai.pages.dev/>

### GitHub Pages

推到仓库，Settings → Pages → Source 选 `Deploy from a branch`，分支 `main`、目录 `/ (root)`。`.nojekyll` 已就位。

项目站挂在 `/<仓库名>/` 下，`404.html` 里有几行脚本会在 `*.github.io` 上自动把「回宅家导航」改写成 `/<仓库名>/`，不用手动改。

### GitLab Pages

`.gitlab-ci.yml` 已写好，推到默认分支自动跑。**新增文件记得同步加进里面的 `cp` 那一行**，否则不会被发布。

## 主力站还是镜像站

选一个主力，其余按镜像配，只改一处：

- 取消 `index.html` 里 `<meta name="robots" content="noindex,follow">` 那一行的注释

两个常见错误配法，都别用：

- **别再加 `canonical`。** 它会把信号合并到目标页，`noindex` 可能顺着一起传过去。
- **别把 `robots.txt` 改成 `Disallow: /`。** 爬虫被挡住就取不到 HTML，也就看不到 `noindex`，该网址仍可能凭外链被只收录网址。要可靠地不被收录，必须「允许抓取 + 返回 noindex」。

## 平台条款

按我的理解（不是法律意见，以各平台当前条款为准）：Cloudflare Pages 最宽松；GitHub 和 GitLab 的条款都禁止色情内容；Google Sites 明确禁止且牵连整个 Google 账号。

本站绝大部分是常规站点，成人内容只有一条且做了年龄确认，风险比纯成人导航低，但仍取决于平台怎么判定。

`title` 和 `description` 是照实写的，没有堆砌露骨关键词——标题与内容不符本身就是搜索引擎的门页信号，也是让免费平台最快下架你的做法。

## 本地预览

```bash
python -m http.server 8080
```

打开 <http://127.0.0.1:8080/>。用 `file://` 直接双击时 `localStorage` 可能被限制，收藏和主题不会被记住。
