const { Auth } = require('msmc')

const authManager = new Auth("select_account")

async function authenticateMicrosoft() {
  try {
    const xboxManager = await authManager.launch("electron")
    const token = await xboxManager.getMinecraft()
    const profile = token.profile

    const account = {
      id: profile.id,
      type: 'microsoft',
      username: profile.name,
      uuid: profile.id,
      accessToken: token.mcToken,
      refreshToken: xboxManager.msToken.refresh_token,
      expiresAt: xboxManager.exp
    }

    return { success: true, account }

  } catch (error) {
    console.error('Erro auth Microsoft:', error)
    return { success: false, error: error.message }
  }
}

async function refreshToken(account) {
  try {
    const newToken = await authManager.refresh(account.refreshToken)
    const mcToken = await newToken.getMinecraft()

    const updated = {
      ...account,
      accessToken: mcToken.mcToken,
      refreshToken: newToken.msToken.refresh_token,
      expiresAt: newToken.exp
    }

    return { success: true, account: updated }

  } catch (error) {
    return { success: false, error: error.message }
  }
}

module.exports = { authenticateMicrosoft, refreshToken }

module.exports = { authenticateMicrosoft, refreshToken }