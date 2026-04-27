const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const MINECRAFT_DIR = path.join(app.getPath('appData'), '.rei-launcher');

/**
 * Configurar modificador de jogo (loader + versão)
 * Prepara os arquivos e configurações necessárias
 */
async function configureModifier(gameVersion, modifierType, modifierVersion) {
    try {
        const profileDir = path.join(MINECRAFT_DIR, '.minecraft', 'versions', `${gameVersion}-${modifierType}`);
        
        if (!fs.existsSync(profileDir)) {
            fs.mkdirSync(profileDir, { recursive: true });
        }

        // Criar arquivo de versão JSON com informações do loader
        const versionJson = {
            id: `${gameVersion}-${modifierType}`,
            inheritsFrom: gameVersion,
            releaseTime: new Date().toISOString(),
            time: new Date().toISOString(),
            type: 'release',
            minecraftArguments: getModifierArguments(modifierType),
            libraries: getModifierLibraries(modifierType, modifierVersion),
            mainClass: getModifierMainClass(modifierType),
            modifier: {
                type: modifierType,
                version: modifierVersion
            }
        };

        const versionJsonPath = path.join(profileDir, `${gameVersion}-${modifierType}.json`);
        fs.writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, 2));

        return {
            success: true,
            configPath: versionJsonPath,
            profileDir: profileDir,
            id: versionJson.id
        };
    } catch (error) {
        throw new Error(`Erro ao configurar modificador: ${error.message}`);
    }
}

/**
 * Obter argumentos específicos do modificador
 */
function getModifierArguments(modifierType) {
    const baseArgs = '${auth_player_name} ${auth_session} ${auth_uuid} ${auth_access_token} ${version_name} ${version_type} ${assets_index_name} ${user_properties} ${user_type} ${demo} ${resolution_width} ${resolution_height}';
    
    switch (modifierType) {
        case 'fabric':
            return baseArgs + ' --loader-version=${loader_version}';
        case 'forge':
            return baseArgs + ' --forge-version=${forge_version}';
        case 'neoforge':
            return baseArgs + ' --neoforge-version=${neoforge_version}';
        case 'optifine':
            return baseArgs + ' --optifine-version=${optifine_version}';
        case 'iris':
            return baseArgs + ' --iris-version=${iris_version}';
        default:
            return baseArgs;
    }
}

/**
 * Obter bibliotecas específicas do modificador
 */
function getModifierLibraries(modifierType, modifierVersion) {
    const libraries = [];

    switch (modifierType) {
        case 'fabric':
            libraries.push({
                name: `net.fabricmc:fabric-loader:${modifierVersion}`,
                url: `https://maven.fabricmc.net/`
            });
            libraries.push({
                name: 'net.fabricmc:fabric-api:1.0.0',
                url: 'https://maven.fabricmc.net/'
            });
            break;

        case 'forge':
            libraries.push({
                name: `net.minecraftforge:forge:${modifierVersion}:universal`,
                url: 'https://files.minecraftforge.net/maven/'
            });
            break;

        case 'neoforge':
            libraries.push({
                name: `net.neoforged:neoforge:${modifierVersion}`,
                url: 'https://maven.neoforged.net/releases/'
            });
            break;

        case 'optifine':
            libraries.push({
                name: `optifine:OptiFine:${modifierVersion}`,
                url: 'https://optifine.net/'
            });
            break;

        case 'iris':
            libraries.push({
                name: `net.irisshaders:iris:${modifierVersion}`,
                url: 'https://maven.irisshaders.net/release/'
            });
            libraries.push({
                name: 'net.fabricmc:fabric-loader:0.14.0',
                url: 'https://maven.fabricmc.net/'
            });
            break;
    }

    return libraries;
}

/**
 * Obter classe principal específica do modificador
 */
function getModifierMainClass(modifierType) {
    switch (modifierType) {
        case 'fabric':
            return 'net.fabricmc.loader.launch.knot.KnotClient';
        case 'forge':
            return 'net.minecraftforge.fml.loading.FMLClientHandler';
        case 'neoforge':
            return 'net.neoforged.neoforge.client.loading.NeoForgeClientHandler';
        case 'optifine':
            return 'net.minecraft.client.main.Main';
        case 'iris':
            return 'net.fabricmc.loader.launch.knot.KnotClient';
        default:
            return 'net.minecraft.client.main.Main';
    }
}

/**
 * Verificar se modificador está instalado
 */
function isModifierInstalled(gameVersion, modifierType) {
    const versionJsonPath = path.join(
        MINECRAFT_DIR,
        '.minecraft',
        'versions',
        `${gameVersion}-${modifierType}`,
        `${gameVersion}-${modifierType}.json`
    );
    return fs.existsSync(versionJsonPath);
}

/**
 * Remover modificador instalado
 */
function removeModifier(gameVersion, modifierType) {
    try {
        const profileDir = path.join(
            MINECRAFT_DIR,
            '.minecraft',
            'versions',
            `${gameVersion}-${modifierType}`
        );

        if (fs.existsSync(profileDir)) {
            fs.rmSync(profileDir, { recursive: true, force: true });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao remover modificador:', error);
        return false;
    }
}

/**
 * Obter lista de modificadores instalados
 */
function getInstalledModifiers() {
    try {
        const versionsDir = path.join(MINECRAFT_DIR, '.minecraft', 'versions');
        if (!fs.existsSync(versionsDir)) return [];

        const dirs = fs.readdirSync(versionsDir);
        const modifiers = [];

        dirs.forEach(dir => {
            const match = dir.match(/^([\d.]+)-(fabric|forge|optifine|neoforge|iris)$/);
            if (match) {
                modifiers.push({
                    id: dir,
                    gameVersion: match[1],
                    type: match[2],
                    installed: true
                });
            }
        });

        return modifiers;
    } catch (error) {
        console.error('Erro ao listar modificadores:', error);
        return [];
    }
}

/**
 * Obter versão modificada para lançar
 */
function getModifiedVersionId(gameVersion, modifierType) {
    if (!modifierType || modifierType === 'vanilla') {
        return gameVersion;
    }
    return `${gameVersion}-${modifierType}`;
}

module.exports = {
    configureModifier,
    getModifierArguments,
    getModifierLibraries,
    getModifierMainClass,
    isModifierInstalled,
    removeModifier,
    getInstalledModifiers,
    getModifiedVersionId
};
