const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const ejse = require('ejs-electron');
ejse.options('root', path.join(__dirname, '../renderer'));
const store = require('./store/store.js'); 

// offline em src/main/auth/
const { createOfflineAccount } = require('./auth/offline.js');
const { authenticateMicrosoft } = require('./auth/microsoft.js');

// launcher em src/main/launcher/
const { getRemoteVersions } = require('./launcher/versions.js');
const { launchGame } = require('./launcher/mcl-core.js');
const { detectJava } = require('./launcher/java.js');

let mainWindow;

async function createWindow() {
  // Configurar dados para o EJS
   const remoteVersions = await getRemoteVersions();
    

    ejse.data({
        // Se não houver conta, enviamos um objeto vazio para o EJS não crashar
        account: store.get('account') || { username: 'Convidado' }, 
        settings: store.get('settings') || { ram: 4096 },
        remoteVersions: remoteVersions || ['1.20.1'] // Garante que a lista não vá vazia
    });

    mainWindow = new BrowserWindow({
        width: 1100,
        height: 700,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js') // O preload está na mesma pasta (src/main)
        }
    });

    // CAMINHO DO INDEX: Sair de 'main' e entrar em 'renderer'
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.ejs'));

    // Uncomment para devtools
    // mainWindow.webContents.openDevTools();
}

// --- EVENTOS DA JANELA ---
ipcMain.on('window:close', () => app.quit());
ipcMain.on('window:minimize', () => mainWindow.minimize());
ipcMain.on('window:maximize', () => mainWindow.maximize());

// --- MINECRAFT LAUNCH ---
ipcMain.handle('minecraft:launch', async (event, { version }) => {
    try {
        const result = await launchGame(
            version,
            (progress) => mainWindow.webContents.send('download:progress', progress),
            (log) => mainWindow.webContents.send('game:log', log)
        );
        return result;
    } catch (err) {
        console.error('[minecraft:launch]', err);
        return { success: false, error: err.message };
    }
});

// --- AUTH ---
ipcMain.handle('auth:offline', async (event, username) => {
    try {
        const res = await createOfflineAccount(username);
        if (res.success) store.set('account', res.account);
        return res;
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('auth:logout', async (event) => {
    store.delete('account');
    return { success: true };
});

// --- ACCOUNTS ---
ipcMain.handle('accounts:get', async (event) => {
    try {
        const accounts = store.get('accounts') || [];
        return accounts;
    } catch (err) {
        return [];
    }
});

ipcMain.handle('account:getActive', async (event) => {
    return store.get('account') || null;
});

ipcMain.handle('account:addOffline', async (event, username) => {
    try {
        const res = await createOfflineAccount(username);
        if (res.success) {
            const accounts = store.get('accounts') || [];
            accounts.push(res.account);
            store.set('accounts', accounts);
            if (!store.get('account')) {
                store.set('account', res.account);
            }
        }
        return res;
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('account:addMicrosoft', async (event) => {
    try {
        const res = await authenticateMicrosoft();
        if (res.success) {
            const accounts = store.get('accounts') || [];
            accounts.push(res.account);
            store.set('accounts', accounts);
            if (!store.get('account')) {
                store.set('account', res.account);
            }
        }
        return res;
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('account:setActive', async (event, id) => {
    try {
        const accounts = store.get('accounts') || [];
        const account = accounts.find(a => a.id === id);
        if (account) {
            store.set('account', account);
            return { success: true };
        }
        return { success: false, error: 'Conta não encontrada' };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('account:remove', async (event, id) => {
    try {
        let accounts = store.get('accounts') || [];
        accounts = accounts.filter(a => a.id !== id);
        store.set('accounts', accounts);
        
        const active = store.get('account');
        if (active && active.id === id) {
            store.delete('account');
        }
        
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// --- SCREENSHOTS ---
ipcMain.handle('screenshots:get', async (event) => {
    try {
        const screenshotsDir = path.join(app.getPath('appData'), '.minecraft', 'screenshots');
        
        if (!fs.existsSync(screenshotsDir)) {
            return [];
        }
        
        const files = fs.readdirSync(screenshotsDir)
            .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
            .map(file => path.join(screenshotsDir, file))
            .sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime);
        
        return files;
    } catch (err) {
        console.error('Screenshots error:', err);
        return [];
    }
});

ipcMain.handle('screenshots:open', async (event, filePath) => {
    try {
        shell.openPath(filePath);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// --- VERSIONS ---
ipcMain.handle('versions:get', async (event) => {
    try {
        return await getRemoteVersions();
    } catch (err) {
        return ['1.20.1'];
    }
});

// --- SETTINGS ---
ipcMain.handle('settings:get', async (event) => {
    return store.get('settings') || { ram: 4096 };
});

ipcMain.handle('settings:set', async (event, settings) => {
    try {
        store.set('settings', settings);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// --- JAVA ---
ipcMain.handle('java:detect', async (event) => {
    try {
        const javaPath = await detectJava();
        return { path: javaPath };
    } catch (err) {
        return { error: err.message };
    }
});

// --- INIT ---
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});