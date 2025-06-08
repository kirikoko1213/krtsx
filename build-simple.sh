#!/bin/bash

# 简化版打包脚本
# 适用于快速打包和测试

echo "🚀 开始简化打包流程..."

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    if command -v yarn &> /dev/null; then
        yarn install
    else
        npm install
    fi
fi

# 构建项目
echo "🔨 构建项目..."
if command -v yarn &> /dev/null; then
    yarn build
else
    npm run build
fi

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

# 检测系统类型并打包相应版本
echo "🎯 检测系统并开始打包..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 检测到 macOS，打包 ARM 版本..."
    if command -v yarn &> /dev/null; then
        yarn electron-builder --mac --arm64
    else
        npx electron-builder --mac --arm64
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ macOS ARM 版本打包完成"
        
        # 自动安装到 Applications
        APP_FILE=$(find release -name "*.app" -type d | head -n 1)
        if [ -n "$APP_FILE" ]; then
            APP_NAME=$(basename "$APP_FILE")
            echo "📲 安装到 Applications 目录..."
            
            if [ -d "/Applications/$APP_NAME" ]; then
                rm -rf "/Applications/$APP_NAME"
            fi
            
            cp -R "$APP_FILE" "/Applications/"
            echo "✅ 已安装到 /Applications/$APP_NAME"
        fi
    else
        echo "❌ macOS 打包失败"
    fi
else
    echo "🪟 非 macOS 系统，尝试打包 Windows 版本..."
    if command -v yarn &> /dev/null; then
        yarn electron-builder --win --x64
    else
        npx electron-builder --win --x64
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Windows x64 版本打包完成"
    else
        echo "❌ Windows 打包失败"
    fi
fi

# 显示结果
if [ -d "release" ]; then
    echo ""
    echo "📦 打包结果："
    ls -la release/
    echo ""
    echo "📍 输出目录: $(pwd)/release"
fi

echo "🎉 打包完成！" 