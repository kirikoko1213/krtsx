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

// 存储番茄钟设置的文件路径
const pomodoroSettingsPath = path.join(app.getPath('userData'), 'pomodoro-settings.json')

// 存储番茄钟统计的文件路径
const pomodoroStatsPath = path.join(app.getPath('userData'), 'pomodoro-stats.json')

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

      // 获取用户的环境变量和Shell设置
      let env = { ...process.env }
      let settings = {}
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf-8')
        settings = JSON.parse(data)
      }
      
      const executionSettings = (settings as any).execution || {
        preferredShell: 'auto',
        loadShellConfig: true
      }

      // 确保基本路径存在
      if (!env.PATH) {
        env.PATH = '/usr/local/bin:/usr/bin:/bin'
      } else if (!env.PATH.includes('/usr/local/bin')) {
        env.PATH = `/usr/local/bin:${env.PATH}`
      }
      
      // 在 macOS/Linux 上，根据用户设置选择Shell和配置加载方式
      if (process.platform !== 'win32') {
        try {
          let shellPath = '/bin/zsh'  // 默认值
          let configFile = '~/.zshrc'
          
          // 根据用户设置选择Shell
          switch (executionSettings.preferredShell) {
            case 'bash':
              shellPath = '/bin/bash'
              configFile = '~/.bashrc'
              break
            case 'sh':
              shellPath = '/bin/sh'
              configFile = ''  // sh 通常不需要配置文件
              break
            case 'custom':
              shellPath = executionSettings.customShellPath || '/bin/zsh'
              configFile = ''  // 自定义Shell不自动加载配置
              break
            case 'auto':
            case 'zsh':
            default:
              shellPath = '/bin/zsh'
              configFile = '~/.zshrc'
              break
          }
          
          // 构建命令，根据设置决定是否加载配置文件
          let shellCommand
          if (executionSettings.loadShellConfig && configFile) {
            // 加载配置文件并导出环境变量
            shellCommand = `source ${configFile} 2>/dev/null || true; export PATH; ${command} ${args.join(' ')}`
          } else {
            // 至少确保基本路径可用
            shellCommand = `export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"; ${command} ${args.join(' ')}`
          }
          
          const child = spawn(shellPath, ['-c', shellCommand], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: env
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
          
          return // 早期返回，避免执行下面的 Windows 代码
        } catch (shellError) {
          console.warn('Failed to use zsh shell, falling back to default spawn:', shellError)
        }
      }
      
      // Windows 或者 zsh 失败时的备用方案
      const child = spawn(command, args, {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: env
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

  // 获取环境变量
  ipcMain.handle('get-environment-variables', async () => {
    try {
      const envVars: Array<{name: string, value: string, isSystem: boolean}> = []
      
      // 获取所有环境变量
      for (const [name, value] of Object.entries(process.env)) {
        if (value !== undefined) {
          // 判断是否为系统变量（通过一些常见的系统变量名判断）
          const isSystem = [
            'PATH', 'HOME', 'USER', 'USERNAME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA',
            'PROGRAMFILES', 'PROGRAMFILES(X86)', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP',
            'SHELL', 'PWD', 'OLDPWD', 'PS1', 'TERM', 'LANG', 'LC_ALL',
            'NODE_ENV', 'npm_config_cache', 'npm_config_prefix'
          ].includes(name) || name.startsWith('npm_') || name.startsWith('NODE_')
          
          envVars.push({
            name,
            value,
            isSystem
          })
        }
      }
      
      return { success: true, data: envVars }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 设置环境变量
  ipcMain.handle('set-environment-variable', async (event, name: string, value: string, isSystem: boolean = false) => {
    try {
      if (isSystem) {
        // Windows 系统级环境变量需要管理员权限
        if (process.platform === 'win32') {
          const command = `setx "${name}" "${value}" /M`
          await execAsync(command)
        } else {
          // Unix-like 系统，修改系统配置文件需要 sudo
          return { success: false, error: '设置系统级环境变量需要管理员权限' }
        }
      } else {
        // 用户级环境变量
        if (process.platform === 'win32') {
          const command = `setx "${name}" "${value}"`
          await execAsync(command)
        } else {
          // Unix-like 系统，修改用户配置文件
          const homeDir = os.homedir()
          const bashrcPath = path.join(homeDir, '.bashrc')
          const zshrcPath = path.join(homeDir, '.zshrc')
          
          const exportLine = `export ${name}="${value}"`
          
          // 尝试写入到 .bashrc 或 .zshrc
          if (fs.existsSync(zshrcPath)) {
            // 检查是否已存在该变量
            const content = fs.readFileSync(zshrcPath, 'utf-8')
            const regex = new RegExp(`^export\\s+${name}=.*$`, 'm')
            
            if (regex.test(content)) {
              // 替换现有的
              const newContent = content.replace(regex, exportLine)
              fs.writeFileSync(zshrcPath, newContent)
            } else {
              // 追加新的
              fs.appendFileSync(zshrcPath, `\n${exportLine}\n`)
            }
          } else if (fs.existsSync(bashrcPath)) {
            const content = fs.readFileSync(bashrcPath, 'utf-8')
            const regex = new RegExp(`^export\\s+${name}=.*$`, 'm')
            
            if (regex.test(content)) {
              const newContent = content.replace(regex, exportLine)
              fs.writeFileSync(bashrcPath, newContent)
            } else {
              fs.appendFileSync(bashrcPath, `\n${exportLine}\n`)
            }
          }
        }
      }
      
      // 在当前进程中也设置环境变量
      process.env[name] = value
      
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 删除环境变量
  ipcMain.handle('delete-environment-variable', async (event, name: string) => {
    try {
      if (process.platform === 'win32') {
        // Windows - 删除用户环境变量
        const command = `reg delete "HKCU\\Environment" /v "${name}" /f`
        try {
          await execAsync(command)
        } catch (regError) {
          // 如果注册表删除失败，可能变量不存在，这是正常的
          console.log('注册表删除失败（可能变量不存在）:', regError)
        }
      } else {
        // Unix-like 系统 - 从配置文件中删除
        const homeDir = os.homedir()
        const bashrcPath = path.join(homeDir, '.bashrc')
        const zshrcPath = path.join(homeDir, '.zshrc')
        
        const regex = new RegExp(`^export\\s+${name}=.*$\\n?`, 'm')
        
        if (fs.existsSync(zshrcPath)) {
          const content = fs.readFileSync(zshrcPath, 'utf-8')
          const newContent = content.replace(regex, '')
          fs.writeFileSync(zshrcPath, newContent)
        }
        
        if (fs.existsSync(bashrcPath)) {
          const content = fs.readFileSync(bashrcPath, 'utf-8')
          const newContent = content.replace(regex, '')
          fs.writeFileSync(bashrcPath, newContent)
        }
      }
      
      // 从当前进程中删除
      delete process.env[name]
      
      return { success: true }
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

  // 获取系统Shell信息
  ipcMain.handle('get-system-shell-info', async () => {
    try {
      const shellInfo = {
        default: '/bin/sh',
        current: process.env.SHELL || '/bin/sh',
        available: [] as string[]
      }

      // 检测可用的Shell
      const commonShells = ['/bin/sh', '/bin/bash', '/bin/zsh', '/usr/bin/fish', '/usr/local/bin/fish']
      
      for (const shell of commonShells) {
        try {
          if (fs.existsSync(shell)) {
            const baseName = path.basename(shell)
            if (!shellInfo.available.includes(baseName)) {
              shellInfo.available.push(baseName)
            }
          }
        } catch (error) {
          // 忽略单个Shell检测错误
        }
      }

      // 在Linux/macOS上尝试从/etc/shells读取
      if (process.platform !== 'win32') {
        try {
          if (fs.existsSync('/etc/shells')) {
            const shellsFile = fs.readFileSync('/etc/shells', 'utf-8')
            const shells = shellsFile.split('\n')
              .filter(line => line.trim() && !line.startsWith('#'))
              .map(line => line.trim())
            
            for (const shell of shells) {
              if (fs.existsSync(shell)) {
                const baseName = path.basename(shell)
                if (!shellInfo.available.includes(baseName)) {
                  shellInfo.available.push(baseName)
                }
              }
            }
          }
        } catch (error) {
          // 忽略读取/etc/shells的错误
        }
      }

      return { success: true, data: shellInfo }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })



  // 番茄钟设置管理
  ipcMain.handle('save-pomodoro-settings', async (event, settings: any) => {
    try {
      fs.writeFileSync(pomodoroSettingsPath, JSON.stringify(settings, null, 2))
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('get-pomodoro-settings', async () => {
    try {
      if (fs.existsSync(pomodoroSettingsPath)) {
        const data = fs.readFileSync(pomodoroSettingsPath, 'utf-8')
        return { success: true, data: JSON.parse(data) }
      } else {
        // 返回默认设置
        const defaultSettings = {
          workDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          longBreakInterval: 4,
          autoStartBreaks: false,
          autoStartWork: false,
          soundEnabled: true,
          notificationEnabled: true
        }
        return { success: true, data: defaultSettings }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 番茄钟统计管理
  ipcMain.handle('save-pomodoro-stats', async (event, stats: any) => {
    try {
      // 添加日期标识
      const today = new Date().toISOString().split('T')[0]
      const statsWithDate = { ...stats, date: today }

      let allStats: any[] = []
      if (fs.existsSync(pomodoroStatsPath)) {
        const data = fs.readFileSync(pomodoroStatsPath, 'utf-8')
        allStats = JSON.parse(data)
      }

      // 查找今天的记录
      const todayIndex = allStats.findIndex((s: any) => s.date === today)
      if (todayIndex >= 0) {
        allStats[todayIndex] = statsWithDate
      } else {
        allStats.push(statsWithDate)
      }

      // 只保留最近30天的数据
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      allStats = allStats.filter((s: any) => new Date(s.date) >= thirtyDaysAgo)

      fs.writeFileSync(pomodoroStatsPath, JSON.stringify(allStats, null, 2))
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('get-pomodoro-stats', async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      if (fs.existsSync(pomodoroStatsPath)) {
        const data = fs.readFileSync(pomodoroStatsPath, 'utf-8')
        const allStats = JSON.parse(data)

        // 查找今天的统计
        const todayStats = allStats.find((s: any) => s.date === today)
        if (todayStats) {
          return { success: true, data: todayStats }
        }
      }

      // 返回默认统计
      const defaultStats = {
        completedSessions: 0,
        totalWorkTime: 0,
        totalBreakTime: 0,
        totalSessions: 0,
        date: today
      }
      return { success: true, data: defaultStats }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取番茄钟历史统计
  ipcMain.handle('get-pomodoro-history', async () => {
    try {
      if (fs.existsSync(pomodoroStatsPath)) {
        const data = fs.readFileSync(pomodoroStatsPath, 'utf-8')
        return { success: true, data: JSON.parse(data) }
      } else {
        return { success: true, data: [] }
      }
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