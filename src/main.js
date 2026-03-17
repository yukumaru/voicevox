const { app, BrowserWindow, ipcMain, session } = require('electron')
const path = require('path')

// Web Speech APIをElectronで動かすために必要なフラグ
app.commandLine.appendSwitch('enable-speech-dispatcher')
app.commandLine.appendSwitch('allow-http-screen-capture')
app.commandLine.appendSwitch('use-fake-ui-for-media-stream', 'false')

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
  win.webContents.openDevTools()
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



// Windows ネイティブSTT（PowerShell経由）
ipcMain.handle('windows-stt', async (event, { maxSeconds }) => {
  const { execFile } = require('child_process')
  const max = maxSeconds || 15

  const psScript = `
Add-Type -AssemblyName System.Speech
$recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$recognizer.SetInputToDefaultAudioDevice()
$recognizer.InitialSilenceTimeout = [System.TimeSpan]::FromSeconds(5)
$recognizer.BabbleTimeout = [System.TimeSpan]::FromSeconds(3)
$recognizer.EndSilenceTimeout = [System.TimeSpan]::FromSeconds(1)
$grammar = New-Object System.Speech.Recognition.DictationGrammar
$recognizer.LoadGrammar($grammar)
$result = $recognizer.Recognize([System.TimeSpan]::FromSeconds(${max}))
if ($result -and $result.Text) { Write-Output $result.Text } else { Write-Output "" }
$recognizer.Dispose()
`

  return new Promise((resolve) => {
    execFile('powershell', ['-NoProfile', '-NonInteractive', '-Command', psScript],
      { timeout: (max + 10) * 1000 },
      (err, stdout, stderr) => {
        if (err) {
          resolve({ text: '', error: err.message })
        } else {
          resolve({ text: stdout.trim() })
        }
      }
    )
  })
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
