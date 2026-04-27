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
const { getRemoteVersions, getLoaderVersions, getLoaderSubVersions, isVersionCompatibleWithLoader, getCompatibleLoadersForVersion } = require('./launcher/versions.js');
const { launchGame } = require('./launcher/mcl-core.js');
const { detectJava } = require('./launcher/java.js');
const loaders = require('./launcher/loaders.js');
const modifiers = require('./launcher/modifiers.js');

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
ipcMain.handle('minecraft:launch', async (event, { version, modifierType, modifierVersion }) => {
    try {
        // Se houver modificador, configurar antes de lançar
        if (modifierType && modifierType !== 'vanilla') {
            if (!modifiers.isModifierInstalled(version, modifierType)) {
                const configResult = await modifiers.configureModifier(version, modifierType, modifierVersion);
                if (!configResult.success) {
                    throw new Error('Erro ao configurar modificador');
                }
            }
        }

        const result = await launchGame(
            version,
            modifierType || 'vanilla',
            modifierVersion || '',
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

// --- LOADERS ---
ipcMain.handle('loaders:getVersions', async (event, loaderType) => {
    try {
        return await getLoaderVersions(loaderType);
    } catch (err) {
        console.error(`Erro ao buscar versões de ${loaderType}:`, err);
        return [];
    }
});

ipcMain.handle('loaders:getSubVersions', async (event, { loaderType, gameVersion }) => {
    try {
        return await getLoaderSubVersions(loaderType, gameVersion);
    } catch (err) {
        console.error(`Erro ao buscar sub-versões:`, err);
        return [];
    }
});

ipcMain.handle('loaders:isCompatible', async (event, { loaderType, gameVersion }) => {
    return isVersionCompatibleWithLoader(gameVersion, loaderType);
});

ipcMain.handle('loaders:getCompatible', async (event, gameVersion) => {
    try {
        return getCompatibleLoadersForVersion(gameVersion);
    } catch (err) {
        console.error('Erro ao buscar loaders compatíveis:', err);
        return [];
    }
});

ipcMain.handle('loaders:install', async (event, { loaderType, gameVersion, loaderVersion }) => {
    try {
        let result;
        const onProgress = (data) => {
            mainWindow?.webContents.send('loader:installProgress', data);
        };

        switch (loaderType) {
            case 'fabric':
                result = await loaders.installFabric(gameVersion, loaderVersion, onProgress);
                break;
            case 'forge':
                result = await loaders.installForge(gameVersion, loaderVersion, onProgress);
                break;
            case 'optifine':
                result = await loaders.installOptifine(gameVersion, loaderVersion, onProgress);
                break;
            case 'neoforge':
                result = await loaders.installNeoforge(gameVersion, loaderVersion, onProgress);
                break;
            case 'iris':
                result = await loaders.installIris(gameVersion, loaderVersion, onProgress);
                break;
            default:
                throw new Error('Tipo de loader desconhecido');
        }

        // Configurar modificador após instalar
        if (result.success) {
            const configResult = await modifiers.configureModifier(gameVersion, loaderType, loaderVersion);
            return { ...result, configured: configResult.success };
        }

        return result;
    } catch (err) {
        console.error('[loaders:install]', err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('loaders:isInstalled', async (event, { gameVersion, loaderType }) => {
    return modifiers.isModifierInstalled(gameVersion, loaderType);
});

ipcMain.handle('loaders:getInstalled', async (event) => {
    try {
        return modifiers.getInstalledModifiers();
    } catch (err) {
        console.error('Erro ao listar modificadores instalados:', err);
        return [];
    }
});

ipcMain.handle('loaders:remove', async (event, { gameVersion, loaderType }) => {
    try {
        const success = modifiers.removeModifier(gameVersion, loaderType);
        return { success };
    } catch (err) {
        console.error('Erro ao remover modificador:', err);
        return { success: false, error: err.message };
    }
});

// --- INIT ---
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});