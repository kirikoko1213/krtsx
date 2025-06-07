import { ref, computed, watch } from 'vue'

export interface ThemeConfig {
  id: string
  name: string
  colors: {
    // 主要颜色
    primary: string
    primaryLight: string
    primaryDark: string
    secondary: string
    
    // 背景颜色
    background: string
    surface: string
    surfaceLight: string
    
    // 文字颜色
    textPrimary: string
    textSecondary: string
    textMuted: string
    
    // 边框颜色
    border: string
    borderLight: string
    
    // 状态颜色
    success: string
    warning: string
    error: string
    info: string
    
    // 按钮颜色
    buttonPrimary: string
    buttonSecondary: string
    buttonSuccess: string
    buttonWarning: string
    buttonDanger: string
    
    // 特殊效果
    shadow: string
    shadowLight: string
    
    // 运行状态
    running: string
    runningBg: string
  }
}

// 预定义主题
export const themes: ThemeConfig[] = [
  {
    id: 'default',
    name: '默认主题',
    colors: {
      primary: '#2196f3',
      primaryLight: '#e3f2fd',
      primaryDark: '#1976d2',
      secondary: '#ff9800',
      
      background: '#ffffff',
      surface: '#f8f9fa',
      surfaceLight: '#ffffff',
      
      textPrimary: '#333333',
      textSecondary: '#666666',
      textMuted: '#999999',
      
      border: '#e0e0e0',
      borderLight: '#f0f0f0',
      
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3',
      
      buttonPrimary: '#2196f3',
      buttonSecondary: '#6c757d',
      buttonSuccess: '#28a745',
      buttonWarning: '#ffc107',
      buttonDanger: '#dc3545',
      
      shadow: 'rgba(0,0,0,0.1)',
      shadowLight: 'rgba(0,0,0,0.05)',
      
      running: '#4caf50',
      runningBg: 'rgba(76, 175, 80, 0.1)'
    }
  },
  {
    id: 'sakura',
    name: '少女色主题',
    colors: {
      primary: '#e91e63',
      primaryLight: '#fce4ec',
      primaryDark: '#c2185b',
      secondary: '#ff4081',
      
      background: '#fdf2f8',
      surface: '#fce7f3',
      surfaceLight: '#fdf2f8',
      
      textPrimary: '#4a154b',
      textSecondary: '#7c2d92',
      textMuted: '#a855f7',
      
      border: '#f3e8ff',
      borderLight: '#faf5ff',
      
      success: '#ec4899',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#8b5cf6',
      
      buttonPrimary: '#e91e63',
      buttonSecondary: '#a855f7',
      buttonSuccess: '#ec4899',
      buttonWarning: '#f59e0b',
      buttonDanger: '#ef4444',
      
      shadow: 'rgba(233, 30, 99, 0.15)',
      shadowLight: 'rgba(233, 30, 99, 0.08)',
      
      running: '#ec4899',
      runningBg: 'rgba(236, 72, 153, 0.1)'
    }
  },
  {
    id: 'aqua',
    name: '清新水色主题',
    colors: {
      primary: '#00bcd4',
      primaryLight: '#e0f2f1',
      primaryDark: '#0097a7',
      secondary: '#26a69a',
      
      background: '#f0fdfa',
      surface: '#ccfbf1',
      surfaceLight: '#f0fdfa',
      
      textPrimary: '#134e4a',
      textSecondary: '#0f766e',
      textMuted: '#14b8a6',
      
      border: '#a7f3d0',
      borderLight: '#d1fae5',
      
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
      
      buttonPrimary: '#00bcd4',
      buttonSecondary: '#14b8a6',
      buttonSuccess: '#10b981',
      buttonWarning: '#f59e0b',
      buttonDanger: '#ef4444',
      
      shadow: 'rgba(0, 188, 212, 0.15)',
      shadowLight: 'rgba(0, 188, 212, 0.08)',
      
      running: '#10b981',
      runningBg: 'rgba(16, 185, 129, 0.1)'
    }
  },
  {
    id: 'dark',
    name: '深色主题',
    colors: {
      primary: '#90caf9',
      primaryLight: '#1e293b',
      primaryDark: '#64b5f6',
      secondary: '#ffcc02',
      
      background: '#0f172a',
      surface: '#1e293b',
      surfaceLight: '#334155',
      
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      
      border: '#334155',
      borderLight: '#475569',
      
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
      
      buttonPrimary: '#3b82f6',
      buttonSecondary: '#6b7280',
      buttonSuccess: '#10b981',
      buttonWarning: '#f59e0b',
      buttonDanger: '#ef4444',
      
      shadow: 'rgba(0,0,0,0.5)',
      shadowLight: 'rgba(0,0,0,0.3)',
      
      running: '#4ade80',
      runningBg: 'rgba(74, 222, 128, 0.1)'
    }
  },
  {
    id: 'macaron',
    name: '马卡龙主题',
    colors: {
      primary: '#ff9a9e',
      primaryLight: '#fff5f5',
      primaryDark: '#ff6b6b',
      secondary: '#a8e6cf',
      
      background: '#fefefe',
      surface: '#fdf9f9',
      surfaceLight: '#fffafa',
      
      textPrimary: '#5d4e75',
      textSecondary: '#8b7ca3',
      textMuted: '#b4a7c1',
      
      border: '#f2e9e4',
      borderLight: '#f9f4f0',
      
      success: '#a8e6cf',
      warning: '#ffd93d',
      error: '#ff9a9e',
      info: '#aec6cf',
      
      buttonPrimary: '#ff9a9e',
      buttonSecondary: '#d4b3d9',
      buttonSuccess: '#a8e6cf',
      buttonWarning: '#ffd93d',
      buttonDanger: '#ff9a9e',
      
      shadow: 'rgba(255, 154, 158, 0.12)',
      shadowLight: 'rgba(255, 154, 158, 0.06)',
      
      running: '#a8e6cf',
      runningBg: 'rgba(168, 230, 207, 0.12)'
    }
  }
]

// 当前主题状态
const currentThemeId = ref<string>('default')

// 从本地存储加载主题
const loadThemeFromStorage = () => {
  const stored = localStorage.getItem('app-theme')
  if (stored && themes.find(t => t.id === stored)) {
    currentThemeId.value = stored
  }
}

// 保存主题到本地存储
const saveThemeToStorage = (themeId: string) => {
  localStorage.setItem('app-theme', themeId)
}

// 当前主题配置
const currentTheme = computed(() => {
  return themes.find(t => t.id === currentThemeId.value) || themes[0]
})

// 应用CSS变量到root元素
const applyThemeToCSS = (theme: ThemeConfig) => {
  const root = document.documentElement
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value)
  })
}

// 主题管理composable
export const useTheme = () => {
  // 初始化时加载主题
  if (typeof window !== 'undefined') {
    loadThemeFromStorage()
    applyThemeToCSS(currentTheme.value)
  }

  // 监听主题变化
  watch(currentTheme, (newTheme) => {
    applyThemeToCSS(newTheme)
  }, { immediate: true })

  // 切换主题
  const setTheme = (themeId: string) => {
    if (themes.find(t => t.id === themeId)) {
      currentThemeId.value = themeId
      saveThemeToStorage(themeId)
    }
  }

  return {
    themes,
    currentTheme,
    currentThemeId,
    setTheme
  }
} 