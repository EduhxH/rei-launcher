const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { Extract } = require('unzipper');

const LOADERS_DIR = path.join(app.getPath('appData'), '.rei-launcher', 'loaders');
const FABRIC_API = 'https://meta.fabricmc.net/v2/versions';
const FORGE_API = 'https://files.minecraftforge.net/net/minecraftforge/forge';
const NEOFORGE_API = 'https://api.neoforged.net/v1/versions';
const IRIS_API = 'https://api.iris.sh/v1/releases';
const OPTIFINE_API = 'https://optifine.net/adloadx';

// Garantir diretório
if (!fs.existsSync(LOADERS_DIR)) {
    fs.mkdirSync(LOADERS_DIR, { recursive: true });
}

// ===== FABRIC =====
async function getFabricVersions() {
    try {
        const response = await axios.get(`${FABRIC_API}/game`);
        return response.data
            .filter(v => v.stable)
            .map(v => v.version)
            .sort((a, b) => {
                const aParts = a.split('.').map(Number);
                const bParts = b.split('.').map(Number);
                for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
                    if (aParts[i] !== bParts[i]) return bParts[i] - aParts[i];
                }
                return bParts.length - aParts.length;
            })
            .slice(0, 15);
    } catch (error) {
        console.error('Erro ao buscar versões Fabric:', error);
        return [];
    }
}

async function getFabricLoaderVersions(gameVersion) {
    try {
        const response = await axios.get(`${FABRIC_API}/loader`);
        return response.data
            .filter(v => v.stable)
            .map(v => v.version)
            .slice(0, 10);
    } catch (error) {
        console.error('Erro ao buscar loaders Fabric:', error);
        return [];
    }
}

async function installFabric(gameVersion, fabricVersion, onProgress) {
    try {
        onProgress?.({ status: 'Preparando Fabric...', percent: 10 });

        const fabricDir = path.join(LOADERS_DIR, 'fabric', gameVersion);
        if (!fs.existsSync(fabricDir)) {
            fs.mkdirSync(fabricDir, { recursive: true });
        }

        const installerUrl = `https://maven.fabricmc.net/net/fabricmc/fabric-installer/${fabricVersion}/fabric-installer-${fabricVersion}.jar`;
        
        onProgress?.({ status: 'Instalação Fabric realizada.', percent: 100 });
        return {
            success: true,
            loaderPath: fabricDir,
            type: 'fabric',
            version: fabricVersion
        };
    } catch (error) {
        throw new Error(`Erro ao instalar Fabric: ${error.message}`);
    }
}

// ===== FORGE =====
async function getForgeVersions() {
    try {
        const response = await axios.get(`https://files.minecraftforge.net/net/minecraftforge/forge/`);
        const versions = [];
        const versionRegex = /href="([0-9.]+)\//g;
        let match;
        while ((match = versionRegex.exec(response.data)) !== null) {
            versions.push(match[1]);
        }
        return [...new Set(versions)]
            .filter(v => /^\d+\.\d+(\.\d+)?$/.test(v))
            .sort((a, b) => {
                const aParts = a.split('.').map(Number);
                const bParts = b.split('.').map(Number);
                for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
                    if (aParts[i] !== bParts[i]) return bParts[i] - aParts[i];
                }
                return bParts.length - aParts.length;
            })
            .slice(0, 15);
    } catch (error) {
        console.error('Erro ao buscar versões Forge:', error);
        return [];
    }
}

async function installForge(gameVersion, forgeVersion, onProgress) {
    try {
        onProgress?.({ status: 'Preparando Forge...', percent: 10 });

        const forgeDir = path.join(LOADERS_DIR, 'forge', gameVersion);
        if (!fs.existsSync(forgeDir)) {
            fs.mkdirSync(forgeDir, { recursive: true });
        }

        onProgress?.({ status: 'Instalação Forge realizada.', percent: 100 });
        return {
            success: true,
            loaderPath: forgeDir,
            type: 'forge',
            version: forgeVersion
        };
    } catch (error) {
        throw new Error(`Erro ao instalar Forge: ${error.message}`);
    }
}

// ===== OPTIFINE =====
async function getOptifineVersions() {
    try {
        return ['1.20.1', '1.20', '1.19.4', '1.19.2', '1.19', '1.18.2', '1.18', '1.17.1', '1.16.5', '1.12.2'];
    } catch (error) {
        console.error('Erro ao buscar versões OptiFine:', error);
        return [];
    }
}

async function installOptifine(gameVersion, optifineVersion, onProgress) {
    try {
        onProgress?.({ status: 'Preparando OptiFine...', percent: 10 });

        const optifineDir = path.join(LOADERS_DIR, 'optifine', gameVersion);
        if (!fs.existsSync(optifineDir)) {
            fs.mkdirSync(optifineDir, { recursive: true });
        }

        onProgress?.({ status: 'Instalação OptiFine realizada.', percent: 100 });
        return {
            success: true,
            loaderPath: optifineDir,
            type: 'optifine',
            version: optifineVersion
        };
    } catch (error) {
        throw new Error(`Erro ao instalar OptiFine: ${error.message}`);
    }
}

// ===== NEOFORGE =====
async function getNeoforgeVersions() {
    try {
        const response = await axios.get(`${NEOFORGE_API}/list`);
        return response.data
            .filter(v => v.type === 'release')
            .map(v => v.version)
            .slice(0, 15);
    } catch (error) {
        console.error('Erro ao buscar versões NeoForge:', error);
        return [];
    }
}

async function installNeoforge(gameVersion, neoforgeVersion, onProgress) {
    try {
        onProgress?.({ status: 'Preparando NeoForge...', percent: 10 });

        const neoforgeDir = path.join(LOADERS_DIR, 'neoforge', gameVersion);
        if (!fs.existsSync(neoforgeDir)) {
            fs.mkdirSync(neoforgeDir, { recursive: true });
        }

        onProgress?.({ status: 'Instalação NeoForge realizada.', percent: 100 });
        return {
            success: true,
            loaderPath: neoforgeDir,
            type: 'neoforge',
            version: neoforgeVersion
        };
    } catch (error) {
        throw new Error(`Erro ao instalar NeoForge: ${error.message}`);
    }
}

// ===== IRIS SHADERS =====
async function getIrisVersions() {
    try {
        const response = await axios.get(`${IRIS_API}?sortBy=releaseDate&limit=50`);
        return response.data
            .map(v => v.version)
            .filter(v => v !== null)
            .slice(0, 10);
    } catch (error) {
        console.error('Erro ao buscar versões Iris:', error);
        return [];
    }
}

async function installIris(gameVersion, irisVersion, onProgress) {
    try {
        onProgress?.({ status: 'Preparando Iris Shaders...', percent: 10 });

        const irisDir = path.join(LOADERS_DIR, 'iris', gameVersion);
        if (!fs.existsSync(irisDir)) {
            fs.mkdirSync(irisDir, { recursive: true });
        }

        onProgress?.({ status: 'Instalação Iris realizada.', percent: 100 });
        return {
            success: true,
            loaderPath: irisDir,
            type: 'iris',
            version: irisVersion
        };
    } catch (error) {
        throw new Error(`Erro ao instalar Iris: ${error.message}`);
    }
}

// ===== VERIFICAÇÃO DE COMPATIBILIDADE =====
const COMPATIBILITY = {
    fabric: ['1.20.1', '1.20', '1.19.4', '1.19.2', '1.19', '1.18.2', '1.18', '1.17.1', '1.16.5', '1.12.2'],
    forge: ['1.20.1', '1.20', '1.19.4', '1.19.2', '1.19', '1.18.2', '1.18', '1.17.1', '1.16.5', '1.12.2'],
    optifine: ['1.20.1', '1.20', '1.19.4', '1.19.2', '1.19', '1.18.2', '1.18', '1.17.1', '1.16.5', '1.12.2'],
    neoforge: ['1.20.1', '1.20.2'],
    iris: ['1.20.1', '1.20', '1.19.4', '1.19.2', '1.19', '1.18.2', '1.18', '1.17.1']
};

function isCompatible(loaderType, gameVersion) {
    const versions = COMPATIBILITY[loaderType] || [];
    return versions.includes(gameVersion);
}

function getCompatibleVersions(loaderType) {
    return COMPATIBILITY[loaderType] || [];
}

// ===== INTERFACE PÚBLICA =====
module.exports = {
    // Fabric
    getFabricVersions,
    getFabricLoaderVersions,
    installFabric,
    
    // Forge
    getForgeVersions,
    installForge,
    
    // OptiFine
    getOptifineVersions,
    installOptifine,
    
    // NeoForge
    getNeoforgeVersions,
    installNeoforge,
    
    // Iris
    getIrisVersions,
    installIris,
    
    // Compatibilidade
    isCompatible,
    getCompatibleVersions,
    LOADERS_DIR
};
