// ═══════════════════════════════════════════
//  REI LAUNCHER — Preload (contextBridge)
//  No nodeIntegration. All calls go through IPC.
// ═══════════════════════════════════════════
'use strict'

const { contextBridge, ipcRenderer } = require('electron')

const launcher = {
    window: {
        minimize: () => ipcRenderer.send('window:minimize'),
        maximize: () => ipcRenderer.send('window:maximize'),
        close: () => ipcRenderer.send('window:close')
    },

    minecraft: {
        launch: (opts) => ipcRenderer.invoke('minecraft:launch', opts)
    },

    accounts: {
        get: () => ipcRenderer.invoke('accounts:get'),
        getActive: () => ipcRenderer.invoke('account:getActive'),
        addOffline: (username) => ipcRenderer.invoke('account:addOffline', username),
        addMicrosoft: () => ipcRenderer.invoke('account:addMicrosoft'),
        setActive: (id) => ipcRenderer.invoke('account:setActive', id),
        remove: (id) => ipcRenderer.invoke('account:remove', id)
    },

    screenshots: {
        get: () => ipcRenderer.invoke('screenshots:get'),
        open: (path) => ipcRenderer.invoke('screenshots:open', path)
    },

    settings: {
        get: () => ipcRenderer.invoke('settings:get'),
        set: (settings) => ipcRenderer.invoke('settings:set', settings)
    },

    java: {
        detect: () => ipcRenderer.invoke('java:detect')
    },

    loaders: {
        getVersions: (loaderType) => ipcRenderer.invoke('loaders:getVersions', loaderType),
        getSubVersions: (params) => ipcRenderer.invoke('loaders:getSubVersions', params),
        isCompatible: (params) => ipcRenderer.invoke('loaders:isCompatible', params),
        getCompatible: (gameVersion) => ipcRenderer.invoke('loaders:getCompatible', gameVersion),
        install: (params) => ipcRenderer.invoke('loaders:install', params),
        isInstalled: (params) => ipcRenderer.invoke('loaders:isInstalled', params),
        getInstalled: () => ipcRenderer.invoke('loaders:getInstalled'),
        remove: (params) => ipcRenderer.invoke('loaders:remove', params)
    },

    auth: {
        logout: () => ipcRenderer.invoke('auth:logout')
    },

    on: (event, callback) => {
        if (event === 'downloadProgress') {
            ipcRenderer.on('download:progress', (_, data) => callback(data));
        }
    }
};

contextBridge.exposeInMainWorld('launcher', launcher);

contextBridge.exposeInMainWorld('reiAPI', {

  // ── Window ─────────────────────────────
  minimize:     () => ipcRenderer.send('window:minimize'),
  maximize:     () => ipcRenderer.send('window:maximize'),
  close:        () => ipcRenderer.send('window:close'),
  navigateTo:   (f) => ipcRenderer.send('nav:to', f),

  // ── Auth ───────────────────────────────
  loginOffline:   (u)  => ipcRenderer.invoke('auth:offline', u),
  loginMicrosoft: ()   => ipcRenderer.invoke('auth:microsoft'),
  logout:         ()   => ipcRenderer.invoke('auth:logout'),
  getAccount:     ()   => ipcRenderer.invoke('auth:getAccount'),

  // ── Launch ─────────────────────────────
  launchGame: (opts) => ipcRenderer.invoke('launch:start', opts),
  onLaunchProgress: (cb) => ipcRenderer.on('launch:progress', (_, d) => cb(d)),
  onLaunchLog:      (cb) => ipcRenderer.on('launch:log',      (_, l) => cb(l)),
  onLaunchClosed:   (cb) => ipcRenderer.on('launch:closed',   (_, c) => cb(c)),

  // ── Java ───────────────────────────────
  detectJava: () => ipcRenderer.invoke('java:detect'),

  // ── Settings ───────────────────────────
  getSettings:  ()    => ipcRenderer.invoke('settings:get'),
  saveSettings: (d)   => ipcRenderer.invoke('settings:save', d),
  browseFile:   (o)   => ipcRenderer.invoke('dialog:file', o),
  browseFolder: ()    => ipcRenderer.invoke('dialog:folder'),

  // ── Updater ────────────────────────────
  onUpdateAvailable:  (cb) => ipcRenderer.on('updater:available', () => cb()),
  onUpdateProgress:   (cb) => ipcRenderer.on('updater:progress',  (_, d) => cb(d)),
  onUpdateDownloaded: (cb) => ipcRenderer.on('updater:downloaded', () => cb()),
  installUpdate:      ()   => ipcRenderer.send('updater:install'),

  // ── Misc ───────────────────────────────
  getVersion:    ()    => ipcRenderer.invoke('app:version'),
  openExternal:  (url) => ipcRenderer.invoke('app:external', url),
})
