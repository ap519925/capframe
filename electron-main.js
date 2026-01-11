import { app, BrowserWindow, ipcMain, desktopCapturer, session, screen, globalShortcut } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure FFmpeg Path
const ffmpegBinary = app.isPackaged
  ? path.join(process.resourcesPath, 'ffmpeg.exe')
  : ffmpegPath;

ffmpeg.setFfmpegPath(ffmpegBinary);

let mainWindow;
let selectionWindow;

function createWindow() {
  // ... (keep existing window creation)
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

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (overlayWindow) {
      overlayWindow.close();
      overlayWindow = null;
    }
    if (selectionWindow) {
      selectionWindow.close();
      selectionWindow = null;
    }
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
      thumbnail: source.thumbnail.toDataURL(),
      display_id: source.display_id
    }));
  });

  ipcMain.handle('GET_CURRENT_SCREEN_ID', () => {
    const point = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(point);
    return `screen:${display.id}:0`;
  });

  ipcMain.handle('TRIM_VIDEO', async (event, { arrayBuffer, startTime, duration }) => {
    const tempInput = path.join(os.tmpdir(), `input-${Date.now()}.webm`);
    const tempOutput = path.join(os.tmpdir(), `output-${Date.now()}.webm`);

    try {
      // Write buffer to disk
      await fs.promises.writeFile(tempInput, Buffer.from(arrayBuffer));

      // Run FFmpeg
      await new Promise((resolve, reject) => {
        ffmpeg(tempInput)
          .setStartTime(startTime)
          .setDuration(duration)
          .output(tempOutput)
          .videoCodec('copy')
          .audioCodec('copy')
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      // Read back
      const trimmedBuffer = await fs.promises.readFile(tempOutput);

      // Cleanup
      fs.unlink(tempInput, () => { });
      fs.unlink(tempOutput, () => { });

      return trimmedBuffer;

    } catch (error) {
      console.error("Trim Error:", error);
      // Cleanup on error
      if (fs.existsSync(tempInput)) fs.unlink(tempInput, () => { });
      if (fs.existsSync(tempOutput)) fs.unlink(tempOutput, () => { });
      throw error;
    }
  });

  ipcMain.handle('SELECT_AREA', async () => {
    return new Promise((resolve) => {
      const cursorPoint = screen.getCursorScreenPoint();
      const targetDisplay = screen.getDisplayNearestPoint(cursorPoint);
      const { x, y, width, height } = targetDisplay.bounds;

      selectionWindow = new BrowserWindow({
        x: x,
        y: y,
        width: width,
        height: height,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        enableLargerThanScreen: true,
        hasShadow: false,
        webPreferences: {
          nodeIntegration: true,
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

  globalShortcut.register('Alt+Shift+S', () => {
    if (mainWindow) {
      mainWindow.webContents.send('HOTKEY_SAVE_REPLAY');
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

let overlayWindow;

function createOverlayWindow() {
  if (overlayWindow) return;

  const { width } = screen.getPrimaryDisplay().workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 180,
    height: 60,
    x: width - 200, // Bottom right default
    y: screen.getPrimaryDisplay().workAreaSize.height - 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    focusable: false, // Don't take focus
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    show: false
  });

  overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  // overlayWindow.setIgnoreMouseEvents(true, { forward: true }); // Need interaction for buttons, so false
}

// IPC Handlers for Overlay
ipcMain.on('SHOW_OVERLAY', (event, { mode }) => {
  if (!overlayWindow) createOverlayWindow();
  overlayWindow.show();
  overlayWindow.webContents.send('UPDATE_OVERLAY', { type: 'mode', mode, status: 'active' });
});

ipcMain.on('HIDE_OVERLAY', () => {
  if (overlayWindow) overlayWindow.hide();
});

ipcMain.on('UPDATE_OVERLAY_TIME', (event, timeString) => {
  if (overlayWindow && overlayWindow.isVisible()) {
    overlayWindow.webContents.send('UPDATE_OVERLAY', { type: 'time', text: timeString });
  }
});

ipcMain.handle('RESIZE_OVERLAY', (event, { width, height }) => {
  if (overlayWindow) {
    overlayWindow.setSize(width, height);
  }
});

ipcMain.on('OVERLAY_STOP_CLICKED', () => {
  if (mainWindow) {
    mainWindow.webContents.send('HOTKEY_TOGGLE_RECORDING'); // Reuse toggle logic to stop
  }
});


app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (selectionWindow) { selectionWindow.close(); selectionWindow = null; }
  if (overlayWindow) { overlayWindow.close(); overlayWindow = null; }
});

app.on('window-all-closed', () => {
  if (selectionWindow) { selectionWindow.close(); selectionWindow = null; }
  if (overlayWindow) { overlayWindow.close(); overlayWindow = null; }
  if (process.platform !== 'darwin') app.quit();
});
