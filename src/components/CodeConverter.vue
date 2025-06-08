<template>
  <div class="code-converter">
    <div class="converter-toolbar">
      <h2>🔧 转码工具</h2>
      <div class="tool-tabs">
        <button
          v-for="tool in tools"
          :key="tool.id"
          :class="['tool-tab', { active: currentTool === tool.id }]"
          @click="currentTool = tool.id"
        >
          {{ tool.icon }} {{ tool.label }}
        </button>
      </div>
    </div>

    <div class="converter-content">
      <!-- Base64 转换 -->
      <div v-if="currentTool === 'base64'" class="tool-panel">
        <div class="tool-header">
          <h3>🔤 Base64 编码/解码</h3>
          <div class="tool-actions">
            <button class="btn btn-sm btn-secondary" @click="clearBase64">清空</button>
            <button class="btn btn-sm btn-secondary" @click="swapBase64">交换</button>
          </div>
        </div>
        
        <div class="conversion-area">
          <div class="input-section">
            <label>原文</label>
            <textarea
              v-model="base64Input"
              placeholder="输入要编码的文本..."
              class="converter-textarea"
              @input="encodeBase64"
            ></textarea>
            <div class="text-info">长度: {{ base64Input.length }}</div>
          </div>
          
          <div class="conversion-arrows">
            <button class="btn btn-primary" @click="encodeBase64">
              <span>⬇️</span> 编码
            </button>
            <button class="btn btn-primary" @click="decodeBase64">
              <span>⬆️</span> 解码
            </button>
          </div>
          
          <div class="output-section">
            <label>Base64</label>
            <textarea
              v-model="base64Output"
              placeholder="Base64 编码结果..."
              class="converter-textarea"
              @input="decodeBase64"
            ></textarea>
            <div class="text-info">长度: {{ base64Output.length }}</div>
          </div>
        </div>
      </div>

      <!-- MD5 转换 -->
      <div v-if="currentTool === 'md5'" class="tool-panel">
        <div class="tool-header">
          <h3>🔐 MD5 加密</h3>
          <div class="tool-actions">
            <button class="btn btn-sm btn-secondary" @click="clearMd5">清空</button>
          </div>
        </div>
        
        <div class="md5-area">
          <div class="input-section">
            <label>原文</label>
            <textarea
              v-model="md5Input"
              placeholder="输入要加密的文本..."
              class="converter-textarea"
            ></textarea>
            
            <div class="salt-section">
              <label>Salt (可选)</label>
              <input
                v-model="md5Salt"
                type="text"
                placeholder="输入Salt值..."
                class="salt-input"
              />
            </div>
            
            <button class="btn btn-primary full-width" @click="generateMd5">
              🔐 生成 MD5
            </button>
          </div>
          
          <div class="output-section">
            <label>MD5 值</label>
            <div class="md5-result">
              <input
                v-model="md5Output"
                type="text"
                placeholder="MD5 加密结果..."
                class="md5-input"
                readonly
              />
              <button v-if="md5Output" class="btn btn-sm btn-secondary" @click="copyToClipboard(md5Output)">
                📋 复制
              </button>
            </div>
          </div>
          
          <div class="guess-section">
            <label>MD5 猜测</label>
            <div class="guess-input-area">
              <input
                v-model="md5GuessInput"
                type="text"
                placeholder="输入MD5值进行猜测..."
                class="guess-input"
              />
              <button class="btn btn-primary" @click="guessMd5">
                🔍 猜测
              </button>
            </div>
            
            <div v-if="md5GuessResult" class="guess-result">
              <div class="guess-success">
                <strong>找到原文:</strong> {{ md5GuessResult.original }}
                <span v-if="md5GuessResult.salt" class="salt-info">
                  (Salt: {{ md5GuessResult.salt }})
                </span>
              </div>
            </div>
            
            <div v-if="md5GuessError" class="guess-error">
              {{ md5GuessError }}
            </div>
          </div>
        </div>
      </div>

      <!-- JSON 格式化 -->
      <div v-if="currentTool === 'json'" class="tool-panel">
        <div class="tool-header">
          <h3>📋 JSON 格式化</h3>
          <div class="tool-actions">
            <button class="btn btn-sm btn-secondary" @click="clearJson">清空</button>
            <button class="btn btn-sm btn-secondary" @click="compressJson">压缩</button>
            <button class="btn btn-sm btn-primary" @click="formatJson">格式化</button>
          </div>
        </div>
        
        <div class="json-area">
          <div class="input-section">
            <label>JSON 输入</label>
            <textarea
              v-model="jsonInput"
              placeholder="输入JSON字符串..."
              class="json-textarea"
            ></textarea>
            <div class="text-info">
              长度: {{ jsonInput.length }} 
              <span v-if="jsonValidation.isValid" class="valid">✅ 有效</span>
              <span v-else-if="jsonInput.length > 0" class="invalid">❌ 无效</span>
            </div>
          </div>
          
          <div class="output-section">
            <label>格式化结果</label>
            <div class="json-output-container">
              <pre v-if="jsonOutput" class="json-output" v-html="jsonOutput"></pre>
              <div v-else class="json-placeholder">格式化后的JSON将显示在这里...</div>
            </div>
            <div v-if="jsonValidation.error" class="json-error">
              错误: {{ jsonValidation.error }}
            </div>
          </div>
        </div>
      </div>

      <!-- URL 编码 -->
      <div v-if="currentTool === 'url'" class="tool-panel">
        <div class="tool-header">
          <h3>🌐 URL 编码/解码</h3>
          <div class="tool-actions">
            <button class="btn btn-sm btn-secondary" @click="clearUrl">清空</button>
            <button class="btn btn-sm btn-secondary" @click="swapUrl">交换</button>
          </div>
        </div>
        
        <div class="conversion-area">
          <div class="input-section">
            <label>原文</label>
            <textarea
              v-model="urlInput"
              placeholder="输入要编码的URL或文本..."
              class="converter-textarea"
              @input="encodeUrl"
            ></textarea>
          </div>
          
          <div class="conversion-arrows">
            <button class="btn btn-primary" @click="encodeUrl">
              <span>⬇️</span> 编码
            </button>
            <button class="btn btn-primary" @click="decodeUrl">
              <span>⬆️</span> 解码
            </button>
          </div>
          
          <div class="output-section">
            <label>URL编码</label>
            <textarea
              v-model="urlOutput"
              placeholder="URL编码结果..."
              class="converter-textarea"
              @input="decodeUrl"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- HTML 实体 -->
      <div v-if="currentTool === 'html'" class="tool-panel">
        <div class="tool-header">
          <h3>🏷️ HTML 实体编码/解码</h3>
          <div class="tool-actions">
            <button class="btn btn-sm btn-secondary" @click="clearHtml">清空</button>
            <button class="btn btn-sm btn-secondary" @click="swapHtml">交换</button>
          </div>
        </div>
        
        <div class="conversion-area">
          <div class="input-section">
            <label>原文</label>
            <textarea
              v-model="htmlInput"
              placeholder="输入HTML文本..."
              class="converter-textarea"
              @input="encodeHtml"
            ></textarea>
          </div>
          
          <div class="conversion-arrows">
            <button class="btn btn-primary" @click="encodeHtml">
              <span>⬇️</span> 编码
            </button>
            <button class="btn btn-primary" @click="decodeHtml">
              <span>⬆️</span> 解码
            </button>
          </div>
          
          <div class="output-section">
            <label>HTML实体</label>
            <textarea
              v-model="htmlOutput"
              placeholder="HTML实体编码结果..."
              class="converter-textarea"
              @input="decodeHtml"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

const currentTool = ref('base64')

const tools = [
  { id: 'base64', label: 'Base64', icon: '🔤' },
  { id: 'md5', label: 'MD5', icon: '🔐' },
  { id: 'json', label: 'JSON', icon: '📋' },
  { id: 'url', label: 'URL', icon: '🌐' },
  { id: 'html', label: 'HTML', icon: '🏷️' }
]

// Base64 相关
const base64Input = ref('')
const base64Output = ref('')

// MD5 相关
const md5Input = ref('')
const md5Salt = ref('')
const md5Output = ref('')
const md5GuessInput = ref('')
const md5GuessResult = ref<{ original: string; salt?: string } | null>(null)
const md5GuessError = ref('')

// JSON 相关
const jsonInput = ref('')
const jsonOutput = ref('')
const jsonValidation = reactive({
  isValid: false,
  error: ''
})

// URL 相关
const urlInput = ref('')
const urlOutput = ref('')

// HTML 相关
const htmlInput = ref('')
const htmlOutput = ref('')

// Base64 操作
async function encodeBase64() {
  if (!base64Input.value) {
    base64Output.value = ''
    return
  }
  
  try {
    const result = await window.electronAPI.base64Encode(base64Input.value)
    if (result.success) {
      base64Output.value = result.data || ""
    }
  } catch (error) {
    console.error('Base64编码失败:', error)
  }
}

async function decodeBase64() {
  if (!base64Output.value) {
    return
  }
  
  try {
    const result = await window.electronAPI.base64Decode(base64Output.value)
    if (result.success) {
      base64Input.value = result.data || ""
    }
  } catch (error) {
    console.error('Base64解码失败:', error)
  }
}

function clearBase64() {
  base64Input.value = ''
  base64Output.value = ''
}

function swapBase64() {
  const temp = base64Input.value
  base64Input.value = base64Output.value
  base64Output.value = temp
}

// MD5 操作
async function generateMd5() {
  if (!md5Input.value) return
  
  try {
    const result = await window.electronAPI.md5Hash(md5Input.value, md5Salt.value || undefined)
    if (result.success) {
      md5Output.value = result.data || ""
    }
  } catch (error) {
    console.error('MD5生成失败:', error)
  }
}

async function guessMd5() {
  if (!md5GuessInput.value) return
  
  md5GuessResult.value = null
  md5GuessError.value = ''
  
  try {
    const result = await window.electronAPI.md5Guess(md5GuessInput.value)
    if (result.success) {
      md5GuessResult.value = result.data || { original: "", salt: "" }
    } else {
      md5GuessError.value = result.error || ""
    }
  } catch (error) {
    md5GuessError.value = '猜测失败'
    console.error('MD5猜测失败:', error)
  }
}

function clearMd5() {
  md5Input.value = ''
  md5Salt.value = ''
  md5Output.value = ''
  md5GuessInput.value = ''
  md5GuessResult.value = null
  md5GuessError.value = ''
}

// JSON 操作
function validateJson(jsonStr: string) {
  try {
    if (!jsonStr.trim()) {
      jsonValidation.isValid = false
      jsonValidation.error = ''
      return null
    }
    
    const parsed = JSON.parse(jsonStr)
    jsonValidation.isValid = true
    jsonValidation.error = ''
    return parsed
  } catch (error: any) {
    jsonValidation.isValid = false
    jsonValidation.error = error.message
    return null
  }
}

function formatJson() {
  const parsed = validateJson(jsonInput.value)
  if (parsed !== null) {
    const formatted = JSON.stringify(parsed, null, 2)
    jsonOutput.value = syntaxHighlight(formatted)
  } else {
    jsonOutput.value = ''
  }
}

function compressJson() {
  const parsed = validateJson(jsonInput.value)
  if (parsed !== null) {
    jsonOutput.value = JSON.stringify(parsed)
  }
}

function syntaxHighlight(json: string) {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      var cls = 'json-number'
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key'
        } else {
          cls = 'json-string'
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean'
      } else if (/null/.test(match)) {
        cls = 'json-null'
      }
      return '<span class="' + cls + '">' + match + '</span>'
    })
}

function clearJson() {
  jsonInput.value = ''
  jsonOutput.value = ''
  jsonValidation.isValid = false
  jsonValidation.error = ''
}

// URL 操作
async function encodeUrl() {
  if (!urlInput.value) {
    urlOutput.value = ''
    return
  }
  
  try {
    const result = await window.electronAPI.urlEncode(urlInput.value)
    if (result.success) {
      urlOutput.value = result.data || ""
    }
  } catch (error) {
    console.error('URL编码失败:', error)
  }
}

async function decodeUrl() {
  if (!urlOutput.value) return
  
  try {
    const result = await window.electronAPI.urlDecode(urlOutput.value)
    if (result.success) {
      urlInput.value = result.data || ""
    }
  } catch (error) {
    console.error('URL解码失败:', error)
  }
}

function clearUrl() {
  urlInput.value = ''
  urlOutput.value = ''
}

function swapUrl() {
  const temp = urlInput.value
  urlInput.value = urlOutput.value
  urlOutput.value = temp
}

// HTML 操作
async function encodeHtml() {
  if (!htmlInput.value) {
    htmlOutput.value = ''
    return
  }
  
  try {
    const result = await window.electronAPI.htmlEncode(htmlInput.value)
    if (result.success) {
      htmlOutput.value = result.data || ""
    }
  } catch (error) {
    console.error('HTML编码失败:', error)
  }
}

async function decodeHtml() {
  if (!htmlOutput.value) return
  
  try {
    const result = await window.electronAPI.htmlDecode(htmlOutput.value)
    if (result.success) {
      htmlInput.value = result.data || ""
    }
  } catch (error) {
    console.error('HTML解码失败:', error)
  }
}

function clearHtml() {
  htmlInput.value = ''
  htmlOutput.value = ''
}

function swapHtml() {
  const temp = htmlInput.value
  htmlInput.value = htmlOutput.value
  htmlOutput.value = temp
}

// 复制到剪贴板
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    // 这里可以添加成功提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 监听JSON输入变化
watch(jsonInput, (newValue) => {
  validateJson(newValue)
})
</script>

<style scoped>
.code-converter {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
}

.converter-toolbar {
  background: var(--color-surface-light);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px var(--color-shadow-light);
}

.converter-toolbar h2 {
  font-size: 1.5rem;
  color: var(--color-text-primary);
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.tool-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tool-tab {
  padding: 0.75rem 1.25rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.tool-tab:hover {
  background: var(--color-surface-light);
  border-color: var(--color-primary);
  color: var(--color-text-primary);
  transform: translateY(-1px);
}

.tool-tab.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  box-shadow: 0 4px 12px var(--color-shadow);
}

.converter-content {
  flex: 1;
  overflow: auto;
}

.tool-panel {
  background: var(--color-surface-light);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px var(--color-shadow-light);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-light);
}

.tool-header h3 {
  font-size: 1.25rem;
  color: var(--color-text-primary);
  margin: 0;
  font-weight: 600;
}

.tool-actions {
  display: flex;
  gap: 0.5rem;
}

.conversion-area {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  align-items: start;
  flex: 1;
}

.conversion-arrows {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-self: center;
}

.input-section,
.output-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.input-section label,
.output-section label {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.converter-textarea {
  flex: 1;
  min-height: 200px;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.3s ease;
}

.converter-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.text-info {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.valid {
  color: #10b981;
}

.invalid {
  color: #ef4444;
}

/* MD5 样式 */
.md5-area {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
}

.salt-section {
  margin-top: 1rem;
}

.salt-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.salt-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.md5-result {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.md5-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
}

.guess-section {
  border-top: 1px solid var(--color-border-light);
  padding-top: 1.5rem;
}

.guess-input-area {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.guess-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
}

.guess-result {
  padding: 1rem;
  background: var(--color-success-light);
  border: 1px solid var(--color-success);
  border-radius: 8px;
  color: var(--color-success-dark);
}

.guess-error {
  padding: 1rem;
  background: var(--color-error-light);
  border: 1px solid var(--color-error);
  border-radius: 8px;
  color: var(--color-error-dark);
}

.salt-info {
  font-size: 0.8rem;
  opacity: 0.8;
}

/* JSON 样式 */
.json-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  flex: 1;
}

.json-textarea {
  min-height: 300px;
}

.json-output-container {
  flex: 1;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  overflow: auto;
  min-height: 300px;
}

.json-output {
  padding: 1rem;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.json-placeholder {
  padding: 1rem;
  color: var(--color-text-secondary);
  font-style: italic;
  text-align: center;
  margin-top: 2rem;
}

.json-error {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--color-error-light);
  border: 1px solid var(--color-error);
  border-radius: 8px;
  color: var(--color-error-dark);
  font-size: 0.8rem;
}

/* JSON语法高亮 */
:deep(.json-key) {
  color: #8b5cf6;
  font-weight: 600;
}

:deep(.json-string) {
  color: #10b981;
}

:deep(.json-number) {
  color: #f59e0b;
}

:deep(.json-boolean) {
  color: #3b82f6;
  font-weight: 600;
}

:deep(.json-null) {
  color: #6b7280;
  font-style: italic;
}

/* 按钮样式 */
.btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.btn:hover {
  background: var(--color-surface-light);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.btn-primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.btn-secondary {
  background: var(--color-text-secondary);
  border-color: var(--color-text-secondary);
  color: white;
}

.btn-secondary:hover {
  background: var(--color-text-primary);
  border-color: var(--color-text-primary);
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}

.full-width {
  width: 100%;
  margin-top: 1rem;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .conversion-area {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .conversion-arrows {
    flex-direction: row;
    justify-content: center;
  }
  
  .json-area {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .tool-tabs {
    gap: 0.25rem;
  }
  
  .tool-tab {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
  
  .converter-textarea,
  .json-output-container {
    min-height: 200px;
  }
}
</style> 