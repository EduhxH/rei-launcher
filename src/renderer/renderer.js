// ===== WINDOW CONTROLS =====
const initializeRenderer = () => {
    const minBtn = document.getElementById('min-btn');
    const closeBtn = document.getElementById('close-btn');
    
    if (minBtn) minBtn.onclick = () => window.launcher.window.minimize();
    if (closeBtn) closeBtn.onclick = () => window.launcher.window.close();

    // ===== TABS SYSTEM =====
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));

            button.classList.add('active');

            const targetPanel = document.getElementById(`${tabName}-tab`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                
                // Carregar contas quando a aba de contas for aberta
                if (tabName === 'users') {
                    loadAccounts();
                }
                // Carregar screenshots quando a aba de screenshots for aberta
                if (tabName === 'screenshots') {
                    loadScreenshots();
                }
            }
        });
    });

    // ===== PLAY TAB =====
    const playBtn = document.getElementById('play-btn');
    const versionSelect = document.getElementById('version-select');
    const loaderSelect = document.getElementById('loader-select');
    const loaderVersionSelect = document.getElementById('loader-version-select');
    const loaderVersionGroup = document.getElementById('loader-version-group');
    const progressSection = document.getElementById('progress-section');
    const progressFill = document.getElementById('progress-fill');
    const progressStatus = document.getElementById('progress-status');
    const progressPercent = document.getElementById('progress-percent');

    if (!playBtn || !versionSelect || !loaderSelect) {
        console.error('Elementos de play tab não encontrados');
        return;
    }

    // Atualizar versões de loader quando o seletor mudar
    versionSelect.addEventListener('change', async () => {
        const version = versionSelect.value;
        const loader = loaderSelect.value;
        
        if (loader !== 'vanilla') {
        const isCompatible = await window.launcher.loaders.isCompatible({ loaderType: loader, gameVersion: version });
        loaderSelect.disabled = !isCompatible;
        
        if (isCompatible) {
            await updateLoaderVersions();
        }
    }
});

// Atualizar interface e versões quando o loader mudar
loaderSelect.addEventListener('change', async () => {
    const loader = loaderSelect.value;
    
    if (loader === 'vanilla') {
        loaderVersionGroup.style.display = 'none';
    } else {
        loaderVersionGroup.style.display = 'block';
        await updateLoaderVersions();
    }
});

// Atualizar versões disponíveis do loader
async function updateLoaderVersions() {
    const loader = loaderSelect.value;
    
    if (loader === 'vanilla') return;
    
    loaderVersionSelect.innerHTML = '<option>Carregando...</option>';
    
    try {
        const versions = await window.launcher.loaders.getVersions(loader);
        
        if (versions.length === 0) {
            loaderVersionSelect.innerHTML = '<option disabled>Nenhuma versão disponível</option>';
            return;
        }
        
        loaderVersionSelect.innerHTML = '';
        versions.forEach(version => {
            const option = document.createElement('option');
            option.value = version;
            option.textContent = version;
            loaderVersionSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao buscar versões do loader:', error);
        loaderVersionSelect.innerHTML = '<option disabled>Erro ao carregar</option>';
    }
}

playBtn.addEventListener('click', async () => {
    const version = versionSelect.value;
    const modifierType = loaderSelect.value;
    const modifierVersion = loaderVersionSelect.value;
    
    playBtn.disabled = true;
    playBtn.innerHTML = '<span>A CARREGAR...</span>';

    progressSection.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressStatus.textContent = 'Preparando ficheiros...';

    try {
        const result = await window.launcher.minecraft.launch({
            version,
            modifierType: modifierType !== 'vanilla' ? modifierType : undefined,
            modifierVersion: modifierType !== 'vanilla' ? modifierVersion : undefined
        });

        if (!result.success) {
            alert('Erro ao iniciar: ' + result.error);
        }
    } catch (error) {
        console.error('Erro ao lançar jogo:', error);
        alert('Erro ao iniciar: ' + error.message);
    } finally {
        playBtn.disabled = false;
        playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>JOGAR</span>';
        progressSection.classList.add('hidden');
    }
});

// Listen for download progress
window.launcher.on?.downloadProgress?.((data) => {
    if (data.total > 0) {
        const percent = Math.round((data.task / data.total) * 100);
        progressFill.style.width = percent + '%';
        progressStatus.textContent = 'A descarregar ficheiros...';
        progressPercent.textContent = `${percent}%`;
    }
});

// ===== USERS TAB =====
const accountsList = document.getElementById('accounts-list');
const addOfflineBtn = document.getElementById('add-offline-btn');
const addMicrosoftBtn = document.getElementById('add-microsoft-btn');

function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function loadAccounts() {
    try {
        const accounts = await window.launcher.accounts.get();
        const loginCard = document.getElementById('login-card');
        accountsList.innerHTML = '';

        if (!accounts || accounts.length === 0) {
            loginCard.classList.remove('hidden');
            accountsList.innerHTML = '';
            return;
        }

        loginCard.classList.add('hidden');
        accounts.forEach(account => {
            const item = document.createElement('div');
            item.className = 'account-item';
            const safeName = escapeHtml(account.username);
            const safeType = escapeHtml(account.type || 'Offline');
            const safeId = escapeHtml(account.id);
            item.innerHTML = `
                <img src="https://minotar.net/helm/${encodeURIComponent(account.username)}/64" alt="${safeName}">
                <div>
                    <strong>${safeName}</strong>
                    <small>${safeType}</small>
                </div>
                <button onclick="removeAccount('${safeId}')">Remover</button>
            `;
            accountsList.appendChild(item);
        });
    } catch (error) {
        console.error('Erro ao carregar contas:', error);
        accountsList.innerHTML = '<p>Erro ao carregar contas.</p>';
    }
}

window.removeAccount = async (id) => {
    try {
        await window.launcher.accounts.remove(id);
        loadAccounts();
    } catch (error) {
        alert('Erro ao remover conta: ' + error.message);
    }
};

addOfflineBtn.addEventListener('click', async () => {
    document.getElementById('modal-offline').classList.remove('hidden');
    document.getElementById('offline-username-input').focus();
    document.getElementById('offline-username-input').value = '';
});

window.submitOfflineForm = async () => {
    const username = document.getElementById('offline-username-input').value.trim();
    
    if (!username) {
        alert('Digite um nome de usuário!');
        return;
    }
    
    if (username.length < 2 || username.length > 16) {
        alert('Nome de usuário deve ter entre 2 e 16 caracteres!');
        return;
    }
    
    try {
        closeOfflineModal();
        await window.launcher.accounts.addOffline(username);
        loadAccounts();
    } catch (error) {
        alert('Erro: ' + error.message);
    }
};

window.closeOfflineModal = () => {
    document.getElementById('modal-offline').classList.add('hidden');
    document.getElementById('offline-username-input').value = '';
};

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modal-offline');
    if (e.target === modal) {
        window.closeOfflineModal();
    }
});

// Listeners para botões de login
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('offline-username-input');
    const btnLoginOffline = document.querySelector('.btn-login-offline');
    const btnLoginMicrosoft = document.querySelector('.btn-login-microsoft');
    
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.submitOfflineForm();
            }
        });
    }
    
    if (btnLoginOffline) {
        btnLoginOffline.addEventListener('click', () => {
            document.getElementById('modal-offline').classList.remove('hidden');
            document.getElementById('offline-username-input').focus();
        });
    }
    
    if (btnLoginMicrosoft) {
        btnLoginMicrosoft.addEventListener('click', async () => {
            try {
                await window.launcher.accounts.addMicrosoft();
                loadAccounts();
            } catch (error) {
                alert('Erro: ' + error.message);
            }
        });
    }
});

addMicrosoftBtn.addEventListener('click', async () => {
    try {
        await window.launcher.accounts.addMicrosoft();
        loadAccounts();
    } catch (error) {
        alert('Erro: ' + error.message);
    }
});

// ===== SCREENSHOTS TAB =====
const screenshotsGrid = document.getElementById('screenshots-grid');

async function loadScreenshots() {
    try {
        const screenshots = await window.launcher.screenshots.get();
        screenshotsGrid.innerHTML = '';

        if (!screenshots || screenshots.length === 0) {
            screenshotsGrid.innerHTML = '<p>Nenhuma screenshot encontrada.</p>';
            return;
        }

        screenshots.slice(0, 24).forEach(screenshotPath => {
            const item = document.createElement('div');
            item.className = 'screenshot-item';
            item.innerHTML = `<img src="file://${screenshotPath}" alt="Screenshot">`;
            item.addEventListener('click', () => window.launcher.screenshots.open(screenshotPath));
            screenshotsGrid.appendChild(item);
        });
    } catch (error) {
        console.error('Erro ao carregar screenshots:', error);
        screenshotsGrid.innerHTML = '<p>Erro ao carregar screenshots.</p>';
    }
}

document.querySelector('[data-tab="screenshots"]').addEventListener('click', loadScreenshots);

// ===== SETTINGS TAB =====
const ramSetting = document.getElementById('ram-setting');
const resolutionSetting = document.getElementById('resolution-setting');
const themeToggle = document.getElementById('theme-toggle');
const logoutBtn = document.getElementById('logout-btn');

function loadSettings() {
    try {
        const settings = localStorage.getItem('launcher-settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            if (parsed.ram) ramSetting.value = parsed.ram;
            if (parsed.resolution) resolutionSetting.value = parsed.resolution;
            if (parsed.theme !== undefined) themeToggle.checked = parsed.theme;
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

function saveSettings() {
    const settings = {
        ram: ramSetting.value,
        resolution: resolutionSetting.value,
        theme: themeToggle.checked
    };
    localStorage.setItem('launcher-settings', JSON.stringify(settings));
}

ramSetting.addEventListener('change', saveSettings);
resolutionSetting.addEventListener('change', saveSettings);
themeToggle.addEventListener('change', saveSettings);

logoutBtn.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja desconectar?')) {
        try {
            window.launcher.auth?.logout?.();
        } catch (error) {
            console.error('Erro ao desconectar:', error);
        }
    }
});

loadSettings();
};

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeRenderer);
