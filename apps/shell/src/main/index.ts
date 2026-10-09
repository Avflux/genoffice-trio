import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import log from 'electron-log'

log.transports.file.level = 'info'
log.transports.console.level = 'debug'

const RENDERERS = {
  docs: process.env.DOCS_RENDERER_URL || 'http://localhost:5173',
  sheets: process.env.SHEETS_RENDERER_URL || 'http://localhost:5174',
  pdf: process.env.PDF_RENDERER_URL || 'http://localhost:5175',
}

const SHELL_URL = process.env.SHELL_RENDERER_URL || 'http://localhost:5176'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
    backgroundColor: '#ffffff',
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.NODE_ENV === 'development') {
    const loadDev = (retries = 15) => {
      mainWindow?.loadURL(SHELL_URL).catch(() => {
        if (retries > 0) {
          setTimeout(() => loadDev(retries - 1), 1000)
        }
      })
    }
    loadDev()
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  log.info('App ready')
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  log.info('App quitting')
})

// IPC handlers para comunicação com renderers
ipcMain.handle('app:get-language', () => 'zh')
ipcMain.handle('app:get-theme', () => 'system')
ipcMain.handle('app:get-document-theme', () => 'follow')
ipcMain.handle('app:get-ai-panel-prefs', () => ({}))

// Navegação entre apps (tabs)
ipcMain.handle('tab:switch', (_event, tab: 'docs' | 'sheets' | 'pdf') => {
  const url = RENDERERS[tab]
  if (mainWindow && mainWindow.webContents) {
    mainWindow.loadURL(url)
  }
  return { success: true }
})

// Abrir arquivos externos
ipcMain.on('shell:open-external', (_event, url: string) => {
  shell.openExternal(url)
})
