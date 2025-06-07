<template>
  <div class="theme-switcher">
    <button 
      class="theme-toggle-btn"
      @click="showThemeMenu = !showThemeMenu"
      :class="{ active: showThemeMenu }"
    >
      <svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
      <span class="theme-label">主题</span>
    </button>
    
    <transition name="theme-menu">
      <div v-if="showThemeMenu" class="theme-menu" @click.stop>
        <div class="theme-menu-header">
          <h3>选择主题</h3>
          <button class="close-btn" @click="showThemeMenu = false">×</button>
        </div>
        
        <div class="theme-options">
          <div
            v-for="theme in themes"
            :key="theme.id"
            class="theme-option"
            :class="{ active: currentThemeId === theme.id }"
            @click="selectTheme(theme.id)"
          >
            <div class="theme-preview">
              <div 
                class="color-circle primary" 
                :style="{ backgroundColor: theme.colors.primary }"
              ></div>
              <div 
                class="color-circle secondary" 
                :style="{ backgroundColor: theme.colors.secondary }"
              ></div>
              <div 
                class="color-circle surface" 
                :style="{ backgroundColor: theme.colors.surface }"
              ></div>
            </div>
            <div class="theme-info">
              <span class="theme-name">{{ theme.name }}</span>
              <div class="theme-tags">
                <span v-if="theme.id === 'sakura'" class="tag pink">少女</span>
                <span v-if="theme.id === 'aqua'" class="tag blue">清新</span>
                <span v-if="theme.id === 'dark'" class="tag dark">深色</span>
                <span v-if="theme.id === 'default'" class="tag default">经典</span>
              </div>
            </div>
            <div v-if="currentThemeId === theme.id" class="check-icon">✓</div>
          </div>
        </div>
        
        <div class="theme-menu-footer">
          <p class="tip">主题设置会自动保存</p>
        </div>
      </div>
    </transition>
    
    <!-- 点击外部关闭 -->
    <div 
      v-if="showThemeMenu" 
      class="theme-overlay" 
      @click="showThemeMenu = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '../composables/useTheme'

const { themes, currentThemeId, setTheme } = useTheme()
const showThemeMenu = ref(false)

const selectTheme = (themeId: string) => {
  setTheme(themeId)
  showThemeMenu.value = false
}
</script>

<style scoped>
.theme-switcher {
  position: relative;
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.theme-toggle-btn:hover {
  background: var(--color-surface-light);
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--color-shadow-light);
}

.theme-toggle-btn.active {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.theme-icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

.theme-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 998;
}

.theme-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 320px;
  background: var(--color-surface-light);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 8px 32px var(--color-shadow);
  z-index: 999;
  overflow: hidden;
}

.theme-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
}

.theme-menu-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--color-border-light);
  color: var(--color-text-primary);
}

.theme-options {
  padding: 0.5rem;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border: 2px solid transparent;
}

.theme-option:hover {
  background: var(--color-surface);
  transform: translateY(-1px);
}

.theme-option.active {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

.theme-preview {
  display: flex;
  gap: 4px;
  align-items: center;
}

.color-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.theme-info {
  flex: 1;
}

.theme-name {
  font-weight: 500;
  color: var(--color-text-primary);
  display: block;
  margin-bottom: 0.25rem;
}

.theme-tags {
  display: flex;
  gap: 0.25rem;
}

.tag {
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.tag.pink { background: #fce4ec; color: #c2185b; }
.tag.blue { background: #e0f2f1; color: #00695c; }
.tag.dark { background: #424242; color: #ffffff; }
.tag.default { background: #e3f2fd; color: #1976d2; }

.check-icon {
  color: var(--color-primary);
  font-weight: bold;
  font-size: 1.2rem;
}

.theme-menu-footer {
  padding: 0.75rem 1.25rem;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border-light);
}

.tip {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 0;
  text-align: center;
}

/* 动画 */
.theme-menu-enter-active,
.theme-menu-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-menu-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.theme-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style> 