const path = require('path');
const { app } = require('electron');

const MINECRAFT_DIR = path.join(app.getPath('appData'), '.rei-launcher');

module.exports = { MINECRAFT_DIR };