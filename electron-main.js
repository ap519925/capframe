import { app, BrowserWindow, ipcMain, desktopCapturer, session, screen, globalShortcut } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let selectionWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    titleDisplayStyle: 'hiddenInset', // Mac style
    // frame: false, // Custom UI handles drag? Maybe later.
    icon: path.join(__dirname, app.isPackaged ? 'dist/icon.png' : 'public/icon.png')
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  // Handlers
  ipcMain.handle('GET_SOURCES', async () => {
    const sources = await desktopCapturer.getSources({ types: ['window', 'screen'], thumbnailSize: { width: 600, height: 400 } });
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL()
    }));
  });

  ipcMain.handle('SELECT_AREA', async () => {
    return new Promise((resolve) => {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.bounds;

      selectionWindow = new BrowserWindow({
        x: primaryDisplay.bounds.x,
        y: primaryDisplay.bounds.y,
        width: width,
        height: height,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        enableLargerThanScreen: true,
        hasShadow: false,
        webPreferences: {
          nodeIntegration: true, // For ipcRenderer in selection.html (simplest for this aux window)
          contextIsolation: false
        }
      });

      selectionWindow.loadFile(path.join(__dirname, 'selection.html'));
      selectionWindow.setResizable(false);
      // selectionWindow.setIgnoreMouseEvents(false); // Make sure it catches clicks

      // Handle response
      ipcMain.once('AREA_SELECTED', (event, rect) => {
        if (selectionWindow) {
          selectionWindow.close();
          selectionWindow = null;
        }
        resolve(rect); // Returns null if cancelled, or {x,y,w,h}
      });

      selectionWindow.on('closed', () => {
        if (selectionWindow) {
          selectionWindow = null;
          // If closed without event (e.g. alt-f4), resolve null
          resolve(null);
        }
      });
    });
  });
}

app.whenReady().then(() => {
  createWindow();

  // Register Global Shortcut
  globalShortcut.register('Alt+Shift+R', () => {
    // Send event to renderer
    if (mainWindow) {
      mainWindow.webContents.send('HOTKEY_TOGGLE_RECORDING');
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      callback({ video: sources[0], audio: 'loopback' })
    })
  })

  ipcMain.handle('OPEN_EXTERNAL', async (event, url) => {
    const { shell } = await import('electron');
    await shell.openExternal(url);
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
