const { v4: uuidv4, v5: uuidv5 } = require('uuid')

const OFFLINE_NAMESPACE = '00000000-0000-0000-0000-000000000000'

async function createOfflineAccount(username) {
  if (!username || username.length < 2 || username.length > 16) {
    return {
      success: false,
      error: 'Username inválido (2-16 caracteres)'
    }
  }

  const uuid = uuidv5(username, OFFLINE_NAMESPACE)

  const account = {
    id: uuid,
    type: 'offline',
    username,
    uuid,
    accessToken: '0',
    clientToken: uuidv4()
  }

  return { success: true, account }
}

module.exports = { createOfflineAccount }
