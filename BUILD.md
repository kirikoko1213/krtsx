# 构建和打包指南

## 📦 打包脚本使用说明

### 快速开始

执行完整的跨平台打包：

```bash
./build.sh
```

或者使用 npm 脚本：

```bash
npm run dist:all
```

### 单独平台打包

**仅打包 macOS ARM 版本：**
```bash
npm run dist:mac
```

**仅打包 Windows x64 版本：**
```bash
npm run dist:win
```

### 脚本功能

`build.sh` 脚本包含以下功能：

1. **环境检查** - 确保 Node.js 和 npm 已安装
2. **清理构建** - 删除旧的构建文件
3. **安装依赖** - 自动安装项目依赖
4. **项目构建** - 编译 TypeScript 和打包前端代码
5. **跨平台打包** - 同时构建 macOS ARM 和 Windows x64 版本
6. **自动安装** - 在 macOS 上自动安装到 Applications 目录
7. **结果展示** - 显示构建结果和文件大小

### 输出文件

打包完成后，文件将生成在 `release/` 目录下：

- **macOS**: `krtsx-1.0.0-arm64.dmg` 和 `krtsx-1.0.0-arm64-mac.zip`
- **Windows**: `krtsx Setup 1.0.0.exe` 和 `krtsx-1.0.0-win.zip`

### 系统要求

- Node.js 16+ 
- npm 或 yarn
- macOS (推荐，用于打包 macOS 版本)

### 注意事项

1. **跨平台打包限制**：
   - 在 macOS 上可以打包所有平台
   - 在 Windows 上只能打包 Windows 版本
   - 在 Linux 上只能打包 Linux 版本

2. **macOS 签名**：
   - 当前配置未包含代码签名
   - 如需发布到 App Store，需要配置开发者证书

3. **Windows 安装包**：
   - NSIS 安装包支持自定义安装目录
   - 会创建桌面快捷方式和开始菜单项

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 或者使用 yarn
yarn dev
```

### 故障排除

**如果遇到权限问题：**
```bash
chmod +x build.sh
```

**如果 electron-builder 安装失败：**
```bash
npm install electron-builder --save-dev
```

**清理所有构建文件：**
```bash
rm -rf dist/ release/ node_modules/.cache/
```

### 自定义配置

打包配置位于 `package.json` 的 `build` 字段中，可以根据需要修改：

- 应用图标路径
- 目标架构
- 安装包类型
- 输出目录

### 性能优化

- 首次打包可能较慢（需要下载 Electron 二进制文件）
- 后续打包会使用缓存，速度更快
- 建议在网络良好的环境下进行首次打包

---

## 🚀 快速打包命令

```bash
# 完整打包（推荐）
./build.sh

# 仅开发模式
npm run dev

# 仅构建不打包
npm run build
``` 