const axios = require('axios');

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

module.exports = { getRemoteVersions };