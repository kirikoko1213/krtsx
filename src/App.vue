<template>
  <div class="app">
    <header class="app-header">
      <div class="header-top">
        <h1>🌟🌟🌟</h1>
        <ThemeSwitcher />
      </div>
      <nav class="nav-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['nav-tab', { active: currentTab === tab.id }]"
          @click="currentTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>
    </header>

    <main class="app-content">
      <Dashboard v-show="currentTab === 'dashboard'" @navigate="currentTab = $event" />
      <ScriptManager v-show="currentTab === 'scripts'" />
      <div v-show="currentTab !== 'dashboard' && currentTab !== 'scripts'" class="coming-soon">
        <h2>功能开发中...</h2>
        <p>{{ tabs.find(t => t.id === currentTab)?.label }} 功能即将推出</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Dashboard from './components/Dashboard.vue'
import ScriptManager from './components/ScriptManager.vue'
import ThemeSwitcher from './components/ThemeSwitcher.vue'
import { useTheme } from './composables/useTheme'

const currentTab = ref('dashboard')

const tabs = [
  { id: 'dashboard', label: '首页' },
  { id: 'scripts', label: '脚本管理' },
  { id: 'feature2', label: '功能二' },
  { id: 'feature3', label: '功能三' }
]

// 初始化主题系统
const { currentTheme } = useTheme()

onMounted(() => {
  // 确保主题在组件挂载后应用
  console.log('当前主题:', currentTheme.value.name)
})
</script>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  transition: background-color 0.3s ease;
  animation: fadeIn 0.5s ease;
}

.app-header {
  background: var(--color-surface-light);
  border-bottom: 1px solid var(--color-border);
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 12px var(--color-shadow-light);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 10;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  gap: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .header-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}

.app-header h1 {
  font-size: 1.75rem;
  color: var(--color-text-primary);
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.025em;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-tabs {
  display: flex;
  gap: 0.75rem;
}

.nav-tab {
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.nav-tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.nav-tab:hover {
  background: var(--color-surface-light);
  border-color: var(--color-primary);
  color: var(--color-text-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--color-shadow-light);
}

.nav-tab.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px var(--color-shadow);
}

.nav-tab.active::before {
  opacity: 1;
}

.app-content {
  flex: 1;
  overflow: hidden;
  padding: 1.5rem 2rem;
}

.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
  background: var(--color-surface-light);
  border-radius: 12px;
  margin: 1rem 0;
  padding: 3rem;
  box-shadow: 0 4px 20px var(--color-shadow-light);
  animation: fadeIn 0.5s ease;
}

.coming-soon h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.coming-soon p {
  font-size: 1.1rem;
  opacity: 0.8;
  text-align: center;
  max-width: 400px;
  line-height: 1.6;
}
</style> 