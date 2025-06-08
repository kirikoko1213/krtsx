#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示带颜色的日志
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# 检查 Node.js 和 npm
check_requirements() {
    info "检查环境要求..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm 未安装，请先安装 npm"
        exit 1
    fi
    
    log "环境检查通过"
}

# 清理旧的构建文件
clean_build() {
    info "清理旧的构建文件..."
    rm -rf dist/
    rm -rf release/
    log "清理完成"
}

# 安装依赖
install_deps() {
    info "安装依赖..."
    if command -v yarn &> /dev/null; then
        yarn install
    else
        npm install
    fi
    log "依赖安装完成"
}

# 构建项目
build_project() {
    info "构建项目..."
    if command -v yarn &> /dev/null; then
        yarn build
    else
        npm run build
    fi
    
    if [ $? -ne 0 ]; then
        error "项目构建失败"
        exit 1
    fi
    
    log "项目构建完成"
}

# 打包 macOS ARM 版本
build_macos() {
    info "开始打包 macOS ARM 版本..."
    
    if command -v yarn &> /dev/null; then
        yarn electron-builder --mac --arm64
    else
        npx electron-builder --mac --arm64
    fi
    
    if [ $? -eq 0 ]; then
        log "macOS ARM 版本打包完成"
        return 0
    else
        error "macOS ARM 版本打包失败"
        return 1
    fi
}

# 打包 Windows AMD64 版本
build_windows() {
    info "开始打包 Windows AMD64 版本..."
    
    if command -v yarn &> /dev/null; then
        yarn electron-builder --win --x64
    else
        npx electron-builder --win --x64
    fi
    
    if [ $? -eq 0 ]; then
        log "Windows AMD64 版本打包完成"
        return 0
    else
        error "Windows AMD64 版本打包失败"
        return 1
    fi
}

# 在 macOS 上安装应用到 Applications 目录
install_macos_app() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        info "检测到 macOS 系统，准备安装应用到 Applications 目录..."
        
        # 查找构建的 .app 文件
        APP_FILE=$(find release -name "*.app" -type d | head -n 1)
        
        if [ -z "$APP_FILE" ]; then
            warn "未找到 .app 文件，跳过安装"
            return 1
        fi
        
        APP_NAME=$(basename "$APP_FILE")
        TARGET_PATH="/Applications/$APP_NAME"
        
        # 如果应用已存在，先删除
        if [ -d "$TARGET_PATH" ]; then
            warn "发现已存在的应用，正在替换..."
            rm -rf "$TARGET_PATH"
        fi
        
        # 复制应用到 Applications 目录
        cp -R "$APP_FILE" "/Applications/"
        
        if [ $? -eq 0 ]; then
            log "应用已成功安装到 /Applications/$APP_NAME"
            
            # 询问是否启动应用
            read -p "是否立即启动应用？ (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                open "/Applications/$APP_NAME"
                log "应用已启动"
            fi
        else
            error "应用安装失败"
            return 1
        fi
    else
        info "非 macOS 系统，跳过自动安装"
    fi
}

# 显示构建结果
show_results() {
    info "构建结果："
    echo
    
    if [ -d "release" ]; then
        echo "📦 打包文件位置: $(pwd)/release"
        echo
        echo "🔍 构建的文件:"
        ls -la release/ | grep -E '\.(app|exe|dmg|zip|msi)$' || ls -la release/
        echo
        
        # 计算文件大小
        TOTAL_SIZE=$(du -sh release/ | cut -f1)
        echo "📊 总大小: $TOTAL_SIZE"
    else
        warn "未找到构建结果目录"
    fi
}

# 主函数
main() {
    echo "🚀 开始打包 Electron 应用"
    echo "==============================="
    
    # 检查环境
    check_requirements
    
    # 清理旧文件
    clean_build
    
    # 安装依赖
    install_deps
    
    # 构建项目
    build_project
    
    # 记录打包开始时间
    START_TIME=$(date +%s)
    
    # 打包标志
    MACOS_SUCCESS=false
    WINDOWS_SUCCESS=false
    
    # 打包 macOS 版本
    if build_macos; then
        MACOS_SUCCESS=true
    fi
    
    # 打包 Windows 版本
    if build_windows; then
        WINDOWS_SUCCESS=true
    fi
    
    # 计算耗时
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo
    echo "==============================="
    log "打包完成！耗时: ${DURATION} 秒"
    
    # 显示结果
    if [ "$MACOS_SUCCESS" = true ]; then
        log "✅ macOS ARM 版本打包成功"
    else
        error "❌ macOS ARM 版本打包失败"
    fi
    
    if [ "$WINDOWS_SUCCESS" = true ]; then
        log "✅ Windows AMD64 版本打包成功"
    else
        error "❌ Windows AMD64 版本打包失败"
    fi
    
    # 显示构建结果
    show_results
    
    # 如果是 macOS 且打包成功，尝试安装
    if [ "$MACOS_SUCCESS" = true ]; then
        install_macos_app
    fi
    
    echo
    log "🎉 所有操作完成！"
}

# 执行主函数
main "$@" 