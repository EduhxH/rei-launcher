const { Client, Authenticator } = require('minecraft-launcher-core');
const { detectJava } = require('./java'); // Usaremos a versão melhorada abaixo
const { MINECRAFT_DIR } = require('../main/constants');
const store = require('../store/store');

const launcher = new Client();

async function startProgressiveLaunch(version, onProgress, onLog) {
    const account = store.get('account');
    const settings = store.get('settings');
    
    // 1. Detecção Inteligente de Java
    const javaRes = await detectJava();
    const javaPath = settings.javaPath || (javaRes.installed ? javaRes.path : 'java');

    const opts = {
        authorization: account.type === 'microsoft' ? 
            { access_token: account.accessToken, client_token: account.id, uuid: account.uuid, name: account.username } : 
            await Authenticator.getAuth(account.username),
        root: MINECRAFT_DIR,
        version: {
            number: version,
            type: "release"
        },
        memory: {
            max: `${settings.ram}M`,
            min: "512M"
        },
        javaPath: javaPath,
        overrides: {
            detached: false
        }
    };

    // Eventos de Download e Log
    launcher.on('debug', (e) => onLog(e));
    launcher.on('data', (e) => onLog(e));
    launcher.on('progress', (e) => onProgress(e));

    try {
        await launcher.launch(opts);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

module.exports = { startProgressiveLaunch };