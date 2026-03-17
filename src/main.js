const { app, BrowserWindow, ipcMain, session } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 480,
    height: 700,
    minWidth: 400,
    minHeight: 560,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.png')
  })

  // マイクパーミッションを自動許可
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true)
    } else {
      callback(false)
    }
  })

  win.loadFile(path.join(__dirname, 'index.html'))

  // 開発時のみDevTools
  // win.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Claude APIへのプロキシ（CORSを回避）
ipcMain.handle('claude-api', async (event, { messages, speaker }) => {
  const https = require('https')
  const apiKey = process.env.ANTHROPIC_API_KEY || ''

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `あなたは${speaker}として会話します。自然な日本語の話し言葉で、短めに返答してください。`,
      messages
    })

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    }

    const req = https.request(options, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
})

// VOICEVOXへのプロキシ
ipcMain.handle('voicevox-query', async (event, { text, speakerId }) => {
  const http = require('http')
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 50021,
      path: `/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`,
      method: 'POST'
    }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.end()
  })
})

ipcMain.handle('voicevox-synthesis', async (event, { query, speakerId }) => {
  const http = require('http')
  const body = JSON.stringify(query)
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 50021,
      path: `/synthesis?speaker=${speakerId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('base64')))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
})
