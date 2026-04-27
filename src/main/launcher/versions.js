const axios = require('axios');
const loaders = require('./loaders');

async function getRemoteVersions() {
    try {
        const response = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest.json');
        // Retorna as 20 últimas versões estáveis (release)
        return response.data.versions
            .filter(v => v.type === 'release')
            .map(v => v.id)
            .slice(0, 20); 
    } catch (error) {
        console.error("Erro ao procurar versões:", error);
        return ['1.20.1', '1.19.4', '1.8.9']; // Caso a internet falhe
    }
}

async function getLoaderVersions(loaderType) {
    try {
        switch (loaderType) {
            case 'fabric':
                return await loaders.getFabricVersions();
            case 'forge':
                return await loaders.getForgeVersions();
            case 'optifine':
                return await loaders.getOptifineVersions();
            case 'neoforge':
                return await loaders.getNeoforgeVersions();
            case 'iris':
                return await loaders.getIrisVersions();
            default:
                return [];
        }
    } catch (error) {
        console.error(`Erro ao buscar versões de ${loaderType}:`, error);
        return [];
    }
}

async function getLoaderSubVersions(loaderType, gameVersion) {
    try {
        switch (loaderType) {
            case 'fabric':
                return await loaders.getFabricLoaderVersions(gameVersion);
            default:
                return [];
        }
    } catch (error) {
        console.error(`Erro ao buscar sub-versões de ${loaderType}:`, error);
        return [];
    }
}

function isVersionCompatibleWithLoader(gameVersion, loaderType) {
    return loaders.isCompatible(loaderType, gameVersion);
}

function getCompatibleLoadersForVersion(gameVersion) {
    const allLoaders = ['fabric', 'forge', 'optifine', 'neoforge', 'iris'];
    return allLoaders.filter(loader => isVersionCompatibleWithLoader(gameVersion, loader));
}

module.exports = {
    getRemoteVersions,
    getLoaderVersions,
    getLoaderSubVersions,
    isVersionCompatibleWithLoader,
    getCompatibleLoadersForVersion
};