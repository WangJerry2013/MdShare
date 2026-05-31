# 我开源了一个 Markdown 协作编辑器 —— MdShare

大家好，最近我基于 HedgeDoc 二次开发，做了一个自己的开源 Markdown 协作编辑器，取名 **MdShare**。

## 什么是 MdShare？

MdShare 是一个**实时协作 Markdown 编辑器**，类似 HackMD、Etherpad。你可以创建一个笔记，把链接分享给别人，大家一起实时编辑，支持富文本、代码高亮、数学公式、流程图、幻灯片等等。

在线体验：https://demo.hedgedoc.org

## 为什么要做这个？

HedgeDoc 本身是个很棒的项目，但它的管理功能比较基础，没有可视化的后台管理面板。我在使用过程中觉得不方便，于是就动手给它加了一个**管理控制台（Admin Console）**，同时把项目更名为 MdShare，重新设计了品牌 Logo 和图标。

## 主要功能

- ✅ **实时协作编辑** — 多人同时编辑一篇 Markdown 笔记
- ✅ **管理控制台** — Dashboard 概览、用户管理、笔记管理、密码修改
- ✅ **Markdown 全支持** — 代码高亮、数学公式 (MathJax)、流程图、Mermaid 图表
- ✅ **幻灯片模式** — 支持 Reveal.js 演示
- ✅ **多种登录方式** — 邮箱、GitHub、Google、GitLab、LDAP、SAML 等
- ✅ **文件上传** — 支持 S3、Imgur、Minio 等多种存储后端
- ✅ **深色模式** — 支持夜间主题

## 管理控制台亮点

这是我加的最主要功能：

| 功能 | 说明 |
|------|------|
| **Dashboard** | 显示总用户数、总笔记数、总修订数、近期活动 |
| **用户管理** | 查看所有用户、创建用户、修改密码、查看用户详情 |
| **笔记管理** | 查看所有笔记及其编辑次数和时间 |
| **安全提醒** | 检测到使用默认密码时，在控制台顶部显示警告 |

## 技术栈

- **后端:** Node.js + Express + Passport.js + Socket.io
- **前端:** Bootstrap 3 + jQuery + CodeMirror
- **数据库:** SQLite / PostgreSQL / MySQL（Sequelize ORM）
- **认证:** 邮箱密码 + OAuth2 (GitHub/Google/GitLab 等)

## 快速开始

```bash
git clone https://github.com/WangJerry2013/MdShare.git
cd MdShare
yarn
yarn run build
node app.js
```

然后访问 `http://localhost:3000` 即可。

默认管理员账号：`root@hedgedoc.local` / `12345678`

## 项目地址

👉 https://github.com/WangJerry2013/MdShare

欢迎 Star、提 Issue、贡献代码！

---

第一次做开源项目，还有很多不完善的地方，请大家多多指教。
