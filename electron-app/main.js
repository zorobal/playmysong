const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { io } = require('socket.io-client');

let mainWindow;
let socket;

const BACKEND_URL = process.env.BACKEND_URL || 'https://playmysong-mu.vercel.app';
const ESTABLISHMENT_ID = process.argv.find(arg => arg.startsWith('--establishmentId='))?.split('=')[1] || 'default';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#000000'
  });

  mainWindow.loadFile('renderer/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  console.log(`Écran chargé pour établissement: ${ESTABLISHMENT_ID}`);
}

function connectSocket() {
  socket = io(BACKEND_URL, {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10
  });

  socket.on('connect', () => {
    console.log('Connecté au serveur WebSocket');
    socket.emit('join_establishment', ESTABLISHMENT_ID);
  });

  socket.on('disconnect', () => {
    console.log('Déconnecté du serveur');
  });

  socket.on('new_request', (data) => {
    console.log('Nouvelle demande:', data);
    if (mainWindow) {
      mainWindow.webContents.send('new_request', data);
    }
  });

  socket.on('request_validated', (data) => {
    console.log('Demande validée:', data);
    if (mainWindow) {
      mainWindow.webContents.send('request_validated', data);
    }
  });

  socket.on('request_rejected', (data) => {
    console.log('Demande rejetée:', data);
    if (mainWindow) {
      mainWindow.webContents.send('request_rejected', data);
    }
  });

  socket.on('now_playing_updated', (data) => {
    console.log('Lecture en cours mise à jour:', data);
    if (mainWindow) {
      mainWindow.webContents.send('now_playing', data);
    }
  });

  socket.on('playlist_updated', () => {
    console.log('Playlist mise à jour');
    if (mainWindow) {
      mainWindow.webContents.send('playlist_updated');
    }
  });

  socket.on('play_next', (data) => {
    console.log('Play next:', data);
    if (mainWindow) {
      mainWindow.webContents.send('play_next', data);
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  connectSocket();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (socket) socket.disconnect();
    app.quit();
  }
});

ipcMain.on('request_action', (event, { action, requestId, reason }) => {
  if (socket) {
    socket.emit('admin_action', {
      establishmentId: ESTABLISHMENT_ID,
      action,
      requestId,
      reason
    });
  }
});

ipcMain.on('set_now_playing', (event, song) => {
  if (socket) {
    socket.emit('now_playing', {
      establishmentId: ESTABLISHMENT_ID,
      song
    });
  }
});

ipcMain.on('get_file_url', (event, filePath) => {
  event.returnValue = 'file:///' + filePath.replace(/\\/g, '/');
});

ipcMain.on('complete_song', (event, requestId) => {
  if (socket) {
    socket.emit('complete_song', {
      establishmentId: ESTABLISHMENT_ID,
      requestId
    });
  }
});
