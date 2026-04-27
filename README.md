# ⚔️ Rei Launcher

> Premium Minecraft Launcher — design inspired by Breus Studio / Infinity Universe

![Electron](https://img.shields.io/badge/Electron-28-47848F?style=flat-square&logo=electron)
![Node](https://img.shields.io/badge/Node-20-339933?style=flat-square&logo=node.js)

---

## ✨ Features
- 🔐 Microsoft OAuth 2.0 + Offline authentication (fixed `getOfflineAuth` bug)
- 🚀 Full Minecraft launch via `minecraft-launcher-core`
- 📰 Weekly News feed with search & tag filters
- 🎮 Home, Play, Profile, Settings screens
- 🔄 Auto-updater via GitHub Releases
- 🪟 Frameless, secure (`contextIsolation: true`, `nodeIntegration: false`)
- 🎨 Premium dark UI — exact recreation of Behance design

---

## 🚀 Quick Start

```bash
npm install
npm start
```

## 🏗️ Build

```bash
npm run dist:win    # Windows .exe
npm run dist:linux  # Linux .AppImage
npm run dist:mac    # macOS .dmg
```

---

## 📁 Structure

```
rei-launcher/
├── src/
│   ├── main/
│   │   ├── index.js      ← Electron main process
│   │   └── preload.js    ← contextBridge (secure IPC)
│   ├── renderer/
│   │   └── app.html      ← Complete UI (all screens)
│   ├── styles/
│   │   └── global.css
│   └── assets/
├── .github/workflows/    ← CI/CD
├── package.json
└── README.md
```

---

## 🐛 Fixed Bugs

### `TypeError: Authenticator.getOfflineAuth is not a function`

**Root cause:** `minecraft-launcher-core` v3+ deprecated the `Authenticator` helper.

**Fix in `src/main/index.js`:**
```js
// ❌ Old (broken)
const auth = await Authenticator.getOfflineAuth(username)

// ✅ New (correct)
const auth = {
  access_token:    'offline',
  client_token:    account.uuid,
  uuid:            account.uuid,
  name:            account.name,
  user_properties: '{}',
  meta: { type: 'mojang', demo: false },
}
```

---

## 📄 License
MIT © EduhxH
