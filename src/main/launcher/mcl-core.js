const { Client, Authenticator } = require('minecraft-launcher-core');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { detectJava } = require('./java');
const store = require('../store/store');

const launcher = new Client();
const MINECRAFT_DIR = path.join(app.getPath('appData'), '.rei-launcher');

async function launchGame(version, onProgress, onLog) {
    return new Promise(async (resolve, reject) => {
        try {
            const account = store.get('account');
            const settings = store.get('settings') || { ram: 4096 };
            
            // Validação de Java antes de iniciar o jogo
        let javaPath = settings.javaPath;

// Função para tentar encontrar o Java automaticamente no Windows
function findJavaAuto() {
    const commonPaths = [
        process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'javaw.exe') : null,
        'C:\\Program Files\\Common Files\\Oracle\\Java\\javapath\\javaw.exe',
        'C:\\Program Files\\Java\\jdk-17\\bin\\javaw.exe',
        'C:\\Program Files\\Java\\jdk-21\\bin\\javaw.exe',
        'C:\\Program Files (x86)\\Common Files\\Oracle\\Java\\javapath\\javaw.exe'
    ];

    for (let p of commonPaths) {
        if (p && fs.existsSync(p)) return p;
    }
    return 'java'; // Fallback para o comando global se nada for encontrado
}

// Lógica de validação
if (!javaPath || javaPath === 'java') {
    javaPath = findJavaAuto();
}

if (javaPath !== 'java' && !fs.existsSync(javaPath)) {
    return reject(new Error(`Caminho Java inválido: ${javaPath}`));
}

            // Autenticação simplificada (offline ou Microsoft)
            let auth;
            if (account) {
                if (account.type === 'microsoft') {
                    auth = {
                        access_token: account.accessToken,
                        client_token: account.clientToken,
                        uuid: account.uuid,
                        name: account.username
                    };
                } else {
                    auth = await Authenticator.getAuth(account.username);
                }
            } else {
                auth = await Authenticator.getAuth('Player');
            }

            const opts = {
                authorization: auth,
                root: MINECRAFT_DIR,
                version: { number: version, type: 'release' },
                memory: {
                    max: `${settings.ram}M`,
                    min: '1024M'
                },
                javaPath
            };

            launcher.once('debug', (e) => onLog?.(e));
            launcher.once('progress', (e) => onProgress?.(e));
            launcher.once('close', (code) => {
                if (code === 0) {
                    resolve({ success: true });
                } else {
                    reject(new Error(`Jogo encerrado com código: ${code}`));
                }
            });
            launcher.once('error', (err) => reject(err));

            launcher.launch(opts);
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { launchGame };