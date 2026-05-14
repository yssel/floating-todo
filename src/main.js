const { app, BrowserWindow, ipcMain, screen, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Persistent storage for todos and window position
const store = new Store({
  defaults: {
    todos: [],
    windowBounds: { width: 320, height: 480, x: undefined, y: undefined },
    opacity: 0.95
  }
});

let mainWindow = null;
let tray = null;

function createWindow() {
  const savedBounds = store.get('windowBounds');
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: savedBounds.width,
    height: savedBounds.height,
    x: savedBounds.x !== undefined ? savedBounds.x : screenWidth - savedBounds.width - 20,
    y: savedBounds.y !== undefined ? savedBounds.y : 40,
    minWidth: 240,
    minHeight: 200,
    frame: false,            // No window chrome — gives it that sticky note look
    transparent: true,       // Allows rounded corners + opacity
    alwaysOnTop: true,       // The key feature: floats above everything
    resizable: true,
    skipTaskbar: false,
    hasShadow: true,
    vibrancy: 'under-window', // macOS native frosted-glass effect
    visualEffectState: 'active',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Float above fullscreen apps too — this is the macOS magic
  mainWindow.setAlwaysOnTop(true, 'floating', 1);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Apply saved opacity
  mainWindow.setOpacity(store.get('opacity'));

  // Persist window bounds whenever moved or resized
  const saveBounds = () => {
    if (mainWindow) store.set('windowBounds', mainWindow.getBounds());
  };
  mainWindow.on('move', saveBounds);
  mainWindow.on('resize', saveBounds);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Tiny menubar icon — lets you toggle the window if you accidentally hide it
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAaUlEQVQ4jWNgGAWjYBSMAjLAfwy8/z8GxoYZGGiCgJg/EAtigf8GxAJ4DEAJgYGoBnAxsBjAxcBiABcDiwFcDCwGcDGwGMDFwGIAFwOLAVwMLAZwMbAYwMXAYgAXA4sBXAwsBgYHAAAvKAv9MTGfYwAAAABJRU5ErkJggg=='
  );
  tray = new Tray(icon);
  tray.setToolTip('Floating Todo');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show / Hide', click: () => toggleWindow() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('click', toggleWindow);
}

function toggleWindow() {
  if (!mainWindow) return createWindow();
  if (mainWindow.isVisible()) mainWindow.hide();
  else mainWindow.show();
}

// ---- IPC handlers: renderer talks to main through these ----

ipcMain.handle('get-todos', () => store.get('todos'));

ipcMain.handle('save-todos', (_event, todos) => {
  store.set('todos', todos);
  return true;
});

ipcMain.handle('set-opacity', (_event, opacity) => {
  store.set('opacity', opacity);
  if (mainWindow) mainWindow.setOpacity(opacity);
  return true;
});

ipcMain.handle('get-opacity', () => store.get('opacity'));

ipcMain.handle('close-window', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

// ---- App lifecycle ----

app.whenReady().then(() => {
  createWindow();
  createTray();

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else if (mainWindow) mainWindow.show();
  });
});

// On macOS, keep app running when all windows are closed — that's the convention
app.on('window-all-closed', (e) => {
  e.preventDefault();
});
