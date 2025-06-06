#!/bin/bash

# 确保目录存在
mkdir -p dist

# 编译主进程
echo "编译主进程..."
npx tsc -p tsconfig.main.json

# 启动开发服务器和 Electron
echo "启动应用..."
npm run dev 