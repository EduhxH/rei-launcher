// ===== WINDOW CONTROLS =====
document.getElementById('min-btn').onclick = () => window.launcher.window.minimize();
document.getElementById('close-btn').onclick = () => window.launcher.window.close();

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
        }
    });
});

// ===== PLAY TAB =====
const playBtn = document.getElementById('play-btn');
const versionSelect = document.getElementById('version-select');
const progressSection = document.getElementById('progress-section');
const progressFill = document.getElementById('progress-fill');
const progressStatus = document.getElementById('progress-status');
const progressPercent = document.getElementById('progress-percent');

playBtn.addEventListener('click', async () => {
    const version = versionSelect.value;
    playBtn.disabled = true;
    playBtn.innerHTML = '<span>A CARREGAR...</span>';

    progressSection.classList.remove('hidden');
    progressFill.style.width = '0%';

    const result = await window.launcher.minecraft.launch({ version });

    if (!result.success) {
        alert('Erro ao iniciar: ' + result.error);
        playBtn.disabled = false;
        playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>JOGAR</span>';
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
        accountsList.innerHTML = '';

        if (!accounts || accounts.length === 0) {
            accountsList.innerHTML = '<p>Nenhuma conta adicionada ainda.</p>';
            return;
        }

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
    const username = prompt('Digite o nome de usuário:');
    if (username) {
        try {
            await window.launcher.accounts.addOffline(username);
            loadAccounts();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
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

document.querySelector('[data-tab="users"]').addEventListener('click', loadAccounts);

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
