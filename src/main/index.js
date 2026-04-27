// ═══════════════════════════════════════════
//  REI LAUNCHER — Main Process
//  Electron 28 | contextIsolation: true
// ═══════════════════════════════════════════
'use strict'

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs   = require('fs')

let win = null

// ── Auto-updater (production only) ────────
let autoUpdater = null
if (app.isPackaged) {
  try {
    autoUpdater = require('electron-updater').autoUpdater
    autoUpdater.autoDownload = false
  } catch { /* not installed */ }
}

// ── Config ────────────────────────────────
const CONFIG_PATH = path.join(app.getPath('userData'), 'rei-config.json')

const DEFAULT_CONFIG = {
  java:     { path: '', args: '-XX:+UseG1GC -XX:+UnlockExperimentalVMOptions -XX:G1NewSizePercent=20', maxRam: 2 },
  game:     { version: '1.21.4', dir: null, keepOpen: false },
  launcher: { autoUpdate: true, devMode: false },
  account:  null,
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
      return { ...DEFAULT_CONFIG, ...raw }
    }
  } catch { /* use defaults */ }
  return { ...DEFAULT_CONFIG }
}

function saveConfig(cfg) {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true })
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8')
  } catch (e) { console.error('[Config] Save error:', e.message) }
}

let CONFIG = loadConfig()

// ── Window ────────────────────────────────
function createWindow() {
  win = new BrowserWindow({
    width:     980,
    height:    600,
    minWidth:  860,
    minHeight: 540,
    frame:     false,
    resizable: true,
    backgroundColor: '#111114',
    show: false,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
    },
    icon: path.join(__dirname, '../../src/assets/icons/icon.png'),
  })

  win.loadFile(path.join(__dirname, '../../src/renderer/app.html'))

  win.once('ready-to-show', () => win.show())

  if (!app.isPackaged) {
    win.webContents.openDevTools({ mode: 'detach' })
  }

  win.on('closed', () => { win = null })
}

app.whenReady().then(() => {
  createWindow()

  if (autoUpdater) {
    autoUpdater.checkForUpdates().catch(() => {})
    autoUpdater.on('update-available', () => win?.webContents.send('updater:available'))
    autoUpdater.on('download-progress', p => win?.webContents.send('updater:progress', p))
    autoUpdater.on('update-downloaded', () => win?.webContents.send('updater:downloaded'))
  }
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })

// ═══════════════════════════════════════════
//  IPC HANDLERS
// ═══════════════════════════════════════════

// ── Window controls ───────────────────────
ipcMain.on('win:minimize', () => win?.minimize())
ipcMain.on('win:maximize', () => win?.isMaximized() ? win.unmaximize() : win?.maximize())
ipcMain.on('win:close',    () => win?.close())

// ── Navigation ────────────────────────────
ipcMain.on('nav:to', (_, file) => {
  const allowed = ['app.html', 'index.html']
  if (allowed.includes(file)) win?.loadFile(path.join(__dirname, '../../src/renderer', file))
})

// ── Auth: Offline ─────────────────────────
ipcMain.handle('auth:offline', (_, username) => {
  username = (username || '').trim()
  if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
    return { success: false, error: 'Username must be 3-16 chars (letters, numbers, _)' }
  }
  const { v4: uuidv4 } = require('uuid')
  const account = { name: username, uuid: uuidv4(), type: 'offline', accessToken: 'offline' }
  CONFIG.account = account
  saveConfig(CONFIG)
  return { success: true, account: { name: account.name, type: account.type, uuid: account.uuid } }
})

// ── Auth: Microsoft (msmc) ────────────────
ipcMain.handle('auth:microsoft', async () => {
  try {
    const { Auth } = require('msmc')
    const auth = new Auth('select_account')
    const xbox = await auth.launch('electron', { parent: win, resizable: false })
    const mc   = await xbox.getMinecraft()

    const account = {
      name:        mc.profile.name,
      uuid:        mc.profile.id,
      type:        'microsoft',
      accessToken: mc.mclc().auth,
    }
    CONFIG.account = account
    saveConfig(CONFIG)

    return { success: true, account: { name: account.name, type: account.type, uuid: account.uuid } }
  } catch (e) {
    console.error('[Auth:MS]', e.message)
    return { success: false, error: e.message }
  }
})

// ── Auth: Logout ──────────────────────────
ipcMain.handle('auth:logout', () => {
  CONFIG.account = null
  saveConfig(CONFIG)
  return { success: true }
})

ipcMain.handle('auth:getAccount', () => {
  const a = CONFIG.account
  if (!a) return null
  return { name: a.name, type: a.type, uuid: a.uuid }
})

// ── Launch ────────────────────────────────
ipcMain.handle('launch:start', async (event, opts) => {
  const account = CONFIG.account
  if (!account) return { success: false, error: 'No account — please log in first.' }

  try {
    const { Client } = require('minecraft-launcher-core')
    const launcher   = new Client()

    // Build auth object (replaces deprecated Authenticator.getOfflineAuth)
    let auth
    if (account.type === 'offline') {
      // ✅ Correct offline auth for minecraft-launcher-core v3+
      auth = {
        access_token:    'offline',
        client_token:    account.uuid,
        uuid:            account.uuid,
        name:            account.name,
        user_properties: '{}',
        meta: { type: 'mojang', demo: false },
      }
    } else {
      // Microsoft
      auth = {
        access_token:    account.accessToken,
        client_token:    account.uuid,
        uuid:            account.uuid,
        name:            account.name,
        user_properties: '{}',
        meta: { type: 'msa' },
      }
    }

    const version  = opts.version  || CONFIG.game.version || '1.21.4'
    const maxRam   = opts.maxRam   || (CONFIG.java.maxRam + 'G') || '2G'
    const gameDir  = CONFIG.game.dir || path.join(
      process.env.APPDATA || process.env.HOME || '',
      '.minecraft'
    )
    const javaPath = CONFIG.java.path || 'java'

    const launchOpts = {
      clientPackage: null,
      authorization: auth,
      root:    gameDir,
      version: { number: version, type: 'release' },
      memory:  { max: maxRam, min: '512M' },
      javaPath,
      overrides: { gameDirectory: gameDir, detached: true },
    }

    launcher.on('debug',    msg => {
      win?.webContents.send('launch:log', String(msg))
    })
    launcher.on('data',     line => {
      win?.webContents.send('launch:log', String(line))
    })
    launcher.on('progress', data => {
      win?.webContents.send('launch:progress', data)
    })
    launcher.on('close', code => {
      win?.webContents.send('launch:closed', code)
      if (!CONFIG.game.keepOpen) win?.show()
    })

    await launcher.launch(launchOpts)

    if (!CONFIG.game.keepOpen) {
      setTimeout(() => win?.hide(), 1500)
    }

    return { success: true }
  } catch (e) {
    console.error('[Launch]', e.message)
    return { success: false, error: e.message }
  }
})

// ── Java detection ────────────────────────
ipcMain.handle('java:detect', async () => {
  const { exec } = require('child_process')
  const tryJava = (exe) => new Promise(resolve => {
    exec(`"${exe}" -version`, (err, _, stderr) => {
      if (err) return resolve(null)
      const m = stderr.match(/version "(.+?)"/)
      resolve(m ? m[1] : 'unknown')
    })
  })

  const candidates = [
    CONFIG.java.path,
    process.env.JAVA_HOME ? require('path').join(process.env.JAVA_HOME, 'bin', 'java') : null,
    'java',
  ].filter(Boolean)

  for (const exe of candidates) {
    const ver = await tryJava(exe)
    if (ver) return { found: true, version: ver, path: exe }
  }
  return { found: false }
})

// ── Settings ──────────────────────────────
ipcMain.handle('settings:get', () => ({
  javaPath:   CONFIG.java.path,
  jvmArgs:    CONFIG.java.args,
  maxRam:     CONFIG.java.maxRam,
  gameDir:    CONFIG.game.dir || '',
  keepOpen:   CONFIG.game.keepOpen,
  version:    CONFIG.game.version,
  autoUpdate: CONFIG.launcher.autoUpdate,
  devMode:    CONFIG.launcher.devMode,
}))

ipcMain.handle('settings:save', (_, data) => {
  try {
    if (data.javaPath   != null) CONFIG.java.path        = data.javaPath
    if (data.jvmArgs    != null) CONFIG.java.args        = data.jvmArgs
    if (data.maxRam     != null) CONFIG.java.maxRam      = data.maxRam
    if (data.gameDir    != null) CONFIG.game.dir         = data.gameDir
    if (data.keepOpen   != null) CONFIG.game.keepOpen    = data.keepOpen
    if (data.version    != null) CONFIG.game.version     = data.version
    if (data.autoUpdate != null) CONFIG.launcher.autoUpdate = data.autoUpdate
    saveConfig(CONFIG)
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

// ── File dialogs ──────────────────────────
ipcMain.handle('dialog:file', async (_, opts = {}) => {
  const res = await dialog.showOpenDialog(win, {
    title: opts.title || 'Select file',
    properties: ['openFile'],
    filters: opts.filters || [{ name: 'All', extensions: ['*'] }],
  })
  return res.canceled ? null : res.filePaths[0]
})

ipcMain.handle('dialog:folder', async () => {
  const res = await dialog.showOpenDialog(win, {
    properties: ['openDirectory', 'createDirectory'],
  })
  return res.canceled ? null : res.filePaths[0]
})

// ── Shell / misc ──────────────────────────
ipcMain.handle('app:version',  () => app.getVersion())
ipcMain.handle('app:external', (_, url) => { if (url.startsWith('http')) shell.openExternal(url) })
ipcMain.on('updater:install',  () => autoUpdater?.quitAndInstall?.())
