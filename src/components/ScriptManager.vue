<template>
  <div class="script-manager">
    <div class="toolbar">
      <button class="btn btn-primary" @click="showAddDialog = true">
        <span>+</span> 添加脚本
      </button>
      <div class="toolbar-center">
        <div class="search-box">
          <input
            v-model="searchTerm"
            type="text"
            placeholder="搜索脚本..."
            class="search-input"
          />
        </div>
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
                v-if="!runningScripts.has(script.id)"
                class="btn btn-sm btn-success"
                @click.stop="executeScript(script)"
              >
                执行
              </button>
              <button
                v-else
                class="btn btn-sm btn-warning"
                @click.stop="stopScript(script)"
              >
                停止
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
          <h3>
            {{ selectedScript ? `${selectedScript.name} - 输出` : '输出面板' }}
            <span v-if="selectedScript && runningScripts.has(selectedScript.id)" class="running-indicator">运行中</span>
          </h3>
          <div class="output-actions">
            <button 
              v-if="selectedScript && scriptOutputs[selectedScript.id]?.length > 0"
              class="btn btn-sm btn-secondary" 
              @click="clearCurrentScriptOutput"
            >
              清空当前
            </button>
            <button 
              v-if="selectedScript && runningScripts.has(selectedScript.id)"
              class="btn btn-sm btn-warning" 
              @click="stopCurrentScript"
            >
              停止执行
            </button>
            <button class="btn btn-sm btn-secondary" @click="clearAllOutputs">
              清空全部
            </button>
          </div>
        </div>
        
        <div class="output-content" ref="outputContainer">
          <!-- 显示选中脚本的输出 -->
          <div v-if="selectedScript && currentScriptOutput.length > 0">
            <div
              v-for="(line, index) in currentScriptOutput"
              :key="index"
              :class="['output-line', line.type]"
            >
              <span class="timestamp">{{ line.timestamp }}</span>
              <span class="content">{{ line.content }}</span>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-else class="empty-output">
            {{ selectedScript ? '该脚本暂无输出' : '请选择一个脚本查看输出' }}
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
import { ref, computed, onMounted, onUnmounted, nextTick, toRaw } from 'vue'
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
const searchTerm = ref('')
const runningScripts = ref<Set<string>>(new Set())
const scriptOutputs = ref<Record<string, OutputLine[]>>({})

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

// 当前选中脚本的输出
const currentScriptOutput = computed(() => {
  if (!selectedScript.value) return []
  return scriptOutputs.value[selectedScript.value.id] || []
})

// 加载脚本配置
async function loadScripts() {
  try {
    const configs = await window.electronAPI.getScriptConfigs()
    scripts.value = configs
  } catch (error) {
    console.error('加载脚本配置失败:', error)
  }
}

// 选择脚本
function selectScript(script: ScriptConfig) {
  selectedScript.value = script
}

// 执行脚本
async function executeScript(script: ScriptConfig) {
  runningScripts.value.add(script.id)
  selectedScript.value = script
  
  // 为脚本创建输出数组
  if (!scriptOutputs.value[script.id]) {
    scriptOutputs.value[script.id] = []
  }
  
  addScriptOutputLine(script.id, `开始执行脚本: ${script.name}`, 'info')
  
  try {
    const result = await window.electronAPI.executeScript(toRaw(script))
    if (result.success) {
      addScriptOutputLine(script.id, `脚本执行完成 (退出码: ${result.exitCode})`, 'info')
    } else {
      addScriptOutputLine(script.id, `脚本执行失败: ${result.error}`, 'stderr')
    }
  } catch (error) {
    addScriptOutputLine(script.id, `执行失败: ${error}`, 'stderr')
  } finally {
    runningScripts.value.delete(script.id)
  }
}

// 停止脚本
async function stopScript(script: ScriptConfig) {
  try {
    const result = await window.electronAPI.stopScript(script.id)
    if (result.success) {
      addScriptOutputLine(script.id, `正在停止脚本: ${script.name}`, 'info')
    } else {
      addScriptOutputLine(script.id, `停止脚本失败: ${result.error}`, 'stderr')
    }
  } catch (error) {
    addScriptOutputLine(script.id, `停止脚本失败: ${error}`, 'stderr')
  }
}

// 为指定脚本添加输出行
function addScriptOutputLine(scriptId: string, content: string, type: 'stdout' | 'stderr' | 'info' = 'stdout') {
  const timestamp = new Date().toLocaleTimeString()
  
  if (!scriptOutputs.value[scriptId]) {
    scriptOutputs.value[scriptId] = []
  }
  
  // 按换行符分割内容，每行作为单独的输出
  const lines = content.split(/\r?\n/)
  
  lines.forEach((line, index) => {
    // 跳过空行（除了最后一行，因为命令输出通常以换行符结尾）
    if (line.trim() !== '' || (index === lines.length - 1 && lines.length > 1)) {
      if (line.trim() !== '') {  // 只添加非空行
        scriptOutputs.value[scriptId].push({ 
          timestamp: index === 0 ? timestamp : '', // 只在第一行显示时间戳
          content: line, 
          type 
        })
      }
    }
  })
  
  // 如果当前选中的脚本就是这个脚本，自动滚动到底部
  if (selectedScript.value?.id === scriptId) {
    nextTick(() => {
      if (outputContainer.value) {
        outputContainer.value.scrollTop = outputContainer.value.scrollHeight
      }
    })
  }
}

// 清空当前选中脚本的输出
function clearCurrentScriptOutput() {
  if (selectedScript.value && scriptOutputs.value[selectedScript.value.id]) {
    scriptOutputs.value[selectedScript.value.id] = []
  }
}

// 停止当前选中的脚本
async function stopCurrentScript() {
  if (selectedScript.value && runningScripts.value.has(selectedScript.value.id)) {
    await stopScript(selectedScript.value)
  }
}

// 清空所有输出
function clearAllOutputs() {
  scriptOutputs.value = {}
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
      // 清理删除脚本的输出
      delete scriptOutputs.value[id]
      console.log(`脚本 "${script.name}" 删除成功`)
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
    addScriptOutputLine(output.scriptId, output.data, output.type)
  })
  
  // 监听定时脚本执行
  scheduledCleanup = window.electronAPI.onExecuteScheduledScript((config) => {
    addScriptOutputLine(config.id, `定时执行脚本: ${config.name}`, 'info')
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
  background: var(--color-surface-light);
  border-radius: 12px;
  box-shadow: 0 8px 32px var(--color-shadow);
  overflow: hidden;
  animation: fadeIn 0.5s ease;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(10px);
}

.toolbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
  margin: 0 1rem;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.search-box {
  max-width: 400px;
  width: 100%;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--color-surface-light);
  color: var(--color-text-primary);
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
  transform: scale(1.02);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.content-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.scripts-list {
  width: 420px;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
}

.scripts-header {
  padding: 1.25rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  backdrop-filter: blur(10px);
}

.scripts-header h3 {
  font-size: 1.1rem;
  color: var(--color-text-primary);
  margin: 0;
  font-weight: 600;
}

.scripts-container {
  flex: 1;
  overflow-y: auto;
}

.script-card {
  padding: 1.25rem;
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--color-surface-light);
  margin: 0.25rem;
  border-radius: 8px;
  border: 1px solid transparent;
}

.script-card:hover {
  background: var(--color-surface);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px var(--color-shadow-light);
  border-color: var(--color-border);
}

.script-card.active {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  box-shadow: 0 4px 16px var(--color-shadow);
  transform: translateY(-1px);
}

.script-info h4 {
  font-size: 1rem;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.script-path {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin: 0 0 0.75rem 0;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--color-surface);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
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

.badge.file { 
  background: var(--color-primary-light); 
  color: var(--color-primary-dark); 
  border: 1px solid var(--color-primary);
}
.badge.command { 
  background: var(--color-secondary); 
  color: white;
  opacity: 0.9;
}
.badge.cron { 
  background: var(--color-warning); 
  color: white;
  animation: pulse 2s infinite;
}
.badge.enabled { 
  background: var(--color-success); 
  color: white;
}
.badge.disabled { 
  background: var(--color-error); 
  color: white;
  opacity: 0.8;
}

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
  padding: 1.25rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  backdrop-filter: blur(10px);
}

.output-header h3 {
  font-size: 1.1rem;
  color: var(--color-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
}

.running-indicator {
  background: var(--color-running);
  color: white;
  padding: 0.3rem 0.75rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  animation: pulse 2s infinite;
  box-shadow: 0 2px 8px var(--color-running-bg);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.output-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  background: var(--color-surface);
  color: var(--color-text-primary);
}

.output-line {
  margin-bottom: 0.2rem;
  word-break: break-word;
  white-space: pre-wrap;  /* 保持空格和制表符 */
  display: flex;
  align-items: flex-start;
}

.output-line.stdout { color: var(--color-text-primary); }
.output-line.stderr { color: var(--color-error); font-weight: 500; }
.output-line.info { color: var(--color-info); font-weight: 600; }

.timestamp {
  color: var(--color-text-muted);
  margin-right: 0.75rem;
  font-size: 0.75rem;
  opacity: 0.8;
  min-width: 80px;  /* 固定宽度，保持对齐 */
  flex-shrink: 0;   /* 不缩小 */
}

.content {
  flex: 1;
  word-break: break-word;
  white-space: pre-wrap;  /* 保持原始格式 */
}

.empty-state,
.empty-output {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
  font-style: italic;
  background: var(--color-surface-light);
  border-radius: 8px;
  margin: 1rem;
  padding: 2rem;
}

.running-scripts {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.script-output-panel {
  margin-bottom: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
}

.script-output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  border-radius: 8px 8px 0 0;
}

.script-output-header h4 {
  font-size: 0.9rem;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.output-actions {
  display: flex;
  gap: 0.5rem;
}

.script-output-content {
  height: 200px;
  overflow-y: auto;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8rem;
  line-height: 1.4;
  background: #fafafa;
  border-radius: 0 0 8px 8px;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
}

/* 组件特定的按钮样式覆盖 */
.script-actions .btn {
  font-size: 0.8rem;
}
</style>

