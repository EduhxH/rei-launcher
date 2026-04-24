const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('launcher', {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close:    () => ipcRenderer.send('window:close')
  },
  auth: {
    microsoft: () => ipcRenderer.invoke('auth:microsoft'),
    offline: (username) => ipcRenderer.invoke('auth:offline', username)
  },
  accounts: {
    get: () => ipcRenderer.invoke('accounts:get'),
    getActive: () => ipcRenderer.invoke('account:getActive'),
    addOffline: (username) => ipcRenderer.invoke('account:addOffline', username),
    addMicrosoft: () => ipcRenderer.invoke('account:addMicrosoft'),
    setActive: (id) => ipcRenderer.invoke('account:setActive', id),
    remove: (id) => ipcRenderer.invoke('account:remove', id)
  },
  java: {
    detect: () => ipcRenderer.invoke('java:detect')
  },
  minecraft: {
    download: (version) => ipcRenderer.invoke('minecraft:download', version),
    launch:   (config)  => ipcRenderer.invoke('minecraft:launch', config)
  },
  versions: {
    get: () => ipcRenderer.invoke('versions:get')
  },
  screenshots: {
    get: () => ipcRenderer.invoke('screenshots:get'),
    open: (path) => ipcRenderer.invoke('screenshots:open', path)
  },
  modrinth: {
    open: () => ipcRenderer.invoke('modrinth:open')
  },
  skins: {
    openNameMC: (username) => ipcRenderer.invoke('skins:openNameMC', username)
  },
  instances: {
    get:    ()     => ipcRenderer.invoke('instances:get'),
    create: (data) => ipcRenderer.invoke('instances:create', data),
    delete: (id)   => ipcRenderer.invoke('instances:delete', id)
  },
  settings: {
    get: ()     => ipcRenderer.invoke('settings:get'),
    set: (data) => ipcRenderer.invoke('settings:set', data)
  },
  account: {
    get:   ()     => ipcRenderer.invoke('account:get'),
    set:   (data) => ipcRenderer.invoke('account:set', data),
    clear: ()     => ipcRenderer.invoke('account:clear')
  },
  on: {
    downloadProgress: (callback) => {
      ipcRenderer.on('download:progress', (event, data) => callback(data))
    },
    gameLog: (callback) => {
      ipcRenderer.on('game:log', (event, log) => callback(log))
    }
  },
  off: {
    downloadProgress: () => ipcRenderer.removeAllListeners('download:progress'),
    gameLog: () => ipcRenderer.removeAllListeners('game:log')
  }
})