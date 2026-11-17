# dsc19968 的博客

基于 Hexo 7 + Fluid 主题 + GitHub Pages 的个人博客。站点地址：<https://dsc19968.github.io>

## 首次发布

项目已初始化并完成第一次提交，远端也已配置好。你只需：

1. 在 GitHub 新建一个仓库，名称必须为 `dsc19968.github.io`，可见性选 Public，**不要**勾选初始化 README。
2. 在本目录执行：

```bash
git push -u origin main
```

3. 打开仓库页面 → `Settings` → `Pages` → `Build and deployment` → `Source` 选 **GitHub Actions**。
4. 到 `Actions` 标签页等构建变绿，然后访问 <https://dsc19968.github.io>。

> 如果推送时要求登录，需要配置 GitHub 凭据（Personal Access Token 或 Git Credential Manager）。

## 日常使用

```bash
npm install                  # 首次或换机器后安装依赖
npm run server               # 本地预览 http://localhost:4000
hexo new "文章标题"           # 新建文章
npm run build                # 本地生成静态文件到 public/
```

写完文章后：

```bash
git add .
git commit -m "写点什么"
git push
```

推送会自动触发部署，无需手动执行 `hexo generate`。

## 常用配置

| 想改什么 | 改哪个文件 |
|---|---|
| 站点名、副标题、作者、网址 | `_config.yml` |
| 主题配色、菜单、头像、评论、统计 | `source/_data/fluid_config.yml` |
| 关于页 | `source/about/index.md` |
| 自动部署流程 | `.github/workflows/pages.yml` |

主题配置说明：<https://hexo.fluid-dev.com/docs/guide/>

## 绑定自己的域名（可选）

- 子域名：在 DNS 服务商添加 `CNAME` 记录，指向 `dsc19968.github.io`（不带仓库名）。
- 根域名：添加 4 条 `A` 记录，值为 `185.199.108.153`、`185.199.109.153`、`185.199.110.153`、`185.199.111.153`。
- 然后在仓库 `Settings` → `Pages` → `Custom domain` 填入域名，保存后勾选 **Enforce HTTPS**。

## 注意

- `node_modules/` 和 `public/` 已被忽略，不会提交；依赖由 Actions 中的 `npm ci` 安装。
- 站点是纯静态的，不支持 PHP、Python 或数据库。评论可以后续接入 Giscus / Twikoo。
