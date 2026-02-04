const { contextBridge, ipcRenderer } = require('electron');

const BACKEND_URL = process.env.BACKEND_URL;
if (BACKEND_URL) {
  contextBridge.exposeInMainWorld('ATACTE_BACKEND_URL', BACKEND_URL);
}

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getBackendUrl: () => BACKEND_URL,
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  on: (channel, callback) => {
    const validChannels = ['update-available', 'update-downloaded'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  }
});
