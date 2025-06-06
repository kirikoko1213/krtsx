<template>
  <div class="script-manager">
    <div class="toolbar">
      <button class="btn btn-primary" @click="showAddDialog = true">
        <span>+</span> 添加脚本
      </button>
      <div class="search-box">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="搜索脚本..."
          class="search-input"
        />
      </div>
    </div>

    <div class="content-area">
      <div class="scripts-list">
        <div class="scripts-header">
          <h3>脚本列表 ({{ filteredScripts.length }})</h3>
        </div>
        
        <div class="scripts-container">
          <div
            v-for="script in filteredScripts"
            :key="script.id"
            :class="['script-card', { active: selectedScript?.id === script.id }]"
            @click="selectScript(script)"
          >
            <div class="script-info">
              <h4>{{ script.name }}</h4>
              <p class="script-path">
                {{ script.type === 'file' ? script.path : script.command }}
              </p>
              <div class="script-badges">
                <span class="badge" :class="script.type">{{ script.type === 'file' ? '文件' : '命令' }}</span>
                <span v-if="script.cronExpression" class="badge cron">定时</span>
                <span class="badge" :class="script.enabled ? 'enabled' : 'disabled'">
                  {{ script.enabled ? '启用' : '禁用' }}
                </span>
              </div>
            </div>
            <div class="script-actions">
              <button
                class="btn btn-sm btn-success"
                @click.stop="executeScript(script)"
                :disabled="isExecuting"
              >
                执行
              </button>
              <button
                class="btn btn-sm btn-secondary"
                @click.stop="editScript(script)"
              >
                编辑
              </button>
              <button
                class="btn btn-sm btn-danger"
                @click.stop="deleteScript(script.id)"
              >
                删除
              </button>
            </div>
          </div>

          <div v-if="filteredScripts.length === 0" class="empty-state">
            <p>{{ scripts.length === 0 ? '暂无脚本，点击上方"添加脚本"按钮开始' : '没有找到匹配的脚本' }}</p>
          </div>
        </div>
      </div>

      <div class="output-panel">
        <div class="output-header">
          <h3>输出面板</h3>
          <button class="btn btn-sm btn-secondary" @click="clearOutput">
            清空
          </button>
        </div>
        <div class="output-content" ref="outputContainer">
          <div
            v-for="(line, index) in outputLines"
            :key="index"
            :class="['output-line', line.type]"
          >
            <span class="timestamp">{{ line.timestamp }}</span>
            <span class="content">{{ line.content }}</span>
          </div>
          <div v-if="outputLines.length === 0" class="empty-output">
            选择一个脚本并执行以查看输出
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑脚本对话框 -->
    <ScriptDialog
      v-if="showAddDialog"
      :editing-script="editingScript"
      @close="closeDialog"
      @save="onScriptSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import ScriptDialog from './ScriptDialog.vue'

interface ScriptConfig {
  id: string
  name: string
  type: 'file' | 'command'
  path?: string
  command?: string
  cronExpression?: string
  enabled: boolean
  autoStart: boolean
}

interface OutputLine {
  timestamp: string
  content: string
  type: 'stdout' | 'stderr' | 'info'
}

const scripts = ref<ScriptConfig[]>([])
const selectedScript = ref<ScriptConfig | null>(null)
const outputLines = ref<OutputLine[]>([])
const searchTerm = ref('')
const isExecuting = ref(false)

const showAddDialog = ref(false)
const editingScript = ref<ScriptConfig | null>(null)
const outputContainer = ref<HTMLElement>()

const filteredScripts = computed(() => {
  if (!searchTerm.value) return scripts.value
  return scripts.value.filter(script =>
    script.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    (script.path && script.path.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
    (script.command && script.command.toLowerCase().includes(searchTerm.value.toLowerCase()))
  )
})

// 加载脚本配置
async function loadScripts() {
  try {
    const configs = await window.electronAPI.getScriptConfigs()
    scripts.value = configs
  } catch (error) {
    addOutputLine('加载脚本配置失败: ' + error, 'stderr')
  }
}

// 选择脚本
function selectScript(script: ScriptConfig) {
  selectedScript.value = script
}

// 执行脚本
async function executeScript(script: ScriptConfig) {
  if (isExecuting.value) return
  
  isExecuting.value = true
  selectedScript.value = script
  
  addOutputLine(`开始执行脚本: ${script.name}`, 'info')
  
  try {
    const result = await window.electronAPI.executeScript(script)
    if (result.success) {
      addOutputLine(`脚本执行完成 (退出码: ${result.exitCode})`, 'info')
    } else {
      addOutputLine(`脚本执行失败: ${result.error}`, 'stderr')
    }
  } catch (error) {
    addOutputLine(`执行失败: ${error}`, 'stderr')
  } finally {
    isExecuting.value = false
  }
}

// 添加输出行
function addOutputLine(content: string, type: 'stdout' | 'stderr' | 'info' = 'stdout') {
  const timestamp = new Date().toLocaleTimeString()
  outputLines.value.push({ timestamp, content, type })
  
  nextTick(() => {
    if (outputContainer.value) {
      outputContainer.value.scrollTop = outputContainer.value.scrollHeight
    }
  })
}

// 清空输出
function clearOutput() {
  outputLines.value = []
}

// 编辑脚本
function editScript(script: ScriptConfig) {
  editingScript.value = script
  showAddDialog.value = true
}

// 删除脚本
async function deleteScript(id: string) {
  const script = scripts.value.find(s => s.id === id)
  if (!script) return
  
  if (!confirm(`确定要删除脚本 "${script.name}" 吗？`)) return
  
  try {
    const result = await window.electronAPI.deleteScriptConfig(id)
    if (result.success) {
      await loadScripts()
      if (selectedScript.value?.id === id) {
        selectedScript.value = null
      }
      addOutputLine(`脚本 "${script.name}" 删除成功`, 'info')
    } else {
      alert('删除失败: ' + result.error)
    }
  } catch (error) {
    alert('删除失败: ' + error)
  }
}

// 关闭对话框
function closeDialog() {
  showAddDialog.value = false
  editingScript.value = null
}

// 保存脚本回调
async function onScriptSave() {
  await loadScripts()
  closeDialog()
}

// 监听脚本输出
let outputCleanup: (() => void) | null = null
let scheduledCleanup: (() => void) | null = null

onMounted(async () => {
  await loadScripts()
  
  // 监听脚本输出
  outputCleanup = window.electronAPI.onScriptOutput((output) => {
    addOutputLine(output.data, output.type)
  })
  
  // 监听定时脚本执行
  scheduledCleanup = window.electronAPI.onExecuteScheduledScript((config) => {
    addOutputLine(`定时执行脚本: ${config.name}`, 'info')
    executeScript(config)
  })
})

onUnmounted(() => {
  outputCleanup?.()
  scheduledCleanup?.()
})
</script>

<style scoped>
.script-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.search-box {
  flex: 1;
  max-width: 300px;
  margin-left: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.content-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.scripts-list {
  width: 400px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.scripts-header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.scripts-header h3 {
  font-size: 1rem;
  color: #333;
  margin: 0;
}

.scripts-container {
  flex: 1;
  overflow-y: auto;
}

.script-card {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}

.script-card:hover {
  background: #f8f9fa;
}

.script-card.active {
  background: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.script-info h4 {
  font-size: 0.9rem;
  color: #333;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.script-path {
  font-size: 0.8rem;
  color: #666;
  margin: 0 0 0.5rem 0;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.script-badges {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.badge {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.badge.file { background: #e3f2fd; color: #1976d2; }
.badge.command { background: #f3e5f5; color: #7b1fa2; }
.badge.cron { background: #fff3e0; color: #f57c00; }
.badge.enabled { background: #e8f5e8; color: #2e7d32; }
.badge.disabled { background: #ffebee; color: #c62828; }

.script-actions {
  display: flex;
  gap: 0.5rem;
}

.output-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.output-header h3 {
  font-size: 1rem;
  color: #333;
  margin: 0;
}

.output-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8rem;
  line-height: 1.4;
  background: #fafafa;
}

.output-line {
  margin-bottom: 0.25rem;
  word-break: break-all;
}

.output-line.stdout { color: #333; }
.output-line.stderr { color: #d32f2f; }
.output-line.info { color: #1976d2; font-weight: 500; }

.timestamp {
  color: #666;
  margin-right: 0.5rem;
  font-size: 0.7rem;
}

.empty-state,
.empty-output {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-style: italic;
}

/* 按钮样式 */
.btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
  border-color: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  border-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
  border-color: #545b62;
}

.btn-success {
  background: #28a745;
  border-color: #28a745;
  color: white;
}

.btn-success:hover {
  background: #1e7e34;
  border-color: #1e7e34;
}

.btn-danger {
  background: #dc3545;
  border-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
  border-color: #c82333;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

interface ScriptConfig {
  id: string
  name: string
  type: 'file' | 'command'
  path?: string
  command?: string
  cronExpression?: string
  enabled: boolean
  autoStart: boolean
}

interface OutputLine {
  timestamp: string
  content: string
  type: 'stdout' | 'stderr' | 'info'
}

const scripts = ref<ScriptConfig[]>([])
const selectedScript = ref<ScriptConfig | null>(null)
const outputLines = ref<OutputLine[]>([])
const searchTerm = ref('')
const isExecuting = ref(false)

const showAddDialog = ref(false)
const editingScript = ref<ScriptConfig | null>(null)
const showCronHelp = ref(false)
const outputContainer = ref<HTMLElement>()

const scriptForm = reactive({
  name: '',
  type: 'file' as 'file' | 'command',
  path: '',
  command: '',
  cronExpression: '',
  enabled: true
})

const filteredScripts = computed(() => {
  if (!searchTerm.value) return scripts.value
  return scripts.value.filter(script =>
    script.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    (script.path && script.path.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
    (script.command && script.command.toLowerCase().includes(searchTerm.value.toLowerCase()))
  )
})

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 加载脚本配置
async function loadScripts() {
  try {
    const configs = await window.electronAPI.getScriptConfigs()
    scripts.value = configs
  } catch (error) {
    addOutputLine('加载脚本配置失败: ' + error, 'stderr')
  }
}

// 选择脚本
function selectScript(script: ScriptConfig) {
  selectedScript.value = script
}

// 执行脚本
async function executeScript(script: ScriptConfig) {
  if (isExecuting.value) return
  
  isExecuting.value = true
  selectedScript.value = script
  
  addOutputLine(`开始执行脚本: ${script.name}`, 'info')
  
  try {
    const result = await window.electronAPI.executeScript(script)
    if (result.success) {
      addOutputLine(`脚本执行完成 (退出码: ${result.exitCode})`, 'info')
    } else {
      addOutputLine(`脚本执行失败: ${result.error}`, 'stderr')
    }
  } catch (error) {
    addOutputLine(`执行失败: ${error}`, 'stderr')
  } finally {
    isExecuting.value = false
  }
}

// 添加输出行
function addOutputLine(content: string, type: 'stdout' | 'stderr' | 'info' = 'stdout') {
  const timestamp = new Date().toLocaleTimeString()
  outputLines.value.push({ timestamp, content, type })
  
  nextTick(() => {
    if (outputContainer.value) {
      outputContainer.value.scrollTop = outputContainer.value.scrollHeight
    }
  })
}

// 清空输出
function clearOutput() {
  outputLines.value = []
}

// 选择文件
async function selectFile() {
  const result = await window.electronAPI.selectFile()
  if (!result.canceled && result.filePaths.length > 0) {
    scriptForm.path = result.filePaths[0]
  }
}

// 编辑脚本
function editScript(script: ScriptConfig) {
  editingScript.value = script
  Object.assign(scriptForm, {
    name: script.name,
    type: script.type,
    path: script.path || '',
    command: script.command || '',
    cronExpression: script.cronExpression || '',
    enabled: script.enabled
  })
  showAddDialog.value = true
}

// 保存脚本
async function saveScript() {
  if (!scriptForm.name.trim()) return
  
  if (scriptForm.type === 'file' && !scriptForm.path.trim()) {
    alert('请选择脚本文件')
    return
  }
  
  if (scriptForm.type === 'command' && !scriptForm.command.trim()) {
    alert('请输入执行命令')
    return
  }

  const config: ScriptConfig = {
    id: editingScript.value?.id || generateId(),
    name: scriptForm.name.trim(),
    type: scriptForm.type,
    path: scriptForm.type === 'file' ? scriptForm.path.trim() : undefined,
    command: scriptForm.type === 'command' ? scriptForm.command.trim() : undefined,
    cronExpression: scriptForm.cronExpression.trim() || undefined,
    enabled: scriptForm.enabled,
    autoStart: false
  }

  try {
    const result = await window.electronAPI.saveScriptConfig(config)
    if (result.success) {
      await loadScripts()
      closeDialog()
      addOutputLine(`脚本 "${config.name}" ${editingScript.value ? '更新' : '添加'}成功`, 'info')
    } else {
      alert('保存失败: ' + result.error)
    }
  } catch (error) {
    alert('保存失败: ' + error)
  }
}

// 删除脚本
async function deleteScript(id: string) {
  const script = scripts.value.find(s => s.id === id)
  if (!script) return
  
  if (!confirm(`确定要删除脚本 "${script.name}" 吗？`)) return
  
  try {
    const result = await window.electronAPI.deleteScriptConfig(id)
    if (result.success) {
      await loadScripts()
      if (selectedScript.value?.id === id) {
        selectedScript.value = null
      }
      addOutputLine(`脚本 "${script.name}" 删除成功`, 'info')
    } else {
      alert('删除失败: ' + result.error)
    }
  } catch (error) {
    alert('删除失败: ' + error)
  }
}

// 关闭对话框
function closeDialog() {
  showAddDialog.value = false
  editingScript.value = null
  showCronHelp.value = false
  Object.assign(scriptForm, {
    name: '',
    type: 'file',
    path: '',
    command: '',
    cronExpression: '',
    enabled: true
  })
}

// 监听脚本输出
let outputCleanup: (() => void) | null = null
let scheduledCleanup: (() => void) | null = null

onMounted(async () => {
  await loadScripts()
  
  // 监听脚本输出
  outputCleanup = window.electronAPI.onScriptOutput((output) => {
    addOutputLine(output.data, output.type)
  })
  
  // 监听定时脚本执行
  scheduledCleanup = window.electronAPI.onExecuteScheduledScript((config) => {
    addOutputLine(`定时执行脚本: ${config.name}`, 'info')
    executeScript(config)
  })
})

onUnmounted(() => {
  outputCleanup?.()
  scheduledCleanup?.()
})
</script>

<style scoped>
.script-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.search-box {
  flex: 1;
  max-width: 300px;
  margin-left: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.content-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.scripts-list {
  width: 400px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.scripts-header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.scripts-header h3 {
  font-size: 1rem;
  color: #333;
  margin: 0;
}

.scripts-container {
  flex: 1;
  overflow-y: auto;
}

.script-card {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}

.script-card:hover {
  background: #f8f9fa;
}

.script-card.active {
  background: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.script-info h4 {
  font-size: 0.9rem;
  color: #333;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.script-path {
  font-size: 0.8rem;
  color: #666;
  margin: 0 0 0.5rem 0;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.script-badges {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.badge {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.badge.file { background: #e3f2fd; color: #1976d2; }
.badge.command { background: #f3e5f5; color: #7b1fa2; }
.badge.cron { background: #fff3e0; color: #f57c00; }
.badge.enabled { background: #e8f5e8; color: #2e7d32; }
.badge.disabled { background: #ffebee; color: #c62828; }

.script-actions {
  display: flex;
  gap: 0.5rem;
}

.output-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.output-header h3 {
  font-size: 1rem;
  color: #333;
  margin: 0;
}

.output-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8rem;
  line-height: 1.4;
  background: #fafafa;
}

.output-line {
  margin-bottom: 0.25rem;
  word-break: break-all;
}

.output-line.stdout { color: #333; }
.output-line.stderr { color: #d32f2f; }
.output-line.info { color: #1976d2; font-weight: 500; }

.timestamp {
  color: #666;
  margin-right: 0.5rem;
  font-size: 0.7rem;
}

.empty-state,
.empty-output {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-style: italic;
}

/* 按钮样式 */
.btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
  border-color: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  border-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
  border-color: #545b62;
}

.btn-success {
  background: #28a745;
  border-color: #28a745;
  color: white;
}

.btn-success:hover {
  background: #1e7e34;
  border-color: #1e7e34;
}

.btn-danger {
  background: #dc3545;
  border-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
  border-color: #c82333;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f0f0f0;
  border-radius: 50%;
}

.dialog-content {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.form-group input[type="text"]:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-label {
  font-weight: normal !important;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label {
  font-weight: normal !important;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.file-input-group {
  display: flex;
  gap: 0.5rem;
}

.file-input-group input {
  flex: 1;
}

.form-help {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

.form-help a {
  color: #007bff;
  text-decoration: none;
}

.form-help a:hover {
  text-decoration: underline;
}

.cron-help {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.8rem;
}

.cron-help ul {
  margin: 0.5rem 0 0 1rem;
}

.cron-help li {
  margin-bottom: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}
</style> 