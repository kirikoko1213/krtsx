<template>
  <div class="pomodoro-timer">
    <!-- 主计时器区域 -->
    <div class="timer-main">
      <div class="timer-circle">
        <svg class="progress-ring" width="300" height="300">
          <circle
            class="progress-ring-background"
            cx="150"
            cy="150"
            r="140"
            fill="transparent"
            stroke="var(--color-border-light)"
            stroke-width="8"
          />
          <circle
            class="progress-ring-progress"
            cx="150"
            cy="150"
            r="140"
            fill="transparent"
            :stroke="currentMode === 'work' ? 'var(--color-primary)' : 'var(--color-success)'"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
            transform="rotate(-90 150 150)"
          />
        </svg>
        
        <div class="timer-content">
          <div class="timer-mode">
            {{ currentMode === 'work' ? '工作时间' : '休息时间' }}
          </div>
          <div class="timer-display">
            {{ formatTime(timeLeft) }}
          </div>
          <div class="timer-session">
            第 {{ currentSession }} 个番茄钟
          </div>
        </div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="timer-controls">
      <button
        class="control-btn start-btn"
        @click="toggleTimer"
        :disabled="timeLeft === 0"
      >
        <svg v-if="!isRunning" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polygon points="5,3 19,12 5,21" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
        {{ isRunning ? '暂停' : '开始' }}
      </button>
      
      <button class="control-btn reset-btn" @click="resetTimer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
        重置
      </button>
      
      <button class="control-btn skip-btn" @click="skipSession">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polygon points="5,4 15,12 5,20" />
          <line x1="19" y1="5" x2="19" y2="19" />
        </svg>
        跳过
      </button>
    </div>

    <!-- 设置面板 -->
    <div class="settings-panel">
      <h3>番茄钟设置</h3>
      <div class="settings-grid">
        <div class="setting-item">
          <label>工作时间 (分钟)</label>
          <input
            v-model.number="settings.workDuration"
            type="number"
            min="1"
            max="60"
            :disabled="isRunning"
          />
        </div>
        <div class="setting-item">
          <label>短休息 (分钟)</label>
          <input
            v-model.number="settings.shortBreakDuration"
            type="number"
            min="1"
            max="30"
            :disabled="isRunning"
          />
        </div>
        <div class="setting-item">
          <label>长休息 (分钟)</label>
          <input
            v-model.number="settings.longBreakDuration"
            type="number"
            min="1"
            max="60"
            :disabled="isRunning"
          />
        </div>
        <div class="setting-item">
          <label>长休息间隔</label>
          <input
            v-model.number="settings.longBreakInterval"
            type="number"
            min="2"
            max="10"
            :disabled="isRunning"
          />
        </div>
      </div>
      
      <div class="setting-toggles">
        <label class="toggle-item">
          <input
            v-model="settings.autoStartBreaks"
            type="checkbox"
          />
          <span>自动开始休息</span>
        </label>
        <label class="toggle-item">
          <input
            v-model="settings.autoStartWork"
            type="checkbox"
          />
          <span>自动开始工作</span>
        </label>
        <label class="toggle-item">
          <input
            v-model="settings.soundEnabled"
            type="checkbox"
          />
          <span>声音提醒</span>
        </label>
        <label class="toggle-item">
          <input
            v-model="settings.notificationEnabled"
            type="checkbox"
          />
          <span>桌面通知</span>
        </label>
      </div>
      
      <div class="settings-actions">
        <button class="btn btn-primary" @click="saveSettings">保存设置</button>
        <button class="btn btn-secondary" @click="resetSettings">恢复默认</button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-panel">
      <h3>今日统计</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-number">{{ todayStats.completedSessions }}</div>
          <div class="stat-label">完成番茄钟</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ formatDuration(todayStats.totalWorkTime) }}</div>
          <div class="stat-label">工作时间</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ formatDuration(todayStats.totalBreakTime) }}</div>
          <div class="stat-label">休息时间</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ todayStats.totalSessions }}</div>
          <div class="stat-label">总会话数</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// 番茄钟状态
const isRunning = ref(false)
const currentMode = ref<'work' | 'break'>('work')
const timeLeft = ref(25 * 60) // 默认25分钟，以秒为单位
const currentSession = ref(1)
const completedSessions = ref(0)

// 设置
const settings = ref({
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true,
  notificationEnabled: true
})

// 统计数据
const todayStats = ref({
  completedSessions: 0,
  totalWorkTime: 0,
  totalBreakTime: 0,
  totalSessions: 0
})

// 计时器
let timer: NodeJS.Timeout | null = null

// 进度环计算
const circumference = 2 * Math.PI * 140
const strokeDashoffset = computed(() => {
  const totalTime = currentMode.value === 'work' 
    ? settings.value.workDuration * 60 
    : (currentSession.value % settings.value.longBreakInterval === 0 
        ? settings.value.longBreakDuration * 60 
        : settings.value.shortBreakDuration * 60)
  const progress = (totalTime - timeLeft.value) / totalTime
  return circumference - (progress * circumference)
})

// 格式化时间显示
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 格式化持续时间
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// 开始/暂停计时器
const toggleTimer = () => {
  if (isRunning.value) {
    pauseTimer()
  } else {
    startTimer()
  }
}

// 开始计时器
const startTimer = () => {
  isRunning.value = true
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      completeSession()
    }
  }, 1000)
}

// 暂停计时器
const pauseTimer = () => {
  isRunning.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 重置计时器
const resetTimer = () => {
  pauseTimer()
  timeLeft.value = currentMode.value === 'work' 
    ? settings.value.workDuration * 60 
    : (currentSession.value % settings.value.longBreakInterval === 0 
        ? settings.value.longBreakDuration * 60 
        : settings.value.shortBreakDuration * 60)
}

// 跳过当前会话
const skipSession = () => {
  pauseTimer()
  completeSession()
}

// 完成会话
const completeSession = () => {
  pauseTimer()
  
  if (currentMode.value === 'work') {
    // 工作时间结束
    completedSessions.value++
    todayStats.value.completedSessions++
    todayStats.value.totalWorkTime += settings.value.workDuration * 60
    
    // 切换到休息模式
    currentMode.value = 'break'
    const isLongBreak = currentSession.value % settings.value.longBreakInterval === 0
    timeLeft.value = isLongBreak 
      ? settings.value.longBreakDuration * 60 
      : settings.value.shortBreakDuration * 60
    
    showNotification('工作时间结束！', '是时候休息一下了 🎉')
    
    if (settings.value.autoStartBreaks) {
      startTimer()
    }
  } else {
    // 休息时间结束
    const breakDuration = currentSession.value % settings.value.longBreakInterval === 0
      ? settings.value.longBreakDuration * 60
      : settings.value.shortBreakDuration * 60
    todayStats.value.totalBreakTime += breakDuration
    
    // 切换到工作模式
    currentMode.value = 'work'
    currentSession.value++
    timeLeft.value = settings.value.workDuration * 60
    
    showNotification('休息时间结束！', '开始新的番茄钟吧 🍅')
    
    if (settings.value.autoStartWork) {
      startTimer()
    }
  }
  
  todayStats.value.totalSessions++
  saveStats()
  
  if (settings.value.soundEnabled) {
    playNotificationSound()
  }
}

// 显示通知
const showNotification = (title: string, body: string) => {
  if (settings.value.notificationEnabled && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body })
        }
      })
    }
  }
}

// 播放提示音
const playNotificationSound = () => {
  // 这里可以播放提示音，暂时使用系统默认声音
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
  audio.play().catch(() => {
    // 忽略播放失败
  })
}

// 保存设置
const saveSettings = async () => {
  try {
    await window.electronAPI.savePomodoroSettings(settings.value)
    // TODO: 显示保存成功提示
  } catch (error) {
    console.error('保存设置失败:', error)
  }
}

// 重置设置
const resetSettings = () => {
  settings.value = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartWork: false,
    soundEnabled: true,
    notificationEnabled: true
  }
  resetTimer()
}

// 保存统计数据
const saveStats = async () => {
  try {
    await window.electronAPI.savePomodoroStats(todayStats.value)
  } catch (error) {
    console.error('保存统计数据失败:', error)
  }
}

// 加载设置和统计数据
const loadData = async () => {
  try {
    const [settingsResult, statsResult] = await Promise.all([
      window.electronAPI.getPomodoroSettings(),
      window.electronAPI.getPomodoroStats()
    ])
    
    if (settingsResult.success) {
      settings.value = { ...settings.value, ...settingsResult.data }
    }
    
    if (statsResult.success) {
      todayStats.value = { ...todayStats.value, ...statsResult.data }
    }
    
    resetTimer()
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

// 监听设置变化，自动重置计时器
watch(() => [settings.value.workDuration, settings.value.shortBreakDuration, settings.value.longBreakDuration], () => {
  if (!isRunning.value) {
    resetTimer()
  }
})

// 生命周期
onMounted(() => {
  loadData()
  
  // 请求通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.pomodoro-timer {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 2rem;
  min-height: 100%;
}

/* 主计时器区域 */
.timer-main {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: var(--color-surface-light);
  border-radius: 20px;
  box-shadow: 0 8px 32px var(--color-shadow-light);
}

.timer-circle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-progress {
  transition: stroke-dashoffset 0.3s ease;
}

.timer-content {
  position: absolute;
  text-align: center;
  color: var(--color-text-primary);
}

.timer-mode {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.timer-display {
  font-size: 3.5rem;
  font-weight: 700;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
  line-height: 1;
}

.timer-session {
  font-size: 1rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* 控制按钮 */
.timer-controls {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  justify-content: center;
}

.control-btn svg {
  width: 20px;
  height: 20px;
}

.start-btn {
  background: var(--color-primary);
  color: white;
}

.start-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--color-shadow);
}

.reset-btn {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border: 2px solid var(--color-border);
}

.reset-btn:hover {
  background: var(--color-surface-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-2px);
}

.skip-btn {
  background: var(--color-warning);
  color: white;
}

.skip-btn:hover {
  background: var(--color-warning-dark);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 193, 7, 0.3);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* 设置面板 */
.settings-panel {
  background: var(--color-surface-light);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px var(--color-shadow-light);
}

.settings-panel h3 {
  margin: 0 0 1.5rem 0;
  color: var(--color-text-primary);
  font-size: 1.3rem;
  font-weight: 600;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-item label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.setting-item input[type="number"] {
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 1rem;
  transition: all 0.2s ease;
}

.setting-item input[type="number"]:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.setting-item input[type="number"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.setting-toggles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.toggle-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.toggle-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.settings-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border: 2px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-surface-light);
  border-color: var(--color-primary);
}

/* 统计面板 */
.stats-panel {
  background: var(--color-surface-light);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px var(--color-shadow-light);
}

.stats-panel h3 {
  margin: 0 0 1.5rem 0;
  color: var(--color-text-primary);
  font-size: 1.3rem;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: var(--color-surface);
  border-radius: 12px;
  border: 2px solid var(--color-border);
  transition: all 0.2s ease;
}

.stat-item:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .pomodoro-timer {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1rem;
  }

  .timer-display {
    font-size: 3rem;
  }

  .settings-grid,
  .setting-toggles,
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .timer-controls {
    flex-direction: column;
    align-items: center;
  }

  .control-btn {
    width: 100%;
    max-width: 200px;
  }

  .timer-display {
    font-size: 2.5rem;
  }

  .settings-actions {
    flex-direction: column;
  }
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.timer-circle:hover {
  animation: pulse 2s infinite;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .progress-ring-background {
    stroke: var(--color-border);
  }
}
</style>
