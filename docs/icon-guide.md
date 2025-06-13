# 应用图标制作指南

## 📱 图标要求

### 尺寸规格

- **原始图标**: 1024x1024 像素 (PNG 格式，透明背景)
- **macOS**: .icns 格式 (包含多种尺寸: 16x16, 32x32, 128x128, 256x256, 512x512, 1024x1024)
- **Windows**: .ico 格式 (包含多种尺寸: 16x16, 32x32, 48x48, 256x256)
- **Linux**: .png 格式 (512x512 或 1024x1024)

### 设计建议

- 使用简洁的设计，避免过多细节
- 确保在小尺寸下仍然清晰可见
- 使用透明背景
- 避免使用纯文字作为图标

## 🛠️ 制作方法

### 方法一：在线工具转换 (推荐)

**步骤 1: 准备原始图标**

1. 使用设计软件 (Figma, Sketch, Photoshop 等) 创建 1024x1024 的图标
2. 导出为 PNG 格式，确保背景透明
3. 将文件命名为 `icon-source.png`

**步骤 2: 转换为各平台格式**

使用在线转换工具：

- **iConvert Icons**: https://iconverticons.com/online/
- **CloudConvert**: https://cloudconvert.com/
- **Favicon Generator**: https://www.favicon-generator.org/

**步骤 3: 生成文件**

- 上传 `icon-source.png`
- 下载生成的 `icon.icns` (macOS)
- 下载生成的 `icon.ico` (Windows)
- 重命名原始 PNG 为 `icon.png` (Linux)

### 方法二：使用命令行工具

**安装 ImageMagick** (macOS):

```bash
brew install imagemagick
```

**生成 Windows ICO**:

```bash
magick icon-source.png -resize 256x256 icon.ico
```

**生成 macOS ICNS** (需要额外工具):

```bash
# 安装 png2icns
npm install -g png2icns

# 转换
png2icns icon-source.png icon.icns
```

### 方法三：使用 Electron 工具

**安装 electron-icon-builder**:

```bash
npm install -g electron-icon-builder
```

**生成所有格式**:

```bash
electron-icon-builder --input=./icon-source.png --output=./assets
```

## 📂 文件放置

将生成的图标文件放置到项目的 `assets` 目录：

```
assets/
├── icon.icns    # macOS 图标
├── icon.ico     # Windows 图标
└── icon.png     # Linux 图标
```

## ✅ 验证图标

**检查文件**:

```bash
ls -la assets/
```

**打包测试**:

```bash
# 仅构建不打包
npm run build

# 打包 macOS 版本
npm run dist:mac

# 打包 Windows 版本
npm run dist:win

# 打包所有平台
npm run dist:all
```

## 🎨 图标设计建议

### 好的图标特征

- ✅ 在 16x16 像素时仍然可识别
- ✅ 使用有限的颜色调色板
- ✅ 具有独特且memorable的形状
- ✅ 与应用功能相关

### 避免的设计

- ❌ 过于复杂的细节
- ❌ 使用渐变效果 (在小尺寸下不清楚)
- ❌ 纯文字图标
- ❌ 过于相似的现有应用图标

## 🔧 故障排除

**图标不显示**:

1. 检查文件路径是否正确
2. 确认文件格式是否正确
3. 重新构建应用
4. 清除缓存后重新打包

**图标模糊**:

1. 确保原始图标是高分辨率
2. 检查图标是否为矢量格式
3. 为不同尺寸提供专门优化的版本

**平台特定问题**:

- **macOS**: 确保 .icns 文件包含所有必需的尺寸
- **Windows**: 确保 .ico 文件格式正确
- **Linux**: 使用 PNG 格式，推荐 512x512 像素

---

_完成图标设置后，重新打包应用即可看到新图标！_
