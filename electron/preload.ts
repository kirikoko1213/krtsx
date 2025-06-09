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
  stopScript: (scriptId: string) => ipcRenderer.invoke('stop-script', scriptId),
  getRunningScripts: () => ipcRenderer.invoke('get-running-scripts'),
  
  // 脚本配置管理
  saveScriptConfig: (config: ScriptConfig) => ipcRenderer.invoke('save-script-config', config),
  getScriptConfigs: () => ipcRenderer.invoke('get-script-configs'),
  deleteScriptConfig: (id: string) => ipcRenderer.invoke('delete-script-config', id),
  
  // 系统信息
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getLocalIP: () => ipcRenderer.invoke('get-local-ip'),
  getPublicIP: () => ipcRenderer.invoke('get-public-ip'),
  getDiskUsage: () => ipcRenderer.invoke('get-disk-usage'),
  
  // 天气信息
  getWeather: (city?: string) => ipcRenderer.invoke('get-weather', city),
  
  // 杀死端口进程
  killPortProcess: (port: number) => ipcRenderer.invoke('kill-port-process', port),
  
  // 转码工具
  base64Encode: (text: string) => ipcRenderer.invoke('base64-encode', text),
  base64Decode: (base64: string) => ipcRenderer.invoke('base64-decode', base64),
  md5Hash: (text: string, salt?: string) => ipcRenderer.invoke('md5-hash', text, salt),
  md5Guess: (hash: string) => ipcRenderer.invoke('md5-guess', hash),
  urlEncode: (text: string) => ipcRenderer.invoke('url-encode', text),
  urlDecode: (encodedText: string) => ipcRenderer.invoke('url-decode', encodedText),
  htmlEncode: (text: string) => ipcRenderer.invoke('html-encode', text),
  htmlDecode: (encodedText: string) => ipcRenderer.invoke('html-decode', encodedText),
  
  // 设置管理
  selectBackgroundImage: () => ipcRenderer.invoke('select-background-image'),
  saveBackgroundImage: (sourcePath: string) => ipcRenderer.invoke('save-background-image', sourcePath),
  getBackgroundImageData: (fileName: string) => ipcRenderer.invoke('get-background-image-data', fileName),
  saveAppSettings: (settings: any) => ipcRenderer.invoke('save-app-settings', settings),
  getAppSettings: () => ipcRenderer.invoke('get-app-settings'),
  deleteBackgroundImage: (fileName: string) => ipcRenderer.invoke('delete-background-image', fileName),
  
  // Shell 配置管理
  getSystemShellInfo: () => ipcRenderer.invoke('get-system-shell-info'),
  testShellConfig: () => ipcRenderer.invoke('test-shell-config'),
  
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