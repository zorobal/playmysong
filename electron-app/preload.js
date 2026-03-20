const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onNewRequest: (callback) => ipcRenderer.on('new_request', (event, data) => callback(data)),
  onRequestValidated: (callback) => ipcRenderer.on('request_validated', (event, data) => callback(data)),
  onRequestRejected: (callback) => ipcRenderer.on('request_rejected', (event, data) => callback(data)),
  onNowPlaying: (callback) => ipcRenderer.on('now_playing', (event, data) => callback(data)),
  onPlaylistUpdated: (callback) => ipcRenderer.on('playlist_updated', (event, data) => callback(data)),
  
  sendAdminAction: (action, requestId, reason) => ipcRenderer.send('request_action', { action, requestId, reason }),
  setNowPlaying: (song) => ipcRenderer.send('set_now_playing', song),
  
  getFileUrl: (filePath) => ipcRenderer.sendSync('get_file_url', filePath),
  
  completeSong: (requestId) => ipcRenderer.send('complete_song', requestId)
});
