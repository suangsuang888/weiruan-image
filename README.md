# 图床工具 (Image Hosting Tool)

一款基于 GitHub + jsDelivr CDN 的免费图床工具，支持拖拽上传、粘贴上传，自动生成 Markdown 链接。

## 特性

- **多种上传方式**: 拖拽上传、点击上传、Ctrl+V 粘贴上传
- **多种链接格式**: Markdown、HTML、直链、jsDelivr CDN
- **全球 CDN 加速**: 使用 jsDelivr CDN 全球加速
- **历史记录**: 本地保存上传历史，方便查找
- **响应式设计**: 支持桌面端和移动端
- **暗色模式**: 自动适配系统主题
- **完全免费**: 基于 GitHub 仓库存储，无需服务器

## 快速开始

### 1. Fork 仓库

点击右上角 Fork 按钮，将此仓库 Fork 到你的账号下。

### 2. 开启 GitHub Pages

1. 进入你 Fork 的仓库
2. 点击 `Settings` -> `Pages`
3. Source 选择 `Deploy from a branch`
4. Branch 选择 `main` 分支，目录选择 `/ (root)`
5. 点击 Save

### 3. 获取 GitHub Token

1. 访问 [GitHub Token 设置页面](https://github.com/settings/tokens/new)
2. Note 填写 `image-hosting`
3. Expiration 选择 `No expiration`（或按需设置）
4. 勾选 `repo` 权限
5. 点击 `Generate token`
6. 复制生成的 Token（以 `ghp_` 开头）

### 4. 配置并使用

1. 访问你的图床页面: `https://你的用户名.github.io/weiruan-image`
2. 点击配置面板，填写:
   - GitHub Token: 刚才生成的 Token
   - 仓库所有者: 你的 GitHub 用户名
   - 仓库名称: `weiruan-image`（默认）
   - 分支: `main`（默认）
   - 存储路径: `images`（默认）
3. 点击保存配置
4. 开始上传图片!

## 使用方法

### 拖拽上传
直接将图片拖拽到上传区域即可。

### 粘贴上传
复制图片后，在页面上按 `Ctrl+V`（Mac 为 `Cmd+V`）即可上传。

### 点击上传
点击上传区域，选择要上传的图片文件。

## 链接格式说明

| 类型 | 格式 | 特点 |
|------|------|------|
| Markdown | `![name](url)` | 适用于 Markdown 文档 |
| HTML | `<img src="url">` | 适用于网页 |
| 直链 | `raw.githubusercontent.com/...` | GitHub 原始链接 |
| CDN | `cdn.jsdelivr.net/gh/...` | jsDelivr 全球 CDN 加速 |

## 技术架构

```
├── index.html      # 主页面
├── css/
│   └── style.css   # 样式文件
├── js/
│   └── app.js      # 核心逻辑
├── images/         # 图片存储目录
└── README.md       # 说明文档
```

## 注意事项

- Token 仅保存在浏览器本地，不会上传到任何服务器
- 请妥善保管你的 GitHub Token
- 单个文件大小建议不超过 25MB
- 建议使用 WebP 格式以获得更好的压缩率

## 许可证

MIT License
