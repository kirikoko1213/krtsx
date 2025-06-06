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
</style> 