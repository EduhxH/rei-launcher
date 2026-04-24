#  Rei Launcher
OMG I WANT TO GO TO SLEEP SO BAD

A modern, clean Minecraft launcher built with Electron.

## Features
- Offline & Microsoft account support
- Version management (install & select)
- Screenshot gallery
- Skin preview via mc-heads.net / NameMC
- RAM allocation slider
- Java auto-detection
- Modrinth integration

## Setup

```bash
npm install
npm start
```

## Build (Windows)

```bash
npm run build:win
```

## Bug Fixed: `TypeError: Authenticator.getOfflineAuth is not a function`

The `Authenticator` static class was removed in newer versions of `minecraft-launcher-core`.
**Fix:** `src/main/launcher/launch.js` now builds the offline auth object manually using the
correct shape expected by the launcher core, replacing the removed static call.

🚀 Clonar o projeto
git clone https://github.com/EduhxH/rei-launcher.git && cd rei-launcher
📦 Instalar dependências
npm install
▶️ Iniciar o projeto
npm start

## Stack
- Electron 28
- minecraft-launcher-core 3.17
- msmc 5 (Microsoft auth)
- electron-store 8
- uuid 9
