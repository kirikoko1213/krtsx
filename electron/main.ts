import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as cron from 'node-cron'
import * as os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as crypto from 'crypto'

const execAsync = promisify(exec)

let mainWindow: BrowserWindow
const isDev = process.argv.includes('--dev')

// 存储脚本配置的文件路径
const configPath = path.join(app.getPath('userData'), 'scripts-config.json')

// 存储转码历史记录的文件路径
const md5HistoryPath = path.join(app.getPath('userData'), 'md5-history.json')

// 存储应用设置的文件路径
const settingsPath = path.join(app.getPath('userData'), 'app-settings.json')

// 存储背景图片的目录
const backgroundImagesDir = path.join(app.getPath('userData'), 'backgrounds')

// 存储定时任务的映射
const cronJobs = new Map<string, cron.ScheduledTask>()

// 存储正在运行的脚本进程
const runningProcesses = new Map<string, ChildProcess>()

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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    titleBarStyle: 'default'
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}

app.whenReady().then(() => {
  createWindow()
  setupIpcHandlers()
  loadScriptConfigs()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

function setupIpcHandlers() {
  // 选择文件
  ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: '脚本文件', extensions: ['bat', 'cmd', 'sh', 'py', 'js', 'ps1'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })
    return result
  })

  // 执行脚本
  ipcMain.handle('execute-script', async (event, scriptConfig: ScriptConfig) => {
    return new Promise((resolve) => {
      let command: string
      let args: string[] = []

      if (scriptConfig.type === 'file' && scriptConfig.path) {
        const ext = path.extname(scriptConfig.path).toLowerCase()
        switch (ext) {
          case '.bat':
          case '.cmd':
            command = 'cmd'
            args = ['/c', scriptConfig.path]
            break
          case '.sh':
            command = 'bash'
            args = [scriptConfig.path]
            break
          case '.py':
            command = 'python'
            args = [scriptConfig.path]
            break
          case '.js':
            command = 'node'
            args = [scriptConfig.path]
            break
          case '.ps1':
            command = 'powershell'
            args = ['-ExecutionPolicy', 'Bypass', '-File', scriptConfig.path]
            break
          default:
            resolve({ success: false, error: '不支持的文件类型' })
            return
        }
      } else if (scriptConfig.type === 'command' && scriptConfig.command) {
        const parts = scriptConfig.command.split(' ')
        command = parts[0]
        args = parts.slice(1)
      } else {
        resolve({ success: false, error: '无效的脚本配置' })
        return
      }

      const child = spawn(command, args, {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      })

      // 将子进程存储起来，以便后续可以停止
      runningProcesses.set(scriptConfig.id, child)

      let output = ''
      let error = ''

      child.stdout?.on('data', (data) => {
        const text = data.toString()
        output += text
        event.sender.send('script-output', { scriptId: scriptConfig.id, type: 'stdout', data: text })
      })

      child.stderr?.on('data', (data) => {
        const text = data.toString()
        error += text
        event.sender.send('script-output', { scriptId: scriptConfig.id, type: 'stderr', data: text })
      })

      child.on('close', (code) => {
        // 从运行进程映射中移除
        runningProcesses.delete(scriptConfig.id)
        resolve({
          success: code === 0,
          output,
          error,
          exitCode: code
        })
      })

      child.on('error', (err) => {
        // 从运行进程映射中移除
        runningProcesses.delete(scriptConfig.id)
        resolve({
          success: false,
          error: err.message
        })
      })
    })
  })

  // 保存脚本配置
  ipcMain.handle('save-script-config', async (event, config: ScriptConfig) => {
    try {
      const configs = loadScriptConfigsFromFile()
      const existingIndex = configs.findIndex(c => c.id === config.id)
      
      if (existingIndex >= 0) {
        configs[existingIndex] = config
      } else {
        configs.push(config)
      }

      fs.writeFileSync(configPath, JSON.stringify(configs, null, 2))
      
      // 更新定时任务
      updateCronJob(config)
      
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取脚本配置
  ipcMain.handle('get-script-configs', async () => {
    return loadScriptConfigsFromFile()
  })

  // 删除脚本配置
  ipcMain.handle('delete-script-config', async (event, id: string) => {
    try {
      const configs = loadScriptConfigsFromFile()
      const filteredConfigs = configs.filter(c => c.id !== id)
      fs.writeFileSync(configPath, JSON.stringify(filteredConfigs, null, 2))
      
      // 停止并删除定时任务
      if (cronJobs.has(id)) {
        cronJobs.get(id)?.stop()
        cronJobs.delete(id)
      }
      
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 停止脚本执行
  ipcMain.handle('stop-script', async (event, scriptId: string) => {
    try {
      const process = runningProcesses.get(scriptId)
      if (process && !process.killed) {
        // 尝试优雅地停止进程
        process.kill('SIGTERM')
        
        // 如果5秒后进程仍未结束，强制终止
        setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGKILL')
          }
        }, 5000)
        
        return { success: true, message: '脚本停止中...' }
      } else {
        return { success: false, error: '脚本未在运行或已停止' }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取正在运行的脚本列表
  ipcMain.handle('get-running-scripts', async () => {
    const runningScriptIds = Array.from(runningProcesses.keys()).filter(id => {
      const process = runningProcesses.get(id)
      return process && !process.killed
    })
    return runningScriptIds
  })

  // 获取系统信息
  ipcMain.handle('get-system-info', async () => {
    try {
      const systemInfo = {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        osType: os.type(),
        osVersion: os.release(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus(),
        uptime: os.uptime(),
        loadavg: os.loadavg(),
        networkInterfaces: os.networkInterfaces()
      }
      return { success: true, data: systemInfo }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取本地IP地址
  ipcMain.handle('get-local-ip', async () => {
    try {
      const interfaces = os.networkInterfaces()
      const localIPs: string[] = []
      
      for (const interfaceName in interfaces) {
        const interfaceInfo = interfaces[interfaceName]
        if (interfaceInfo) {
          for (const net of interfaceInfo) {
            if (net.family === 'IPv4' && !net.internal) {
              localIPs.push(net.address)
            }
          }
        }
      }
      
      return { success: true, data: localIPs }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取外网IP地址
  ipcMain.handle('get-public-ip', async () => {
    try {
      // 使用多个服务作为备选
      const services = [
        'curl -s ifconfig.me',
        'curl -s ipinfo.io/ip',
        'curl -s api.ipify.org'
      ]
      
      for (const service of services) {
        try {
          const { stdout } = await execAsync(service, { timeout: 5000 })
          const ip = stdout.trim()
          if (ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
            return { success: true, data: ip }
          }
        } catch (err) {
          continue // 尝试下一个服务
        }
      }
      
      return { success: false, error: '无法获取外网IP' }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取磁盘使用情况
  ipcMain.handle('get-disk-usage', async () => {
    try {
      let command = ''
      if (process.platform === 'win32') {
        command = 'wmic logicaldisk get size,freespace,caption'
      } else {
        command = 'df -h'
      }
      
      const { stdout } = await execAsync(command)
      return { success: true, data: stdout }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取天气信息
  ipcMain.handle('get-weather', async (event, city: string) => {
    try {
      // 从设置中获取API Key
      let settings = {}
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf-8')
        settings = JSON.parse(data)
      }
      
      const apiKey = (settings as any).weatherApiKey
      if (!apiKey) {
        return { success: false, error: '请先在设置中配置天气API Key' }
      }
      
      const baseURL = 'http://apis.juhe.cn/simpleWeather/query'
      const params = new URLSearchParams({
        city: city || '北京',
        key: apiKey
      })
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      try {
        const response = await fetch(`${baseURL}?${params}`, {
          method: 'GET',
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          return { success: false, error: `HTTP Error: ${response.status}` }
        }
        
        const data = await response.json() as any
        
        if (data.error_code !== 0) {
          return { success: false, error: data.reason || '获取天气信息失败' }
        }
        
        const result = data.result
        const weatherInfo = {
          cityName: result.city || city,
          weather: result.realtime?.info || '未知',
          temperature: result.realtime?.temperature || '0',
          humidity: result.realtime?.humidity || '0',
          windPower: result.realtime?.power || '未知',
          windDirect: result.realtime?.direct || '未知',
          aqi: result.realtime?.aqi || '未知'
        }
        
        return { success: true, data: weatherInfo }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return { success: false, error: '请求超时' }
        }
        throw fetchError
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Base64 编码
  ipcMain.handle('base64-encode', async (event, text: string) => {
    try {
      const encoded = Buffer.from(text, 'utf8').toString('base64')
      return { success: true, data: encoded }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Base64 解码
  ipcMain.handle('base64-decode', async (event, base64: string) => {
    try {
      const decoded = Buffer.from(base64, 'base64').toString('utf8')
      return { success: true, data: decoded }
    } catch (error) {
      return { success: false, error: '无效的Base64字符串' }
    }
  })

  // MD5 加密
  ipcMain.handle('md5-hash', async (event, text: string, salt?: string) => {
    try {
      const textToHash = salt ? text + salt : text
      const hash = crypto.createHash('md5').update(textToHash).digest('hex')
      
      // 保存到历史记录
      saveMd5History(text, hash, salt)
      
      return { success: true, data: hash }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // MD5 猜测（从历史记录中查找）
  ipcMain.handle('md5-guess', async (event, hash: string) => {
    try {
      const history = loadMd5History()
      const found = history.find(item => item.hash === hash.toLowerCase())
      
      if (found) {
        return { success: true, data: { original: found.original, salt: found.salt } }
      } else {
        return { success: false, error: '未在历史记录中找到该MD5值' }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // URL 编码
  ipcMain.handle('url-encode', async (event, text: string) => {
    try {
      const encoded = encodeURIComponent(text)
      return { success: true, data: encoded }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // URL 解码
  ipcMain.handle('url-decode', async (event, encodedText: string) => {
    try {
      const decoded = decodeURIComponent(encodedText)
      return { success: true, data: decoded }
    } catch (error) {
      return { success: false, error: '无效的URL编码字符串' }
    }
  })

  // HTML 实体编码
  ipcMain.handle('html-encode', async (event, text: string) => {
    try {
      const encoded = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
      return { success: true, data: encoded }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // HTML 实体解码
  ipcMain.handle('html-decode', async (event, encodedText: string) => {
    try {
      const decoded = encodedText
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
      return { success: true, data: decoded }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 杀死端口进程
  ipcMain.handle('kill-port-process', async (event, port: number) => {
    try {
      const platform = os.platform()
      let command: string
      
      if (platform === 'win32') {
        // Windows
        command = `netstat -ano | findstr :${port}`
      } else {
        // macOS/Linux
        command = `lsof -ti:${port}`
      }
      
      const { stdout } = await execAsync(command)
      
      if (!stdout.trim()) {
        return {
          success: false,
          error: `端口 ${port} 上没有找到运行的进程`
        }
      }
      
      let pids: string[] = []
      
      if (platform === 'win32') {
        // 解析Windows netstat输出
        const lines = stdout.trim().split('\n')
        for (const line of lines) {
          const parts = line.trim().split(/\s+/)
          if (parts.length >= 5) {
            const pid = parts[parts.length - 1]
            if (pid && pid !== '0' && !pids.includes(pid)) {
              pids.push(pid)
            }
          }
        }
      } else {
        // macOS/Linux直接返回PID
        pids = stdout.trim().split('\n').filter(pid => pid.trim() !== '')
      }
      
      if (pids.length === 0) {
        return {
          success: false,
          error: `端口 ${port} 上没有找到有效的进程ID`
        }
      }
      
      // 杀死进程
      const killCommand = platform === 'win32' 
        ? `taskkill /F /PID ${pids.join(' /PID ')}`
        : `kill -9 ${pids.join(' ')}`
      
      await execAsync(killCommand)
      
      return {
        success: true,
        message: `成功杀死端口 ${port} 上的进程 (PID: ${pids.join(', ')})`
      }
    } catch (error) {
      console.error('Kill port process error:', error)
      return {
        success: false,
        error: `杀死端口进程失败: ${(error as Error).message}`
      }
    }
  })

  // 选择背景图片
  ipcMain.handle('select-background-image', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })
    return result
  })

  // 保存背景图片
  ipcMain.handle('save-background-image', async (event, sourcePath: string) => {
    try {
      // 确保背景图片目录存在
      if (!fs.existsSync(backgroundImagesDir)) {
        fs.mkdirSync(backgroundImagesDir, { recursive: true })
      }

      const ext = path.extname(sourcePath)
      const fileName = `background_${Date.now()}${ext}`
      const targetPath = path.join(backgroundImagesDir, fileName)

      // 复制图片到应用数据目录
      fs.copyFileSync(sourcePath, targetPath)

      return { success: true, data: fileName }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取背景图片数据URL
  ipcMain.handle('get-background-image-data', async (event, fileName: string) => {
    try {
      const imagePath = path.join(backgroundImagesDir, fileName)
      if (fs.existsSync(imagePath)) {
        // 读取图片文件
        const imageBuffer = fs.readFileSync(imagePath)
        
        // 获取文件扩展名以确定MIME类型
        const ext = path.extname(fileName).toLowerCase()
        let mimeType = 'image/jpeg' // 默认值
        
        switch (ext) {
          case '.png':
            mimeType = 'image/png'
            break
          case '.gif':
            mimeType = 'image/gif'
            break
          case '.bmp':
            mimeType = 'image/bmp'
            break
          case '.webp':
            mimeType = 'image/webp'
            break
          case '.jpg':
          case '.jpeg':
          default:
            mimeType = 'image/jpeg'
            break
        }
        
        // 转换为base64数据URL
        const base64Data = imageBuffer.toString('base64')
        const dataUrl = `data:${mimeType};base64,${base64Data}`
        
        return { success: true, data: dataUrl }
      } else {
        return { success: false, error: '图片文件不存在' }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 保存应用设置
  ipcMain.handle('save-app-settings', async (event, settings: any) => {
    try {
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取应用设置
  ipcMain.handle('get-app-settings', async () => {
    try {
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf-8')
        return { success: true, data: JSON.parse(data) }
      } else {
        return { success: true, data: {} }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 删除背景图片
  ipcMain.handle('delete-background-image', async (event, fileName: string) => {
    try {
      const imagePath = path.join(backgroundImagesDir, fileName)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}

function loadScriptConfigsFromFile(): ScriptConfig[] {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading script configs:', error)
  }
  return []
}

function loadScriptConfigs() {
  const configs = loadScriptConfigsFromFile()
  configs.forEach(config => {
    if (config.cronExpression && config.enabled) {
      updateCronJob(config)
    }
  })
}

function updateCronJob(config: ScriptConfig) {
  // 先停止已存在的任务
  if (cronJobs.has(config.id)) {
    cronJobs.get(config.id)?.stop()
    cronJobs.delete(config.id)
  }

  // 如果配置了定时表达式且启用，则创建新的定时任务
  if (config.cronExpression && config.enabled) {
    try {
      const task = cron.schedule(config.cronExpression, () => {
        console.log(`执行定时脚本: ${config.name}`)
        mainWindow.webContents.send('execute-scheduled-script', config)
      }, {
        scheduled: false
      })
      
      cronJobs.set(config.id, task)
      task.start()
      console.log(`已设置定时任务: ${config.name} (${config.cronExpression})`)
    } catch (error) {
      console.error(`设置定时任务失败: ${config.name}`, error)
    }
  }
}

// MD5历史记录相关函数
interface Md5HistoryItem {
  original: string
  hash: string
  salt?: string
  timestamp: number
}

function loadMd5History(): Md5HistoryItem[] {
  try {
    if (fs.existsSync(md5HistoryPath)) {
      const data = fs.readFileSync(md5HistoryPath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading MD5 history:', error)
  }
  return []
}

function saveMd5History(original: string, hash: string, salt?: string) {
  try {
    const history = loadMd5History()
    
    // 检查是否已存在相同的记录
    const exists = history.some(item => 
      item.original === original && 
      item.salt === salt
    )
    
    if (!exists) {
      const newItem: Md5HistoryItem = {
        original,
        hash: hash.toLowerCase(),
        salt,
        timestamp: Date.now()
      }
      
      history.push(newItem)
      
      // 保留最近1000条记录
      if (history.length > 1000) {
        history.splice(0, history.length - 1000)
      }
      
      fs.writeFileSync(md5HistoryPath, JSON.stringify(history, null, 2))
    }
  } catch (error) {
    console.error('Error saving MD5 history:', error)
  }
} 