/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI: {
    selectFile: () => Promise<{
      canceled: boolean
      filePaths: string[]
    }>
    executeScript: (config: any) => Promise<{
      success: boolean
      output?: string
      error?: string
      exitCode?: number
    }>
    stopScript: (scriptId: string) => Promise<{
      success: boolean
      error?: string
    }>
    getRunningScripts: () => Promise<any[]>
    getSystemInfo: () => Promise<{
      success: boolean
      data: any
    }>
    getLocalIP: () => Promise<{
      success: boolean
      data: any
    }>
    getPublicIP: () => Promise<{
      success: boolean
      data: any
    }>
    saveScriptConfig: (config: any) => Promise<{
      success: boolean
      error?: string
    }>
    getScriptConfigs: () => Promise<any[]>
    deleteScriptConfig: (id: string) => Promise<{
      success: boolean
      error?: string
    }>
    onScriptOutput: (callback: (output: {
      scriptId: string
      type: 'stdout' | 'stderr'
      data: string
    }) => void) => () => void
    onExecuteScheduledScript: (callback: (config: any) => void) => () => void
  }
} 