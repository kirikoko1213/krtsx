import { contextBridge, ipcRenderer } from 'electron'

export interface ScriptConfig {
  id: string
  name: string
  type: 'file' | 'command'
  path?: string
  command?: string
  cronExpression?: string
  enabled: boolean
  autoStart: boolean
}

export interface ExecutionResult {
  success: boolean
  output?: string
  error?: string
  exitCode?: number
}

export interface ScriptOutput {
  scriptId: string
  type: 'stdout' | 'stderr'
  data: string
}

const electronAPI = {
  // 文件选择
  selectFile: () => ipcRenderer.invoke('select-file'),
  
  // 脚本执行
  executeScript: (config: ScriptConfig) => ipcRenderer.invoke('execute-script', config),
  
  // 脚本配置管理
  saveScriptConfig: (config: ScriptConfig) => ipcRenderer.invoke('save-script-config', config),
  getScriptConfigs: () => ipcRenderer.invoke('get-script-configs'),
  deleteScriptConfig: (id: string) => ipcRenderer.invoke('delete-script-config', id),
  
  // 事件监听
  onScriptOutput: (callback: (output: ScriptOutput) => void) => {
    ipcRenderer.on('script-output', (event, output) => callback(output))
    return () => ipcRenderer.removeAllListeners('script-output')
  },
  
  onExecuteScheduledScript: (callback: (config: ScriptConfig) => void) => {
    ipcRenderer.on('execute-scheduled-script', (event, config) => callback(config))
    return () => ipcRenderer.removeAllListeners('execute-scheduled-script')
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

declare global {
  interface Window {
    electronAPI: typeof electronAPI
  }
} 