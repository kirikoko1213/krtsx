<template>
  <div class="app">
    <header class="app-header">
      <h1>脚本管理器</h1>
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
      <ScriptManager v-if="currentTab === 'scripts'" />
      <div v-else class="coming-soon">
        <h2>功能开发中...</h2>
        <p>{{ tabs.find(t => t.id === currentTab)?.label }} 功能即将推出</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ScriptManager from './components/ScriptManager.vue'

const currentTab = ref('scripts')

const tabs = [
  { id: 'scripts', label: '脚本管理' },
  { id: 'feature2', label: '功能二' },
  { id: 'feature3', label: '功能三' }
]
</script>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.app-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-header h1 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 1rem;
  font-weight: 600;
}

.nav-tabs {
  display: flex;
  gap: 0.5rem;
}

.nav-tab {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  color: #666;
}

.nav-tab:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.nav-tab.active {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.app-content {
  flex: 1;
  overflow: hidden;
  padding: 1rem 2rem;
}

.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.coming-soon h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.coming-soon p {
  font-size: 1rem;
  opacity: 0.8;
}
</style> 