const { contextBridge, ipcRenderer } = require('electron')
 
contextBridge.exposeInMainWorld('electronAPI', {
  claudeAPI: (payload) => ipcRenderer.invoke('claude-api', payload),
  voicevoxQuery: (payload) => ipcRenderer.invoke('voicevox-query', payload),
  voicevoxSynthesis: (payload) => ipcRenderer.invoke('voicevox-synthesis', payload),
  whisperAPI: (payload) => ipcRenderer.invoke('whisper-api', payload)
})