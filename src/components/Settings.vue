<template>
  <div class="settings">
    <div class="settings-header">
      <h2>⚙️ 应用设置</h2>
      <p class="settings-description">个性化你的应用体验</p>
    </div>

    <!-- 设置页面Tab导航 -->
    <div class="settings-tabs">
      <button
        v-for="tab in settingsTabs"
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-text">{{ tab.name }}</span>
      </button>
    </div>

    <div class="settings-content">
      <!-- 背景设置面板 -->
      <div v-show="activeTab === 'background'" class="setting-panel">
        <div class="panel-header">
          <h3>🖼️ 背景设置</h3>
          <div class="panel-actions">
            <button class="btn btn-sm btn-secondary" @click="resetBackground">重置默认</button>
            <button class="btn btn-sm btn-primary" @click="previewBackground">
              {{ isPreview ? '取消预览' : '预览效果' }}
            </button>
          </div>
        </div>

        <div class="setting-grid">
          <!-- 背景图片上传 -->
          <div class="setting-item">
            <label class="setting-label">背景图片</label>
            <div class="image-upload-area">
              <div
                v-if="!backgroundSettings.image"
                class="upload-placeholder"
                @click="selectBackgroundImage"
              >
                <div class="upload-icon">📁</div>
                <p>点击选择背景图片</p>
                <p class="upload-hint">支持 JPG、PNG、GIF 等格式</p>
              </div>

              <div v-else class="uploaded-image">
                <img :src="backgroundPreviewUrl" alt="背景图片" class="image-preview" />
                <div class="image-overlay">
                  <button class="btn btn-sm btn-secondary" @click="selectBackgroundImage">
                    更换图片
                  </button>
                  <button class="btn btn-sm btn-danger" @click="removeBackgroundImage">
                    移除图片
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 透明度设置 -->
          <div class="setting-item">
            <label class="setting-label">
              透明度: {{ Math.round(backgroundSettings.opacity * 100) }}%
            </label>
            <div class="slider-container">
              <input
                v-model.number="backgroundSettings.opacity"
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                class="slider"
              />
              <div class="slider-labels">
                <span>10%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <!-- 模糊程度 -->
          <div class="setting-item">
            <label class="setting-label"> 模糊程度: {{ backgroundSettings.blur }}px </label>
            <div class="slider-container">
              <input
                v-model.number="backgroundSettings.blur"
                type="range"
                min="0"
                max="20"
                step="1"
                class="slider"
              />
              <div class="slider-labels">
                <span>清晰</span>
                <span>模糊</span>
              </div>
            </div>
          </div>

          <!-- 背景尺寸 -->
          <div class="setting-item">
            <label class="setting-label">背景尺寸</label>
            <select v-model="backgroundSettings.size" class="setting-select">
              <option value="cover">覆盖 (Cover)</option>
              <option value="contain">包含 (Contain)</option>
              <option value="100% 100%">拉伸 (Stretch)</option>
              <option value="auto">原始尺寸</option>
            </select>
          </div>

          <!-- 背景位置 -->
          <div class="setting-item">
            <label class="setting-label">背景位置</label>
            <select v-model="backgroundSettings.position" class="setting-select">
              <option value="center center">居中</option>
              <option value="center top">顶部居中</option>
              <option value="center bottom">底部居中</option>
              <option value="left center">左侧居中</option>
              <option value="right center">右侧居中</option>
              <option value="left top">左上角</option>
              <option value="right top">右上角</option>
              <option value="left bottom">左下角</option>
              <option value="right bottom">右下角</option>
            </select>
          </div>

          <!-- 背景重复 -->
          <div class="setting-item">
            <label class="setting-label">背景重复</label>
            <select v-model="backgroundSettings.repeat" class="setting-select">
              <option value="no-repeat">不重复</option>
              <option value="repeat">重复</option>
              <option value="repeat-x">水平重复</option>
              <option value="repeat-y">垂直重复</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 天气设置面板 -->
      <div v-show="activeTab === 'weather'" class="setting-panel">
        <div class="panel-header">
          <h3>🌤️ 天气设置</h3>
        </div>

        <div class="setting-grid">
          <!-- 天气API Key -->
          <div class="setting-item full-width">
            <label class="setting-label">聚合数据天气API Key</label>
            <div class="input-with-help">
              <input
                v-model="weatherSettings.apiKey"
                type="text"
                placeholder="请输入聚合数据的天气API Key"
                class="form-input"
              />
              <div class="input-help">
                <p>📍 <strong>获取步骤:</strong></p>
                <ol>
                  <li>访问 <a href="https://www.juhe.cn/" target="_blank">聚合数据官网</a></li>
                  <li>注册账号并登录</li>
                  <li>搜索"简易天气"接口</li>
                  <li>申请接口获取App Key</li>
                  <li>将App Key填入上方输入框</li>
                </ol>
                <p class="note">💡 每天有免费调用次数，通常足够个人使用</p>
              </div>
            </div>
          </div>

          <!-- 默认城市 -->
          <div class="setting-item">
            <label class="setting-label">默认城市</label>
            <input
              v-model="weatherSettings.defaultCity"
              type="text"
              placeholder="输入城市名称"
              class="form-input"
            />
          </div>

          <!-- 测试按钮 -->
          <div class="setting-item">
            <label class="setting-label">连接测试</label>
            <button
              class="btn btn-primary"
              @click="testWeatherAPI"
              :disabled="!weatherSettings.apiKey"
            >
              测试天气API
            </button>
          </div>
        </div>
      </div>

      <!-- 执行设置面板 -->
      <div v-show="activeTab === 'execution'" class="setting-panel">
        <div class="panel-header">
          <h3>⚡ 执行设置</h3>
          <p class="panel-description">配置脚本执行环境</p>
        </div>

        <div class="setting-grid">
          <!-- Shell 选择 -->
          <div class="setting-item">
            <label class="setting-label">首选 Shell</label>
            <select v-model="executionSettings.preferredShell" class="setting-select">
              <option value="auto">自动检测 (推荐)</option>
              <option value="zsh">Zsh Shell</option>
              <option value="bash">Bash Shell</option>
              <option value="sh">Sh Shell</option>
              <option value="custom">自定义路径</option>
            </select>
            <div class="setting-help">
              <p><strong>自动检测</strong>：根据系统自动选择最佳 Shell</p>
              <p><strong>Zsh</strong>：支持 ~/.zshrc 配置文件</p>
              <p><strong>Bash</strong>：支持 ~/.bashrc 配置文件</p>
              <p><strong>Sh</strong>：标准 Shell，兼容性最好</p>
            </div>
          </div>

          <!-- 自定义 Shell 路径 -->
          <div v-if="executionSettings.preferredShell === 'custom'" class="setting-item">
            <label class="setting-label">自定义 Shell 路径</label>
            <input
              v-model="executionSettings.customShellPath"
              type="text"
              placeholder="例如: /usr/local/bin/fish"
              class="form-input"
            />
            <div class="setting-help">
              <p>请输入完整的 Shell 可执行文件路径</p>
            </div>
          </div>

          <!-- Shell 信息显示 -->
          <div class="setting-item full-width">
            <label class="setting-label">当前 Shell 信息</label>
            <div class="shell-info-card">
              <div class="info-row">
                <span class="info-label">系统默认 Shell:</span>
                <span class="info-value">{{ systemShellInfo.default }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">当前用户 Shell:</span>
                <span class="info-value">{{ systemShellInfo.current }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">可用 Shell:</span>
                <div class="available-shells">
                  <span v-for="shell in systemShellInfo.available" :key="shell" class="shell-tag">
                    {{ shell }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 环境变量加载 -->
          <div class="setting-item">
            <label class="setting-label">环境变量加载</label>
            <div class="toggle-container">
              <input
                v-model="executionSettings.loadShellConfig"
                type="checkbox"
                class="toggle-input"
                id="loadShellConfig"
              />
              <label for="loadShellConfig" class="toggle-label">
                <span class="toggle-switch"></span>
                <span class="toggle-text">{{
                  executionSettings.loadShellConfig ? '自动加载' : '不加载'
                }}</span>
              </label>
            </div>
            <div class="setting-help">
              <p>开启后将自动加载 ~/.zshrc, ~/.bashrc 等配置文件中的环境变量</p>
            </div>
          </div>

          <!-- 测试按钮 -->
          <div class="setting-item">
            <label class="setting-label">Shell 测试</label>
            <button class="btn btn-primary" @click="testShellConfig">测试 Shell 配置</button>
          </div>
        </div>
      </div>

      <!-- 界面设置面板 -->
      <div v-show="activeTab === 'ui'" class="setting-panel">
        <div class="panel-header">
          <h3>🎨 界面设置</h3>
        </div>

        <div class="setting-grid">
          <!-- 动画效果 -->
          <div class="setting-item">
            <label class="setting-label">动画效果</label>
            <div class="toggle-container">
              <input
                v-model="uiSettings.animations"
                type="checkbox"
                class="toggle-input"
                id="animations"
              />
              <label for="animations" class="toggle-label">
                <span class="toggle-switch"></span>
                <span class="toggle-text">{{ uiSettings.animations ? '开启' : '关闭' }}</span>
              </label>
            </div>
          </div>

          <!-- 阴影效果 -->
          <div class="setting-item">
            <label class="setting-label">阴影效果</label>
            <div class="toggle-container">
              <input
                v-model="uiSettings.shadows"
                type="checkbox"
                class="toggle-input"
                id="shadows"
              />
              <label for="shadows" class="toggle-label">
                <span class="toggle-switch"></span>
                <span class="toggle-text">{{ uiSettings.shadows ? '开启' : '关闭' }}</span>
              </label>
            </div>
          </div>

          <!-- 圆角大小 -->
          <div class="setting-item">
            <label class="setting-label"> 圆角大小: {{ uiSettings.borderRadius }}px </label>
            <div class="slider-container">
              <input
                v-model.number="uiSettings.borderRadius"
                type="range"
                min="0"
                max="20"
                step="2"
                class="slider"
              />
              <div class="slider-labels">
                <span>直角</span>
                <span>圆角</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 保存设置 -->
      <div class="settings-actions">
        <button class="btn btn-primary btn-large" @click="saveSettings">💾 保存设置</button>
        <button class="btn btn-secondary btn-large" @click="loadSettings">🔄 重新加载</button>
      </div>
    </div>

    <!-- 成功提示 -->
    <div v-if="showSaveSuccess" class="save-notification">✅ 设置已保存</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, nextTick } from 'vue'

// 定义设置数据结构
interface BackgroundSettings {
  image?: string
  opacity: number
  blur: number
  size: string
  position: string
  repeat: string
}

interface UISettings {
  animations: boolean
  shadows: boolean
  borderRadius: number
}

// 响应式数据
const backgroundSettings = reactive<BackgroundSettings>({
  opacity: 0.3,
  blur: 0,
  size: 'cover',
  position: 'center center',
  repeat: 'no-repeat',
})

const uiSettings = reactive<UISettings>({
  animations: true,
  shadows: true,
  borderRadius: 8,
})

const backgroundPreviewUrl = ref('')
const isPreview = ref(false)
const showSaveSuccess = ref(false)

// Tab 管理
const activeTab = ref('background')
const settingsTabs = [
  { id: 'background', name: '背景设置', icon: '🖼️' },
  { id: 'weather', name: '天气设置', icon: '🌤️' },
  { id: 'execution', name: '执行设置', icon: '⚡' },
  { id: 'ui', name: '界面设置', icon: '🎨' },
]

// 天气设置
const weatherSettings = reactive({
  apiKey: '',
  defaultCity: '北京',
})

// 执行设置
const executionSettings = reactive({
  preferredShell: 'auto', // auto, zsh, bash, sh
  customShellPath: '',
  loadShellConfig: true, // 是否加载 shell 配置文件
})

// 系统 Shell 信息
const systemShellInfo = reactive({
  default: '',
  current: '',
  available: [] as string[],
})

// 生命周期
onMounted(() => {
  loadSettings()
  loadSystemShellInfo()
})

// 监听设置变化，实时应用效果
watch(
  () => ({ ...backgroundSettings, ...uiSettings }),
  () => {
    if (isPreview.value) {
      applyBackgroundSettings()
    }
  },
  { deep: true }
)

// 选择背景图片
async function selectBackgroundImage() {
  try {
    const result = await window.electronAPI.selectBackgroundImage()

    if (!result.canceled && result.filePaths.length > 0) {
      const sourcePath = result.filePaths[0]

      // 保存图片到应用数据目录
      const saveResult = await window.electronAPI.saveBackgroundImage(sourcePath)

      if (saveResult.success) {
        backgroundSettings.image = saveResult.data
        await updateBackgroundPreview()
      }
    }
  } catch (error) {
    console.error('选择背景图片失败:', error)
  }
}

// 移除背景图片
async function removeBackgroundImage() {
  try {
    if (backgroundSettings.image) {
      await window.electronAPI.deleteBackgroundImage(backgroundSettings.image)
      backgroundSettings.image = undefined
      backgroundPreviewUrl.value = ''
      applyBackgroundSettings()
    }
  } catch (error) {
    console.error('移除背景图片失败:', error)
  }
}

// 更新背景预览
async function updateBackgroundPreview() {
  if (backgroundSettings.image) {
    try {
      const result = await window.electronAPI.getBackgroundImageData(backgroundSettings.image)
      if (result.success) {
        backgroundPreviewUrl.value = result.data
      }
    } catch (error) {
      console.error('获取背景图片数据失败:', error)
    }
  }
}

// 预览背景效果
function previewBackground() {
  isPreview.value = !isPreview.value
  if (isPreview.value) {
    applyBackgroundSettings()
  } else {
    removeBackgroundSettings()
  }
}

// 应用背景设置
function applyBackgroundSettings() {
  const bodyElement = document.body
  if (!bodyElement) return

  if (backgroundSettings.image && backgroundPreviewUrl.value) {
    // 将背景应用到body元素
    bodyElement.style.backgroundImage = `url(${backgroundPreviewUrl.value})`
    bodyElement.style.backgroundSize = backgroundSettings.size
    bodyElement.style.backgroundPosition = backgroundSettings.position
    bodyElement.style.backgroundRepeat = backgroundSettings.repeat
    bodyElement.style.backgroundAttachment = 'fixed'

    // 添加覆盖层到body
    let overlay = document.querySelector('.background-overlay') as HTMLElement
    if (!overlay) {
      overlay = document.createElement('div')
      overlay.className = 'background-overlay'
      bodyElement.appendChild(overlay)
    }

    // 设置覆盖层样式
    overlay.style.position = 'fixed'
    overlay.style.top = '0'
    overlay.style.left = '0'
    overlay.style.right = '0'
    overlay.style.bottom = '0'
    overlay.style.zIndex = '-1'
    overlay.style.pointerEvents = 'none'
    overlay.style.background = `rgba(255, 255, 255, ${1 - backgroundSettings.opacity})`
    overlay.style.backdropFilter = `blur(${backgroundSettings.blur}px)`
    ;(overlay.style as any).webkitBackdropFilter = `blur(${backgroundSettings.blur}px)`

    // 让应用组件背景透明化
    makeComponentsTransparent()
  } else {
    removeBackgroundSettings()
  }
}

// 让组件背景透明化
function makeComponentsTransparent() {
  const appElement = document.querySelector('.app') as HTMLElement
  if (appElement) {
    appElement.style.background = 'transparent'
  }

  // 设置其他组件的背景透明度
  const style = document.createElement('style')
  style.id = 'background-transparency'
  style.textContent = `
    .app {
      background: transparent !important;
    }
    .app-header {
      background: rgba(255, 255, 255, 0.85) !important;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-bottom-color: rgba(224, 224, 224, 0.5) !important;
    }
    .settings,
    .dashboard,
    .script-manager {
      background: transparent !important;
    }
    .setting-panel,
    .card,
    .weather-card,
    .network-card,
    .system-card,
    .performance-card,
    .scripts-card,
    .actions-card {
      background: rgba(255, 255, 255, 0.85) !important;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-color: rgba(224, 224, 224, 0.5) !important;
    }
    .form-input,
    .setting-select {
      background: rgba(255, 255, 255, 0.9) !important;
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
    }
    .nav-tab {
      background: rgba(248, 249, 250, 0.85) !important;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    .nav-tab.active {
      background: rgba(33, 150, 243, 0.9) !important;
    }
    .btn {
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
    }
    .coming-soon {
      background: rgba(255, 255, 255, 0.8) !important;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
  `

  // 移除旧的样式
  const oldStyle = document.querySelector('#background-transparency')
  if (oldStyle) {
    oldStyle.remove()
  }

  document.head.appendChild(style)
}

// 移除背景设置
function removeBackgroundSettings() {
  const bodyElement = document.body
  if (bodyElement) {
    bodyElement.style.backgroundImage = ''
    bodyElement.style.backgroundSize = ''
    bodyElement.style.backgroundPosition = ''
    bodyElement.style.backgroundRepeat = ''
    bodyElement.style.backgroundAttachment = ''
  }

  const overlay = document.querySelector('.background-overlay')
  if (overlay) {
    overlay.remove()
  }

  // 移除透明度样式
  const transparencyStyle = document.querySelector('#background-transparency')
  if (transparencyStyle) {
    transparencyStyle.remove()
  }

  // 恢复应用背景
  const appElement = document.querySelector('.app') as HTMLElement
  if (appElement) {
    appElement.style.background = ''
  }
}

// 重置背景设置
function resetBackground() {
  backgroundSettings.image = undefined
  backgroundSettings.opacity = 0.3
  backgroundSettings.blur = 0
  backgroundSettings.size = 'cover'
  backgroundSettings.position = 'center center'
  backgroundSettings.repeat = 'no-repeat'
  backgroundPreviewUrl.value = ''
  removeBackgroundSettings()
}

// 测试天气API
async function testWeatherAPI() {
  if (!weatherSettings.apiKey) {
    alert('请先设置API Key')
    return
  }

  try {
    // 先保存当前设置以便测试
    await saveSettings()

    const result = await window.electronAPI.getWeather(weatherSettings.defaultCity)
    if (result.success) {
      alert(
        `天气API测试成功！\n城市: ${result.data.cityName}\n天气: ${result.data.weather}\n温度: ${result.data.temperature}°C`
      )
    } else {
      alert(`天气API测试失败: ${result.error}`)
    }
  } catch (error) {
    alert(`测试失败: ${error}`)
  }
}

// 加载系统 Shell 信息
async function loadSystemShellInfo() {
  try {
    const result = await window.electronAPI.getSystemShellInfo()
    if (result.success) {
      Object.assign(systemShellInfo, result.data)
    }
  } catch (error) {
    console.error('加载系统Shell信息失败:', error)
  }
}

// 测试 Shell 配置
async function testShellConfig() {
  try {
    // 先保存当前设置
    await saveSettings()

    const result = await window.electronAPI.testShellConfig()
    if (result.success) {
      alert(`Shell测试成功！\n${result.data.output}`)
    } else {
      alert(`Shell测试失败: ${result.error}`)
    }
  } catch (error) {
    alert(`测试失败: ${error}`)
  }
}

// 保存设置
async function saveSettings() {
  try {
    const settings = {
      background: { ...backgroundSettings },
      ui: { ...uiSettings },
      execution: { ...executionSettings },
      weatherApiKey: weatherSettings.apiKey,
      defaultCity: weatherSettings.defaultCity,
    }

    const result = await window.electronAPI.saveAppSettings(settings)

    if (result.success) {
      // 应用设置
      applyBackgroundSettings()

      // 显示保存成功提示
      showSaveSuccess.value = true
      setTimeout(() => {
        showSaveSuccess.value = false
      }, 2000)
    }
  } catch (error) {
    console.error('保存设置失败:', error)
  }
}

// 加载设置
async function loadSettings() {
  try {
    const result = await window.electronAPI.getAppSettings()

    if (result.success && result.data) {
      const settings = result.data

      // 加载背景设置
      if (settings.background) {
        Object.assign(backgroundSettings, settings.background)
        await updateBackgroundPreview()
      }

      // 加载UI设置
      if (settings.ui) {
        Object.assign(uiSettings, settings.ui)
      }

      // 加载执行设置
      if (settings.execution) {
        Object.assign(executionSettings, settings.execution)
      }

      // 加载天气设置
      if (settings.weatherApiKey) {
        weatherSettings.apiKey = settings.weatherApiKey
      }
      if (settings.defaultCity) {
        weatherSettings.defaultCity = settings.defaultCity
      }

      // 应用加载的设置
      await nextTick()
      applyBackgroundSettings()
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}
</script>

<style scoped>
.settings {
  height: 100%;
  padding: 2rem;
  background: var(--color-background);
  overflow-y: auto;
}

.settings-header {
  text-align: center;
  margin-bottom: 2rem;
}

.settings-header h2 {
  font-size: 2rem;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.settings-description {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
  margin: 0;
}

.settings-tabs {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1rem;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.tab-button:hover {
  background: var(--color-surface-light);
  color: var(--color-text-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--color-shadow-light);
}

.tab-button.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px var(--color-shadow);
}

.tab-icon {
  font-size: 1.1rem;
}

.tab-text {
  font-size: 0.9rem;
}

.settings-content {
  max-width: 800px;
  margin: 0 auto;
}

/* 天气设置专用样式 */
.full-width {
  grid-column: 1 / -1;
}

.input-with-help {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-help {
  background: var(--color-surface);
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid var(--color-info);
  font-size: 0.85rem;
  line-height: 1.5;
}

.input-help p {
  margin: 0 0 0.5rem 0;
  color: var(--color-text-primary);
}

.input-help ol {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
  color: var(--color-text-secondary);
}

.input-help li {
  margin-bottom: 0.25rem;
}

.input-help a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.input-help a:hover {
  text-decoration: underline;
}

.input-help .note {
  color: var(--color-text-muted);
  font-style: italic;
  margin-top: 0.5rem;
  margin-bottom: 0;
}

/* 设置面板 */
.setting-panel {
  background: var(--color-surface-light);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px var(--color-shadow-light);
  border: 1px solid var(--color-border);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-light);
}

.panel-header h3 {
  font-size: 1.25rem;
  color: var(--color-text-primary);
  margin: 0;
  font-weight: 600;
}

.panel-actions {
  display: flex;
  gap: 0.5rem;
}

/* 设置网格 */
.setting-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.setting-label {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

/* 图片上传区域 */
.image-upload-area {
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.upload-placeholder {
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-placeholder:hover {
  background: var(--color-surface);
  border-color: var(--color-primary);
}

.upload-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.upload-hint {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0.5rem 0 0;
}

.uploaded-image {
  position: relative;
  max-height: 200px;
}

.image-preview {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.uploaded-image:hover .image-overlay {
  opacity: 1;
}

/* 滑块样式 */
.slider-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--color-border);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 2px 6px var(--color-shadow);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px var(--color-shadow);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

/* 选择框样式 */
.setting-select {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.setting-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

/* 开关样式 */
.toggle-container {
  display: flex;
  align-items: center;
}

.toggle-input {
  display: none;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.toggle-switch {
  position: relative;
  width: 48px;
  height: 24px;
  background: var(--color-border);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px var(--color-shadow);
}

.toggle-input:checked + .toggle-label .toggle-switch {
  background: var(--color-primary);
}

.toggle-input:checked + .toggle-label .toggle-switch::after {
  transform: translateX(24px);
}

.toggle-text {
  font-size: 0.9rem;
  color: var(--color-text-primary);
  font-weight: 500;
}

/* 操作按钮 */
.settings-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border-light);
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1rem;
  min-width: 150px;
}

/* 保存成功提示 */
.save-notification {
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: var(--color-success);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 20px var(--color-shadow);
  z-index: 1000;
  animation: slideInRight 0.3s ease;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 执行设置专用样式 */
.panel-description {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin: 0;
}

.setting-help {
  margin-top: 0.5rem;
}

.setting-help p {
  margin: 0.25rem 0;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.shell-info-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 500;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.info-value {
  font-family: monospace;
  background: var(--color-background);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: var(--color-text-primary);
}

.available-shells {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.shell-tag {
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--color-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings {
    padding: 1rem;
  }

  .setting-grid {
    grid-template-columns: 1fr;
  }

  .panel-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .settings-actions {
    flex-direction: column;
  }
}
</style>
