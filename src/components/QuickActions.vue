<template>
  <div class="info-card">
    <div class="card-header">
      <h3>
        <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        快速操作
      </h3>
      <span class="status-indicator" :class="{ active: portStatus }"></span>
    </div>
    <div class="card-content">
      <div class="actions-grid">
        <button class="action-button primary" @click="openSettings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6" />
            <path d="M21 12h-6m-6 0H3" />
          </svg>
          设置
        </button>
        
        <button class="action-button secondary" @click="runScript">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          运行脚本
        </button>
        
        <button class="action-button danger" @click="clearCache">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          清理缓存
        </button>
      </div>
      
      <!-- 端口管理区域 -->
      <div class="port-management">
        <h4>端口管理</h4>
        <div class="port-controls">
          <div class="port-input-group">
            <input 
              type="number" 
              v-model="portInput" 
              placeholder="输入端口号"
              class="port-input"
              min="1"
              max="65535"
              @keyup.enter="killPortProcess"
            />
            <button 
              class="port-kill-btn" 
              @click="killPortProcess"
              :disabled="!portInput || isKilling"
            >
              <svg v-if="!isKilling" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
              <svg v-else class="spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2v4" />
                <path d="M12 18v4" />
                <path d="M4.93 4.93l2.83 2.83" />
                <path d="M16.24 16.24l2.83 2.83" />
                <path d="M2 12h4" />
                <path d="M18 12h4" />
                <path d="M4.93 19.07l2.83-2.83" />
                <path d="M16.24 7.76l2.83-2.83" />
              </svg>
              {{ isKilling ? '终止中...' : '终止进程' }}
            </button>
          </div>
          
          <!-- 结果显示 -->
          <div 
            v-if="portResult.message" 
            class="port-result" 
            :class="{ 
              success: portResult.success, 
              error: !portResult.success,
              'fade-out': portResult.fadeOut 
            }"
          >
            <svg v-if="portResult.success" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6" />
              <path d="M9 9l6 6" />
            </svg>
            <span>{{ portResult.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 端口管理状态
const portInput = ref<number | undefined>()
const portResult = ref<{ message: string; success: boolean; fadeOut: boolean }>({
  message: '',
  success: false,
  fadeOut: false
})
const isKilling = ref(false)
const portStatus = ref(false)

// 清除端口结果
const clearPortResult = () => {
  portResult.value.fadeOut = true
  setTimeout(() => {
    portResult.value.message = ''
    portResult.value.fadeOut = false
  }, 300)
}

// 终止端口进程
const killPortProcess = async () => {
  if (!portInput.value) {
    portResult.value = { message: '请输入有效的端口号', success: false, fadeOut: false }
    setTimeout(clearPortResult, 3000)
    return
  }

  isKilling.value = true
  portStatus.value = true

  try {
    const result = await window.electronAPI.killPortProcess(portInput.value)
    
    portResult.value = {
      message: result.success ? result.message : `失败: ${result.message}`,
      success: result.success,
      fadeOut: false
    }
    
    if (result.success) {
      portInput.value = undefined
    }
  } catch (error) {
    portResult.value = {
      message: `错误: ${error}`,
      success: false,
      fadeOut: false
    }
  } finally {
    isKilling.value = false
    portStatus.value = false
    
    // 3秒后自动隐藏结果
    setTimeout(clearPortResult, 3000)
  }
}

// 其他快速操作
const openSettings = () => {
  // 实现设置页面逻辑
  console.log('打开设置')
}

const runScript = () => {
  // 实现运行脚本逻辑
  console.log('运行脚本')
}

const clearCache = () => {
  // 实现清理缓存逻辑
  console.log('清理缓存')
}
</script>

<style scoped>
.actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
  text-align: center;
}

.action-button svg {
  width: 20px;
  height: 20px;
}

.action-button.primary {
  background: var(--color-primary);
  color: white;
}

.action-button.primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.action-button.secondary {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.action-button.secondary:hover {
  background: var(--color-surface-light);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.action-button.danger {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.action-button.danger:hover {
  background: #fecaca;
  transform: translateY(-1px);
}

/* 端口管理样式 */
.port-management {
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}

.port-management h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: var(--color-text-primary);
  font-weight: 600;
}

.port-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.port-input-group {
  display: flex;
  gap: 0.5rem;
}

.port-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 0.85rem;
  transition: border-color 0.2s ease;
}

.port-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.port-input::placeholder {
  color: var(--color-text-muted);
}

.port-kill-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.port-kill-btn:hover:not(:disabled) {
  background: #dc2626;
}

.port-kill-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.port-kill-btn svg {
  width: 14px;
  height: 14px;
}

.port-kill-btn .spinning {
  animation: spin 1s linear infinite;
}

.port-result {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  transition: opacity 0.3s ease;
}

.port-result svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.port-result.success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.port-result.error {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.port-result.fade-out {
  opacity: 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .actions-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .action-button {
    flex-direction: row;
    justify-content: center;
    padding: 0.75rem;
  }
  
  .port-input-group {
    flex-direction: column;
  }
  
  .port-kill-btn {
    justify-content: center;
  }
}
</style>