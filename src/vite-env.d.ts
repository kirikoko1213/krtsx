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
    getWeather: (city?: string) => Promise<{
      success: boolean
      data?: any
      error?: string
    }>
    selectBackgroundImage: () => Promise<{
      canceled: boolean
      filePaths: string[]
    }>
    saveBackgroundImage: (sourcePath: string) => Promise<{
      success: boolean
      data?: string
      error?: string
    }>
    getBackgroundImageData: (fileName: string) => Promise<{
      success: boolean
      data?: string
      error?: string
    }>
    saveAppSettings: (settings: any) => Promise<{
      success: boolean
      error?: string
    }>
    getAppSettings: () => Promise<{
      success: boolean
      data?: any
      error?: string
    }>
    deleteBackgroundImage: (fileName: string) => Promise<{
      success: boolean
      error?: string
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
    base64Encode: (input: string) => Promise<{
      success: boolean
      data?: string
      error?: string
    }>
    base64Decode: (input: string) => Promise<{
      success: boolean
      data?: string
      error?: string
    }>
    htmlToBase64: (input: string) => Promise<{
      success: boolean
      data?: string
      error?: string
    }>
    base64ToHtml: (input: string) => Promise<{  
      success: boolean
      data?: string
      error?: string
    }>  
    htmlToBase64: (input: string) => Promise<{
      success: boolean
      data?: string
      error?: string
    }>
    base64ToHtml: (input: string) => Promise<{
      success: boolean
      data?: string
      error?: string
    }>
    htmlToBase64: (input: string) => Promise<{
      success: boolean
      data?: string
      error?: string
    }>
    base64ToHtml: (input: string) => Promise<{
      success: boolean
      data?: string
      error?: string
    }>
    md5Hash: (input: string, salt?: string) => Promise<{
      success: boolean
      data?: string
      error?: string
    }>
    md5Guess: (input: string) => Promise<{
      success: boolean
      data?: string
      error?: string
    }>
    jsonFormat: (input: string) => Promise<{
      success: boolean
      data?: string
      error?: string
    }>
    jsonValidate: (input: string) => Promise<{
      success: boolean
      data?: string
      error?: string
    }>
  } & any
} 