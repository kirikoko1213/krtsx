<template>
  <div class="dialog-overlay" @click="$emit('close')">
    <div class="dialog" @click.stop>
      <div class="dialog-header">
        <h3>{{ editingScript ? '编辑脚本' : '添加脚本' }}</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="dialog-content">
        <form @submit.prevent="saveScript">
          <div class="form-group">
            <label>脚本名称</label>
            <input
              v-model="scriptForm.name"
              type="text"
              required
              placeholder="输入脚本名称"
            />
          </div>

          <div class="form-group">
            <label>类型</label>
            <div class="radio-group">
              <label class="radio-label">
                <input
                  v-model="scriptForm.type"
                  type="radio"
                  value="file"
                />
                文件路径
              </label>
              <label class="radio-label">
                <input
                  v-model="scriptForm.type"
                  type="radio"
                  value="command"
                />
                执行命令
              </label>
            </div>
          </div>

          <div v-if="scriptForm.type === 'file'" class="form-group">
            <label>文件路径</label>
            <div class="file-input-group">
              <input
                v-model="scriptForm.path"
                type="text"
                placeholder="选择脚本文件"
                readonly
              />
              <button type="button" class="btn btn-secondary" @click="selectFile">
                浏览
              </button>
            </div>
          </div>

          <div v-if="scriptForm.type === 'command'" class="form-group">
            <label>执行命令</label>
            <input
              v-model="scriptForm.command"
              type="text"
              placeholder="例如: python script.py 或 node app.js --dev"
            />
          </div>

          <div class="form-group">
            <label>定时执行 (Cron 表达式)</label>
            <input
              v-model="scriptForm.cronExpression"
              type="text"
              placeholder="例如: 0 */5 * * * (每5分钟) 或留空不定时执行"
            />
            <small class="form-help">
              格式：秒 分 时 日 月 周 | 
              <a href="#" @click.prevent="showCronHelp = !showCronHelp">查看说明</a>
            </small>
            <div v-if="showCronHelp" class="cron-help">
              <p>常用示例：</p>
              <ul>
                <li>0 */5 * * * * - 每5分钟执行</li>
                <li>0 0 */1 * * * - 每小时执行</li>
                <li>0 0 9 * * * - 每天9点执行</li>
                <li>0 0 9 * * 1-5 - 工作日9点执行</li>
              </ul>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="scriptForm.enabled"
                type="checkbox"
              />
              启用脚本
            </label>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">
              取消
            </button>
            <button type="submit" class="btn btn-primary">
              {{ editingScript ? '更新' : '添加' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'

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

const props = defineProps<{
  editingScript?: ScriptConfig | null
}>()

const emit = defineEmits<{
  close: []
  save: []
}>()

const showCronHelp = ref(false)

const scriptForm = reactive({
  name: '',
  type: 'file' as 'file' | 'command',
  path: '',
  command: '',
  cronExpression: '',
  enabled: true
})

// 监听编辑脚本变化，填充表单
watch(
  () => props.editingScript,
  (script) => {
    if (script) {
      Object.assign(scriptForm, {
        name: script.name,
        type: script.type,
        path: script.path || '',
        command: script.command || '',
        cronExpression: script.cronExpression || '',
        enabled: script.enabled
      })
    } else {
      // 重置表单
      Object.assign(scriptForm, {
        name: '',
        type: 'file' as 'file' | 'command',
        path: '',
        command: '',
        cronExpression: '',
        enabled: true
      })
    }
  },
  { immediate: true }
)

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 选择文件
async function selectFile() {
  const result = await window.electronAPI.selectFile()
  if (!result.canceled && result.filePaths.length > 0) {
    scriptForm.path = result.filePaths[0]
  }
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
    id: props.editingScript?.id || generateId(),
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
      emit('save')
    } else {
      alert('保存失败: ' + result.error)
    }
  } catch (error) {
    alert('保存失败: ' + error)
  }
}
</script>

<style scoped>
/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog {
  background: var(--color-surface-light);
  border-radius: 16px;
  width: 90%;
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px var(--color-shadow), 0 8px 32px var(--color-shadow-light);
  border: 1px solid var(--color-border-light);
  animation: slideUp 0.3s ease;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 16px 16px 0 0;
  position: relative;
}

.dialog-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: 16px 16px 0 0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dialog-header h3::before {
  content: '⚙️';
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 0.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  font-weight: 300;
}

.close-btn:hover {
  background: var(--color-surface);
  color: var(--color-text-primary);
  transform: scale(1.1);
}

.dialog-content {
  padding: 1.5rem;
  background: var(--color-surface-light);
}

.form-group {
  margin-bottom: 1.5rem;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
  letter-spacing: 0.025em;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--color-surface);
  color: var(--color-text-primary);
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input[type="text"]:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
  background: var(--color-surface-light);
  transform: translateY(-1px);
}

.form-group input[type="text"]::placeholder {
  color: var(--color-text-muted);
  opacity: 0.8;
}

.radio-group {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.radio-label {
  font-weight: normal !important;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  transition: all 0.3s ease;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  flex: 1;
  justify-content: center;
}

.radio-label:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-text-primary);
  transform: translateY(-1px);
}

.radio-label:has(input:checked) {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
  box-shadow: 0 4px 12px var(--color-shadow);
}

.radio-label input[type="radio"] {
  accent-color: var(--color-primary);
}

.checkbox-label {
  font-weight: normal !important;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.875rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  transition: all 0.3s ease;
  background: var(--color-surface);
  color: var(--color-text-secondary);
}

.checkbox-label:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-text-primary);
}

.checkbox-label:has(input:checked) {
  border-color: var(--color-success);
  background: var(--color-success);
  color: white;
}

.checkbox-label input[type="checkbox"] {
  accent-color: var(--color-success);
  transform: scale(1.2);
}

.file-input-group {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.file-input-group input {
  flex: 1;
}

.file-input-group .btn {
  flex-shrink: 0;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.file-input-group .btn::before {
  content: '📁';
  font-size: 0.9rem;
}

.form-help {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 0.5rem;
  line-height: 1.4;
}

.form-help a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.form-help a:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

.cron-help {
  margin-top: 0.75rem;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-info);
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  box-shadow: 0 2px 8px var(--color-shadow-light);
}

.cron-help p {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: var(--color-text-primary);
}

.cron-help ul {
  margin: 0.5rem 0 0 1rem;
  list-style: none;
  padding: 0;
}

.cron-help li {
  margin-bottom: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-surface-light);
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  border-left: 3px solid var(--color-primary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: 0.875rem 1.5rem;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 100px;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn:hover::before {
  left: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  border-color: var(--color-primary);
  color: white;
  box-shadow: 0 4px 12px var(--color-shadow);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--color-shadow);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px var(--color-shadow);
}

.btn-secondary {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

.btn-secondary:hover {
  background: var(--color-surface-light);
  border-color: var(--color-primary);
  color: var(--color-text-primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--color-shadow-light);
}
</style> 