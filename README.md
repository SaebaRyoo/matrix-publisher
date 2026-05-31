# Matrix Publisher

多平台内容自动发布工具，基于 Electron + Vue 3 + Puppeteer。

## 环境要求

- Node.js >= 18
- Yarn 4.x
- macOS / Windows

## 安装

```bash
yarn install
```

安装后自动重新编译原生模块（`better-sqlite3`）。

## 开发

```bash
yarn dev        # 启动开发模式（热重载）
yarn test       # 运行测试
yarn lint       # ESLint 检查
yarn format     # Prettier 格式化
```

## 打包 Release

### 本地打包

```bash
yarn build      # 类型检查 + 编译
yarn make       # 生成安装包（输出到 dist/make/）
```

- macOS：生成 `.dmg`（支持 x64 / arm64）
- Windows：生成 `.exe`（NSIS 安装程序，x64）

### 发布到 GitHub Releases

推送 tag 即可触发 CI 三平台并行构建，产物自动上传为 GitHub Draft Release：

```bash
git tag v1.0.0
git push origin v1.0.0
```

构建完成后前往 GitHub Releases 页面确认内容，手动发布。

## 架构说明

- `src/main/` — Electron 主进程（IPC、数据库、任务队列、Puppeteer 相关）
- `src/renderer/` — Vue 3 渲染层
- `src/preload/` — Preload 脚本，暴露 `window.api`
- `src/shared/` — 主进程与渲染层共享的类型和常量

## 注意事项

- 任务队列并发固定为 1，避免多账号同时操作触发风控
- 小红书需在 `creator.xiaohongshu.com` 域登录，主域 cookie 不可用
- 发布任务必须包含图片路径，否则直接失败
