# Assets 目录

这个目录包含应用的资源文件，主要是图标文件。

## 📱 当前需要的图标文件

将你的应用图标放置在这里，文件名必须完全匹配：

```
assets/
├── icon.icns    # macOS 图标 (Apple Icon Image 格式)
├── icon.ico     # Windows 图标 (Windows Icon 格式)
└── icon.png     # Linux 图标 (PNG 格式, 512x512 或 1024x1024)
```

## 🎯 快速开始

1. **创建原始图标**: 制作一个 1024x1024 像素的 PNG 图标
2. **转换格式**: 使用在线工具或命令行工具转换为各平台格式
3. **放置文件**: 将转换后的文件放到这个目录
4. **重新打包**: 运行 `npm run dist` 重新打包应用

## 🔗 推荐工具

- **在线转换**: https://iconverticons.com/online/
- **图标设计**: https://www.figma.com/ 或 https://www.canva.com/
- **免费图标**: https://www.flaticon.com/ 或 https://iconify.design/

---

参考完整指南: [../docs/icon-guide.md](../docs/icon-guide.md)
