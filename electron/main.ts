import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as cron from 'node-cron'
import * as os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

let mainWindow: BrowserWindow
const isDev = process.argv.includes('--dev')

// 存储脚本配置的文件路径
const configPath = path.join(app.getPath('userData'), 'scripts-config.json')

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