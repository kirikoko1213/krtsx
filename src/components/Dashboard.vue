<template>
  <div class="dashboard">
    <!-- 顶部欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h2 class="welcome-title">
          <span class="greeting">{{ greeting }}</span>
          <span class="hostname">{{ systemInfo?.hostname || 'KRTsx' }}</span>
        </h2>
        <div class="current-time">
          <span class="time">{{ currentTime.time }}</span>
          <span class="date">{{ currentTime.date }}</span>
        </div>
      </div>
      <div class="quick-actions">
        <button class="action-btn" @click="refreshAll">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          刷新
        </button>
      </div>
    </div>

    <!-- 信息卡片网格 -->
    <div class="cards-grid">
      <!-- 天气卡片 -->
      <div class="info-card weather-card">
        <div class="card-header">
          <h3>
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            </svg>
            天气信息
          </h3>
          <div class="header-actions">
            <button
              class="refresh-btn"
              @click="loadWeatherData"
              :disabled="weatherLoading"
              title="刷新天气"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                :class="{ spinning: weatherLoading }"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
            </button>
            <span class="status-indicator" :class="{ active: weatherLoading }"></span>
          </div>
        </div>
        <div class="card-content">
          <div v-if="weatherData" class="weather-info">
            <div class="weather-main">
              <div class="temperature">{{ weatherData.temperature }}°C</div>
              <div class="weather-desc">{{ weatherData.description }}</div>
              <div class="weather-location">{{ weatherData.location }}</div>
            </div>
            <div class="weather-details">
              <div class="detail-item">
                <span class="label">湿度</span>
                <span class="value">{{ weatherData.humidity }}%</span>
              </div>
              <div class="detail-item">
                <span class="label">风力</span>
                <span class="value">{{ weatherData.windSpeed }}</span>
              </div>
            </div>
          </div>
          <div v-else-if="weatherLoading" class="placeholder-content">
            <div class="loading-spinner"></div>
            <p>正在获取天气信息...</p>
          </div>
          <div v-else-if="weatherError" class="error-content">
            <div class="error-icon">⚠️</div>
            <p class="error-message">{{ weatherError }}</p>
            <button class="btn btn-sm btn-primary" @click="loadWeatherData">重新获取</button>
          </div>
        </div>
      </div>

      <!-- 网络信息卡片 -->
      <div class="info-card network-card">
        <div class="card-header">
          <h3>
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M9.75 3.4l4.5 0a5.85 5.85 0 0 1 5.85 5.85l0 5.4a5.85 5.85 0 0 1-5.85 5.85l-4.5 0a5.85 5.85 0 0 1-5.85-5.85l0-5.4a5.85 5.85 0 0 1 5.85-5.85z"
              />
              <path d="M9 9l.01 0" />
              <path d="M15 15l.01 0" />
              <path d="M15 9l-6 6" />
            </svg>
            网络信息
          </h3>
          <span class="status-indicator" :class="{ active: networkLoading }"></span>
        </div>
        <div class="card-content">
          <div class="network-info">
            <div class="ip-item">
              <span class="ip-label">外网IP</span>
              <span class="ip-value" :class="{ loading: networkLoading }">
                {{ publicIP || '获取中...' }}
                <button v-if="publicIP" class="copy-btn" @click="copyToClipboard(publicIP)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                </button>
              </span>
            </div>
            <div class="ip-item">
              <span class="ip-label">本地IP</span>
              <div class="local-ips">
                <div v-for="ip in localIPs" :key="ip" class="ip-value">
                  {{ ip }}
                  <button class="copy-btn" @click="copyToClipboard(ip)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 系统信息卡片 -->
      <div class="info-card system-card">
        <div class="card-header">
          <h3>
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect width="20" height="14" x="2" y="3" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            系统信息
          </h3>
          <span class="status-indicator" :class="{ active: systemLoading }"></span>
        </div>
        <div class="card-content">
          <div v-if="systemInfo" class="system-info">
            <div class="system-item">
              <span class="label">操作系统</span>
              <span class="value">{{ getOSDisplayName() }}</span>
            </div>
            <div class="system-item">
              <span class="label">架构</span>
              <span class="value">{{ systemInfo.arch }}</span>
            </div>
            <div class="system-item">
              <span class="label">主机名</span>
              <span class="value">{{ systemInfo.hostname }}</span>
            </div>
            <div class="system-item">
              <span class="label">运行时间</span>
              <span class="value">{{ formatUptime(systemInfo.uptime) }}</span>
            </div>
          </div>
          <div v-else class="placeholder-content">
            <p>正在获取系统信息...</p>
          </div>
        </div>
      </div>

      <!-- 性能监控卡片 -->
      <div class="info-card performance-card">
        <div class="card-header">
          <h3>
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 3v18h18" />
              <path d="M18 17l-5-5-4 4-3-3" />
            </svg>
            性能监控
          </h3>
          <span class="status-indicator active"></span>
        </div>
        <div class="card-content">
          <div v-if="systemInfo" class="performance-info">
            <div class="metric-item">
              <div class="metric-header">
                <span class="metric-label">内存使用</span>
                <span class="metric-value">{{ getMemoryUsagePercent() }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: getMemoryUsagePercent() + '%' }"></div>
              </div>
              <div class="metric-details">
                {{ formatBytes(systemInfo.totalMemory - systemInfo.freeMemory) }} /
                {{ formatBytes(systemInfo.totalMemory) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-header">
                <span class="metric-label">CPU 核心</span>
                <span class="metric-value">{{ systemInfo.cpus.length }} 核</span>
              </div>
              <div class="cpu-info">
                {{ systemInfo.cpus[0]?.model.split(' ')[0] || 'Unknown' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 脚本状态卡片 -->
      <div class="info-card scripts-card">
        <div class="card-header">
          <h3>
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="4,17 10,11 4,5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            脚本状态
          </h3>
          <span class="status-indicator" :class="{ active: scriptsLoading }"></span>
        </div>
        <div class="card-content">
          <div class="scripts-info">
            <div class="script-metric">
              <div class="metric-number">{{ totalScripts }}</div>
              <div class="metric-label">总脚本数</div>
            </div>
            <div class="script-metric">
              <div class="metric-number running">{{ runningScriptsCount }}</div>
              <div class="metric-label">运行中</div>
            </div>
            <div class="script-metric">
              <div class="metric-number enabled">{{ enabledScriptsCount }}</div>
              <div class="metric-label">已启用</div>
            </div>
          </div>
          <div class="scripts-actions">
            <button class="btn btn-sm btn-primary" @click="$emit('navigate', 'scripts')">
              管理脚本
            </button>
          </div>
        </div>
      </div>

      <!-- 快速操作卡片 -->
      <div class="info-card actions-card">
        <div class="card-header">
          <h3>
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
            快速操作
          </h3>
          <span class="status-indicator" :class="{ active: portKilling }"></span>
        </div>
        <div class="card-content">
          <div class="action-buttons">
            <button class="action-button" @click="openTerminal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="4,17 10,11 4,5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              <span>终端</span>
            </button>
            <button class="action-button" @click="openSystemMonitor">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 3v18h18" />
                <path d="M18 17l-5-5-4 4-3-3" />
              </svg>
              <span>系统监控</span>
            </button>
            <button class="action-button" @click="openNetworkSettings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6" />
                <path d="m21 12-6 0m-6 0-6 0" />
              </svg>
              <span>网络设置</span>
            </button>
          </div>
          
          <!-- 端口管理区域 -->
          <div class="port-section">
            <div class="port-header">
              <svg class="port-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <circle cx="12" cy="12" r="1" />
              </svg>
              <span>杀死端口进程</span>
            </div>
            <div class="port-input-group">
              <input
                v-model="portInput"
                type="number"
                placeholder="端口号 (如: 3000)"
                class="port-input"
                :disabled="portKilling"
                @keyup.enter="handleKillPort"
                min="1"
                max="65535"
              />
              <button
                class="kill-port-btn"
                @click="handleKillPort"
                :disabled="portKilling || !portInput"
              >
                <svg v-if="!portKilling" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
                <div v-else class="loading-spinner"></div>
                {{ portKilling ? '执行中...' : '杀死' }}
              </button>
            </div>
            
            <div v-if="portResult" class="port-result" :class="{ success: portResult.success, error: !portResult.success, fading: portResultFading }">
              <div class="result-icon">
                <svg v-if="portResult.success" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <p class="result-message">{{ portResult.message || portResult.error }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 定义接口
interface WeatherData {
  temperature: number
  description: string
  humidity: number
  windSpeed: number
  location?: string
}

interface SystemInfo {
  platform: string
  arch: string
  hostname: string
  osType: string
  osVersion: string
  totalMemory: number
  freeMemory: number
  cpus: any[]
  uptime: number
  loadavg: number[]
  networkInterfaces: any
}

// 响应式数据
const currentTime = ref({ time: '', date: '' })
const systemInfo = ref<SystemInfo | null>(null)
const localIPs = ref<string[]>([])
const publicIP = ref<string>('')
const weatherData = ref<WeatherData | null>(null)
const totalScripts = ref(0)
const runningScriptsCount = ref(0)
const enabledScriptsCount = ref(0)

// 加载状态
const systemLoading = ref(false)
const networkLoading = ref(false)
const weatherLoading = ref(false)
const scriptsLoading = ref(false)
const weatherError = ref<string | null>(null)

// 端口管理相关
const portInput = ref<string>('')
const portKilling = ref(false)
const portResult = ref<{ success: boolean; message?: string; error?: string } | null>(null)
const portResultFading = ref(false)

// 定时器
let timeInterval: NodeJS.Timeout | null = null

// 定义事件
const emit = defineEmits<{
  navigate: [tab: string]
}>()

// 计算属性
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '深夜好'
  if (hour < 12) return '上午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

// 格式化函数
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) return `${days}天 ${hours}小时`
  if (hours > 0) return `${hours}小时 ${minutes}分钟`
  return `${minutes}分钟`
}

const getOSDisplayName = (): string => {
  if (!systemInfo.value) return 'Unknown'

  const { platform, osType } = systemInfo.value
  switch (platform) {
    case 'darwin':
      return `macOS ${osType}`
    case 'win32':
      return `Windows ${osType}`
    case 'linux':
      return `Linux ${osType}`
    default:
      return osType
  }
}

const getMemoryUsagePercent = (): number => {
  if (!systemInfo.value) return 0
  const used = systemInfo.value.totalMemory - systemInfo.value.freeMemory
  return Math.round((used / systemInfo.value.totalMemory) * 100)
}

// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = {
    time: now.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    date: now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }),
  }
}

// 加载系统信息
const loadSystemInfo = async () => {
  systemLoading.value = true
  try {
    const result = await window.electronAPI.getSystemInfo()
    if (result.success) {
      systemInfo.value = result.data
    }
  } catch (error) {
    console.error('获取系统信息失败:', error)
  } finally {
    systemLoading.value = false
  }
}

// 加载网络信息
const loadNetworkInfo = async () => {
  networkLoading.value = true
  try {
    // 获取本地IP
    const localResult = await window.electronAPI.getLocalIP()
    if (localResult.success) {
      localIPs.value = localResult.data
    }

    // 获取外网IP
    const publicResult = await window.electronAPI.getPublicIP()
    if (publicResult.success) {
      publicIP.value = publicResult.data
    }
  } catch (error) {
    console.error('获取网络信息失败:', error)
  } finally {
    networkLoading.value = false
  }
}

// 加载天气数据
const loadWeatherData = async () => {
  weatherLoading.value = true
  weatherError.value = null
  try {
    const result = await window.electronAPI.getWeather('北京')
    if (result.success) {
      const data = result.data
      weatherData.value = {
        temperature: parseInt(data.temperature) || 0,
        description: data.weather || '未知',
        humidity: parseInt(data.humidity) || 0,
        windSpeed: data.windPower || '未知',
        location: data.cityName || '北京',
      }
    } else {
      weatherError.value = result.error || '获取天气信息失败'
      console.error('获取天气失败:', result.error)
    }
  } catch (error) {
    weatherError.value = '网络连接失败，请检查网络设置'
    console.error('获取天气信息失败:', error)
  } finally {
    weatherLoading.value = false
  }
}

// 加载脚本统计
const loadScriptsStats = async () => {
  scriptsLoading.value = true
  try {
    const configs = await window.electronAPI.getScriptConfigs()
    totalScripts.value = configs.length
    enabledScriptsCount.value = configs.filter((script: any) => script.enabled).length

    const runningScripts = await window.electronAPI.getRunningScripts()
    runningScriptsCount.value = runningScripts.length
  } catch (error) {
    console.error('获取脚本统计失败:', error)
  } finally {
    scriptsLoading.value = false
  }
}

// 复制到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    // TODO: 显示成功提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 快速操作
const openTerminal = () => {
  // TODO: 实现打开终端功能
  console.log('打开终端')
}

const openSystemMonitor = () => {
  // TODO: 实现打开系统监控功能
  console.log('打开系统监控')
}

const openNetworkSettings = () => {
  // TODO: 实现打开网络设置功能
  console.log('打开网络设置')
}



// 清除端口结果（带淡出效果）
const clearPortResult = () => {
  if (portResult.value) {
    portResultFading.value = true
    setTimeout(() => {
      portResult.value = null
      portResultFading.value = false
    }, 300) // 等待淡出动画完成
  }
}

// 杀死端口进程
const handleKillPort = async () => {
  if (!portInput.value || portKilling.value) return
  
  const port = parseInt(portInput.value)
  if (isNaN(port) || port < 1 || port > 65535) {
    portResult.value = {
      success: false,
      error: '请输入有效的端口号 (1-65535)'
    }
    portResultFading.value = false
    // 3秒后清除错误消息
    setTimeout(clearPortResult, 3000)
    return
  }
  
  portKilling.value = true
  portResult.value = null
  portResultFading.value = false
  
  try {
    const result = await window.electronAPI.killPortProcess(port)
    portResult.value = result
    portResultFading.value = false
    
    if (result.success) {
      // 成功后清空输入
      portInput.value = ''
    }
    
    // 无论成功还是失败，3秒后都清除结果消息
    setTimeout(clearPortResult, 3000)
  } catch (error) {
    portResult.value = {
      success: false,
      error: `执行失败: ${(error as Error).message}`
    }
    portResultFading.value = false
    // 3秒后清除错误消息
    setTimeout(clearPortResult, 3000)
  } finally {
    portKilling.value = false
  }
}

// 刷新所有数据
const refreshAll = async () => {
  await Promise.all([loadSystemInfo(), loadNetworkInfo(), loadWeatherData(), loadScriptsStats()])
}

// 生命周期
onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)

  // 加载所有数据
  refreshAll()
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.dashboard {
  padding: 1rem;
  min-height: 100%;
  background: var(--color-background);
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: var(--color-surface-light);
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--color-shadow-light);
}

.welcome-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.welcome-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
}

.greeting {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hostname {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.current-time {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.time {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
}

.date {
  font-size: 1rem;
  color: var(--color-text-secondary);
}

.quick-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.action-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--color-shadow);
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

/* 大屏幕优化 - 显示更多卡片 */
@media (min-width: 1400px) {
  .cards-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 0.875rem;
  }
}

@media (min-width: 1600px) {
  .cards-grid {
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 0.75rem;
  }
}

.info-card {
  background: var(--color-surface-light);
  border-radius: 12px;
  box-shadow: 0 4px 16px var(--color-shadow-light);
  overflow: hidden;
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px var(--color-shadow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.card-header h3 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.card-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-border);
  transition: all 0.3s ease;
}

.status-indicator.active {
  background: var(--color-success);
  animation: pulse 2s infinite;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-surface);
  color: var(--color-primary);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-btn svg {
  width: 16px;
  height: 16px;
  transition: transform 0.3s ease;
}

.refresh-btn svg.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.card-content {
  padding: 1rem;
}

.placeholder-content {
  text-align: center;
  color: var(--color-text-muted);
  padding: 1rem 0;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border);
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 0.5rem;
}

.error-content {
  text-align: center;
  color: var(--color-text-muted);
  padding: 1rem 0;
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.error-message {
  color: var(--color-error);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

/* 天气卡片 */
.weather-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.weather-main {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.temperature {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-primary);
}

.weather-desc {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.weather-location {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.weather-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  padding: 0.15rem 0;
}

.detail-item .label {
  color: var(--color-text-muted);
}

.detail-item .value {
  color: var(--color-text-primary);
  font-weight: 500;
}

/* 网络卡片 */
.network-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ip-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.ip-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.ip-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.65rem;
  background: var(--color-surface);
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8rem;
  color: var(--color-text-primary);
}

.ip-value.loading {
  color: var(--color-text-muted);
  font-style: italic;
}

.local-ips {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.copy-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: var(--color-surface);
  color: var(--color-primary);
}

.copy-btn svg {
  width: 14px;
  height: 14px;
}

/* 系统信息卡片 */
.system-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.system-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.35rem 0;
  border-bottom: 1px solid var(--color-border-light);
}

.system-item:last-child {
  border-bottom: none;
}

.system-item .label {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.system-item .value {
  color: var(--color-text-primary);
  font-weight: 500;
  font-size: 0.8rem;
}

/* 性能监控卡片 */
.performance-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.metric-value {
  font-weight: 600;
  color: var(--color-primary);
}

.progress-bar {
  height: 6px;
  background: var(--color-border-light);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.metric-details {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.cpu-info {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  padding: 0.4rem 0.65rem;
  background: var(--color-surface);
  border-radius: 4px;
}

/* 脚本状态卡片 */
.scripts-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.script-metric {
  text-align: center;
}

.metric-number {
  font-size: 1.75rem;
  font-weight: bold;
  color: var(--color-text-primary);
}

.metric-number.running {
  color: var(--color-success);
}

.metric-number.enabled {
  color: var(--color-info);
}

.metric-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 0.2rem;
}

.scripts-actions {
  text-align: center;
}

/* 快速操作卡片 */
.action-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-text-primary);
}

.action-button:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
}

.action-button svg {
  width: 20px;
  height: 20px;
}

.action-button span {
  font-size: 0.8rem;
  font-weight: 500;
}

/* 端口管理区域 */
.port-section {
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}

.port-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.port-icon {
  width: 18px;
  height: 18px;
}

.port-input-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .cards-grid {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .cards-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .welcome-section {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .current-time {
    flex-direction: column;
    gap: 0.25rem;
  }
}

.port-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.port-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.port-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.kill-port-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.kill-port-btn:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-1px);
}

.kill-port-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.kill-port-btn svg {
  width: 14px;
  height: 14px;
}

.port-result {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  animation: fadeIn 0.3s ease;
  font-size: 0.8rem;
}

.port-result.fading {
  animation: fadeOut 0.3s ease;
}

.port-result.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.port-result.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.result-icon svg {
  width: 16px;
  height: 16px;
}

.result-message {
  margin: 0;
  font-weight: 500;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}
</style>
