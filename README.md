# 脚本管理器 (Script Manager)

一个基于 Electron + Vue 3 + TypeScript 的脚本管理和执行工具。

## 功能特色

### 功能一：脚本管理与执行
- ✅ 支持添加脚本文件（.cmd、.bat、.sh、.py、.js、.ps1等）
- ✅ 支持添加自定义执行命令
- ✅ 实时查看脚本执行输出
- ✅ 支持定时执行脚本（Cron 表达式）
- ✅ 脚本启用/禁用管理
- ✅ 脚本搜索和筛选

### 即将推出
- 🚧 功能二：（开发中）
- 🚧 功能三：（开发中）

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **桌面**: Electron
- **定时任务**: node-cron
- **进程管理**: Node.js child_process

## 安装和使用

### 开发环境

1. 安装依赖：
```bash
npm install
```

2. 启动开发模式：
```bash
# 方式一：使用脚本（推荐）
chmod +x dev.sh
./dev.sh

# 方式二：手动启动
npm run build:main && npm run dev
```

### 生产构建

```bash
# 构建应用
npm run build

# 打包成可执行文件
npm run dist

# 代码格式化
npm run format

# 检查代码格式
npm run format:check
```

## 使用说明

### 添加脚本

1. 点击"添加脚本"按钮
2. 填写脚本名称
3. 选择类型：
   - **文件路径**: 选择本地脚本文件
   - **执行命令**: 直接输入命令（如：`python script.py --arg1`）
4. 可选：设置定时执行（Cron表达式）
5. 点击"添加"保存

### 执行脚本

1. 在脚本列表中选择要执行的脚本
2. 点击"执行"按钮
3. 在右侧输出面板查看实时输出
4. 支持查看标准输出(stdout)和错误输出(stderr)

### 定时任务

支持使用 Cron 表达式设置定时执行：

- `0 */5 * * * *` - 每5分钟执行
- `0 0 */1 * * *` - 每小时执行  
- `0 0 9 * * *` - 每天9点执行
- `0 0 9 * * 1-5` - 工作日9点执行

### 脚本管理

- **编辑**: 点击脚本卡片的"编辑"按钮
- **删除**: 点击"删除"按钮（需确认）
- **搜索**: 使用顶部搜索框按名称或路径筛选
- **启用/禁用**: 在编辑时可以启用或禁用脚本

## 支持的脚本类型

- **Windows**: .bat, .cmd, .ps1
- **Unix/Linux/macOS**: .sh
- **Python**: .py
- **Node.js**: .js
- **自定义命令**: 任意可执行的命令行程序

## 目录结构

```
├── electron/           # Electron 主进程代码
│   ├── main.ts        # 主进程入口
│   └── preload.ts     # 预加载脚本
├── src/               # Vue 前端代码
│   ├── components/    # Vue 组件
│   ├── App.vue       # 主应用组件
│   ├── main.ts       # 前端入口
│   └── vite-env.d.ts # 类型声明
├── dist/             # 构建输出目录
├── package.json      # 项目配置
└── README.md         # 说明文档
```

## 开发说明

### 项目架构

- **主进程** (electron/main.ts): 处理窗口管理、脚本执行、文件操作
- **渲染进程** (src/): Vue 3 应用，负责用户界面
- **预加载脚本** (electron/preload.ts): 安全地暴露 API 给渲染进程

### 主要功能模块

1. **脚本配置管理**: 持久化存储脚本配置
2. **脚本执行引擎**: 支持多种脚本类型的执行
3. **定时任务调度**: 基于 Cron 表达式的定时执行
4. **实时输出显示**: 流式显示脚本执行结果

### 代码规范

项目使用 Prettier 进行代码格式化：

- **自动格式化**: VS Code 保存时自动格式化
- **手动格式化**: `npm run format`
- **格式检查**: `npm run format:check`
- **配置文件**: `.prettierrc` 和 `.prettierignore`

## 许可证

MIT License
