---
title: 博客的第一篇文章
date: 2026-11-17 10:00:00
categories: 随笔
tags:
  - Hexo
  - GitHub Pages
  - 开始
---

欢迎来到我的博客。这里用来记录技术学习、项目实践和一些日常思考。

## 这个博客是怎么来的

站点由 [Hexo](https://hexo.io/) 生成静态文件，托管在 GitHub Pages 上。写作时只需要维护 Markdown 文件，推送到 `main` 分支后，GitHub Actions 会自动完成构建和发布。

## 以后怎么发文章

在项目目录执行：

```bash
hexo new "文章标题"
```

然后编辑 `source/_posts/文章标题.md`，写完后推送：

```bash
git add .
git commit -m "新增文章"
git push
```

等一两分钟，打开 <https://dsc19968.github.io> 就能看到更新。

## 可以随手改的地方

- 站点名称、描述、作者：编辑根目录的 `_config.yml`
- 主题外观、菜单、头像、评论：编辑 `source/_data/fluid_config.yml`
- 关于页内容：编辑 `source/about/index.md`

不必修改 `node_modules` 里的任何文件，那些内容不会提交到仓库。
