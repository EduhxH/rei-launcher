const fs = require('fs')
const path = require('path')
const { app } = require('electron')
const store = require('../store/store')

const INSTANCES_DIR = path.join(app.getPath('appData'), '.rei-launcher', 'instances')

if (!fs.existsSync(INSTANCES_DIR)) {
  fs.mkdirSync(INSTANCES_DIR, { recursive: true })
}

function getInstances() {
  try {
    const instances = []
    const dirs = fs.readdirSync(INSTANCES_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    for (const dir of dirs) {
      const instancePath = path.join(INSTANCES_DIR, dir)
      const configPath = path.join(instancePath, 'instance.json')

      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        instances.push({
          id: dir,
          name: config.name,
          version: config.version,
          path: instancePath,
          ...config
        })
      }
    }

    return instances
  } catch (error) {
    console.error('Erro ao obter instâncias:', error)
    return []
  }
}

function createInstance(data) {
  try {
    const id = Date.now().toString()
    const instancePath = path.join(INSTANCES_DIR, id)

    if (!fs.existsSync(instancePath)) {
      fs.mkdirSync(instancePath, { recursive: true })
    }

    const config = {
      name: data.name,
      version: data.version,
      javaPath: data.javaPath,
      ram: data.ram,
      createdAt: new Date().toISOString()
    }

    fs.writeFileSync(path.join(instancePath, 'instance.json'), JSON.stringify(config, null, 2))

    return { success: true, instance: { id, ...config, path: instancePath } }
  } catch (error) {
    console.error('Erro ao criar instância:', error)
    return { success: false, error: error.message }
  }
}

function deleteInstance(id) {
  try {
    const instancePath = path.join(INSTANCES_DIR, id)

    if (fs.existsSync(instancePath)) {
      fs.rmSync(instancePath, { recursive: true, force: true })
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar instância:', error)
    return { success: false, error: error.message }
  }
}

module.exports = { getInstances, createInstance, deleteInstance }