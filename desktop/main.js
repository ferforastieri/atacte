const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let envPath;
if (app.isPackaged) {
  // Em produção, .env está na raiz junto com o executável
  envPath = path.join(path.dirname(process.execPath), '.env');
  if (!fs.existsSync(envPath)) {
    // Tenta no resources
    const resourcesPath = process.resourcesPath || path.dirname(process.execPath);
    envPath = path.join(resourcesPath, '.env');
  }
  if (!fs.existsSync(envPath)) {
    // Tenta no app.asar.unpacked
    envPath = path.join(__dirname, '.env');
  }
} else {
  // Em desenvolvimento
  envPath = path.join(__dirname, '.env');
}
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const keyTrimmed = key.trim();
      const value = valueParts.join('=').trim();
      if (value && (!process.env[keyTrimmed] || keyTrimmed === 'BACKEND_URL')) {
        if (keyTrimmed === 'NODE_ENV' && require('electron').app.isPackaged) {
          return;
        }
        process.env[keyTrimmed] = value;
      }
    }
  });
}

const isDev = !require('electron').app.isPackaged && (process.env.NODE_ENV === 'development' || process.argv.includes('--dev'));
const BACKEND_URL = process.env.BACKEND_URL;
const API_URL = BACKEND_URL ? `${BACKEND_URL}/api` : null;

let mainWindow;

function createWindow() {
  Menu.setApplicationMenu(null);
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false
    },
    icon: path.join(__dirname, 'build', 'icon.png'),
    show: false,
    backgroundColor: '#111827',
    frame: false,
    titleBarStyle: 'hidden',
    title: 'Atacte'
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    let indexPath;
    if (app.isPackaged) {
      const resourcesPath = process.resourcesPath || path.dirname(process.execPath);
      indexPath = path.join(resourcesPath, 'web-dist', 'index.html');
    } else {
      indexPath = path.join(__dirname, '..', 'web', 'dist', 'index.html');
    }
    
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    }
  }

  mainWindow.webContents.on('frame-created', (event, details) => {
    if (!isDev && BACKEND_URL) {
      details.frame.executeJavaScript(`
        (function() {
          if (window.__ATACTE_INTERCEPTOR_INSTALLED__) return;
          window.__ATACTE_INTERCEPTOR_INSTALLED__ = true;
          
          const BACKEND_URL = '${BACKEND_URL}';
          
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (typeof url === 'string' && (url.startsWith('/api') || url.startsWith('/health'))) {
              return originalFetch.call(this, BACKEND_URL + url, options);
            }
            return originalFetch.call(this, url, options);
          };
          
          const originalOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(method, url, ...args) {
            if (typeof url === 'string' && (url.startsWith('/api') || url.startsWith('/health'))) {
              return originalOpen.call(this, method, BACKEND_URL + url, ...args);
            }
            return originalOpen.call(this, method, url, ...args);
          };
        })();
      `);
    }
  });


  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.focus();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const allowedOrigins = ['http://localhost:3000'];
    if (BACKEND_URL) {
      try {
        const backendUrlObj = new URL(BACKEND_URL);
        allowedOrigins.push(backendUrlObj.origin);
      } catch (e) {
        console.error('BACKEND_URL inválido:', BACKEND_URL);
      }
    }
    if (!allowedOrigins.includes(parsedUrl.origin)) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });


  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});


app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

process.on('uncaughtException', (error) => {
  console.error('Erro não capturado:', error);
});
