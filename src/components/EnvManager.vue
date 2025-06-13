<template>
  <div class="env-manager">
    <div class="env-toolbar">
      <h2>🌍 环境变量管理</h2>
      <div class="toolbar-actions">
        <button class="btn btn-primary" @click="showAddDialog = true">
          <span>➕</span> 添加变量
        </button>
        <button class="btn btn-secondary" @click="refreshEnvVars"><span>🔄</span> 刷新</button>
      </div>
    </div>

    <div class="env-content">
      <!-- 环境变量列表 -->
      <div class="env-list">
        <div class="env-header">
          <div class="header-item var-name">变量名</div>
          <div class="header-item var-value">变量值</div>
          <div class="header-item var-actions">操作</div>
        </div>

        <div v-if="loading" class="loading-container">
          <div class="loading-spinner">加载中...</div>
        </div>

        <div v-else-if="envVars.length === 0" class="empty-state">
          <div class="empty-icon">📄</div>
          <p>暂无环境变量</p>
          <button class="btn btn-primary" @click="showAddDialog = true">添加第一个环境变量</button>
        </div>

        <div v-else class="env-items">
          <div v-for="envVar in filteredEnvVars" :key="envVar.name" class="env-item">
            <div class="env-name">{{ envVar.name }}</div>
            <div class="env-value">
              <span v-if="!envVar.showValue" class="masked-value">
                {{ maskValue(envVar.value) }}
              </span>
              <span v-else class="full-value">{{ envVar.value }}</span>
              <button
                class="btn btn-sm btn-ghost"
                @click="toggleValueVisibility(envVar.name)"
                :title="envVar.showValue ? '隐藏值' : '显示值'"
              >
                {{ envVar.showValue ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            <div class="env-actions">
              <button
                class="btn btn-sm btn-secondary"
                @click="copyValue(envVar.value)"
                title="复制值"
              >
                📋
              </button>
              <button class="btn btn-sm btn-warning" @click="editEnvVar(envVar)" title="编辑">
                ✏️
              </button>
              <button
                class="btn btn-sm btn-danger"
                @click="deleteEnvVar(envVar.name)"
                title="删除"
                :disabled="envVar.isSystem"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索和筛选 -->
      <div class="env-filters">
        <div class="filter-section">
          <label>搜索变量</label>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="输入变量名或值..."
            class="search-input"
          />
        </div>

        <div class="filter-section">
          <label>筛选类型</label>
          <select v-model="filterType" class="filter-select">
            <option value="all">全部</option>
            <option value="user">用户变量</option>
            <option value="system">系统变量</option>
          </select>
        </div>

        <div class="filter-stats">
          <span>显示 {{ filteredEnvVars.length }} / {{ envVars.length }} 个变量</span>
        </div>
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <div v-if="showAddDialog || showEditDialog" class="dialog-overlay" @click="closeDialogs">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ showEditDialog ? '编辑环境变量' : '添加环境变量' }}</h3>
          <button class="btn btn-ghost" @click="closeDialogs">✕</button>
        </div>

        <div class="dialog-content">
          <div class="form-group">
            <label>变量名</label>
            <input
              v-model="dialogData.name"
              type="text"
              placeholder="例如: MY_VARIABLE"
              class="form-input"
              :disabled="showEditDialog"
            />
          </div>

          <div class="form-group">
            <label>变量值</label>
            <textarea
              v-model="dialogData.value"
              placeholder="输入变量值..."
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="dialogData.isSystem" type="checkbox" :disabled="showEditDialog" />
              <span>系统级变量 (需要管理员权限)</span>
            </label>
          </div>

          <div v-if="dialogError" class="error-message">
            {{ dialogError }}
          </div>
        </div>

        <div class="dialog-actions">
          <button class="btn btn-secondary" @click="closeDialogs">取消</button>
          <button
            class="btn btn-primary"
            @click="showEditDialog ? updateEnvVar() : addEnvVar()"
            :disabled="!dialogData.name || !dialogData.value"
          >
            {{ showEditDialog ? '更新' : '添加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteDialog" class="dialog-overlay" @click="showDeleteDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>确认删除</h3>
          <button class="btn btn-ghost" @click="showDeleteDialog = false">✕</button>
        </div>

        <div class="dialog-content">
          <p>
            确定要删除环境变量 <strong>{{ deleteTarget }}</strong> 吗？
          </p>
          <p class="warning-text">此操作不可撤销，可能会影响依赖此变量的程序。</p>
        </div>

        <div class="dialog-actions">
          <button class="btn btn-secondary" @click="showDeleteDialog = false">取消</button>
          <button class="btn btn-danger" @click="confirmDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

interface EnvVar {
  name: string
  value: string
  isSystem: boolean
  showValue: boolean
}

const loading = ref(true)
const envVars = ref<EnvVar[]>([])
const searchTerm = ref('')
const filterType = ref('all')

// 对话框状态
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const deleteTarget = ref('')
const dialogError = ref('')

const dialogData = reactive({
  name: '',
  value: '',
  isSystem: false,
})

// 计算属性
const filteredEnvVars = computed(() => {
  let filtered = envVars.value

  // 搜索筛选
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(
      env => env.name.toLowerCase().includes(term) || env.value.toLowerCase().includes(term)
    )
  }

  // 类型筛选
  if (filterType.value !== 'all') {
    filtered = filtered.filter(env =>
      filterType.value === 'system' ? env.isSystem : !env.isSystem
    )
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name))
})

// 方法
async function refreshEnvVars() {
  loading.value = true
  try {
    const result = await window.electronAPI.getEnvironmentVariables()
    if (result.success) {
      envVars.value = result.data.map((env: any) => ({
        ...env,
        showValue: false,
      }))
    } else {
      console.error('获取环境变量失败:', result.error)
    }
  } catch (error) {
    console.error('获取环境变量出错:', error)
  } finally {
    loading.value = false
  }
}

function toggleValueVisibility(name: string) {
  const envVar = envVars.value.find(env => env.name === name)
  if (envVar) {
    envVar.showValue = !envVar.showValue
  }
}

function maskValue(value: string): string {
  if (value.length <= 8) {
    return '*'.repeat(value.length)
  }
  return value.substring(0, 3) + '*'.repeat(value.length - 6) + value.substring(value.length - 3)
}

async function copyValue(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    // 这里可以添加成功提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

function editEnvVar(envVar: EnvVar) {
  dialogData.name = envVar.name
  dialogData.value = envVar.value
  dialogData.isSystem = envVar.isSystem
  showEditDialog.value = true
  dialogError.value = ''
}

async function addEnvVar() {
  try {
    const result = await window.electronAPI.setEnvironmentVariable(
      dialogData.name,
      dialogData.value,
      dialogData.isSystem
    )

    if (result.success) {
      await refreshEnvVars()
      closeDialogs()
    } else {
      dialogError.value = result.error || '添加失败'
    }
  } catch (error) {
    dialogError.value = '添加环境变量时出错'
    console.error('添加环境变量失败:', error)
  }
}

async function updateEnvVar() {
  try {
    const result = await window.electronAPI.setEnvironmentVariable(
      dialogData.name,
      dialogData.value,
      dialogData.isSystem
    )

    if (result.success) {
      await refreshEnvVars()
      closeDialogs()
    } else {
      dialogError.value = result.error || '更新失败'
    }
  } catch (error) {
    dialogError.value = '更新环境变量时出错'
    console.error('更新环境变量失败:', error)
  }
}

function deleteEnvVar(name: string) {
  deleteTarget.value = name
  showDeleteDialog.value = true
}

async function confirmDelete() {
  try {
    const result = await window.electronAPI.deleteEnvironmentVariable(deleteTarget.value)

    if (result.success) {
      await refreshEnvVars()
    } else {
      console.error('删除失败:', result.error)
    }
  } catch (error) {
    console.error('删除环境变量失败:', error)
  } finally {
    showDeleteDialog.value = false
    deleteTarget.value = ''
  }
}

function closeDialogs() {
  showAddDialog.value = false
  showEditDialog.value = false
  dialogData.name = ''
  dialogData.value = ''
  dialogData.isSystem = false
  dialogError.value = ''
}

// 生命周期
onMounted(() => {
  refreshEnvVars()
})
</script>

<style scoped>
.env-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
}

.env-toolbar {
  background: var(--color-surface-light);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px var(--color-shadow-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.env-toolbar h2 {
  font-size: 1.5rem;
  color: var(--color-text-primary);
  margin: 0;
  font-weight: 600;
}

.toolbar-actions {
  display: flex;
  gap: 0.75rem;
}

.env-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.5rem;
  overflow: hidden;
}

.env-list {
  background: var(--color-surface-light);
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--color-shadow-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.env-header {
  display: grid;
  grid-template-columns: 200px 1fr 120px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.env-items {
  flex: 1;
  overflow-y: auto;
}

.env-item {
  display: grid;
  grid-template-columns: 200px 1fr 120px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
  transition: background-color 0.2s ease;
}

.env-item:hover {
  background: var(--color-surface);
}

.env-name {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  color: var(--color-text-primary);
  font-weight: 600;
  word-break: break-all;
}

.env-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.masked-value,
.full-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.env-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.env-filters {
  background: var(--color-surface-light);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px var(--color-shadow-light);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: fit-content;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-section label {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.search-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.filter-stats {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-light);
}

.loading-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.loading-spinner {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--color-text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--color-surface-light);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  box-shadow: 0 20px 40px var(--color-shadow);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.dialog-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.dialog-content {
  padding: 1.5rem;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 0.9rem;
  transition: all 0.3s ease;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
  width: auto;
  margin: 0;
}

.error-message {
  color: var(--color-error);
  font-size: 0.85rem;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--color-error-light);
  border-radius: 6px;
  border: 1px solid var(--color-error);
}

.warning-text {
  color: var(--color-warning);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--color-border-light);
  background: var(--color-surface);
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-surface-light);
  border-color: var(--color-primary);
}

.btn-warning {
  background: var(--color-warning);
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: var(--color-warning-dark);
}

.btn-danger {
  background: var(--color-error);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-error-dark);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  padding: 0.5rem;
}

.btn-ghost:hover {
  background: var(--color-surface);
  color: var(--color-text-primary);
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .env-content {
    grid-template-columns: 1fr;
  }

  .env-header,
  .env-item {
    grid-template-columns: 1fr 2fr auto;
  }
}

@media (max-width: 768px) {
  .env-header,
  .env-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .env-actions {
    justify-content: flex-start;
  }
}
</style>
