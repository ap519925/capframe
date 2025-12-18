const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getSources: () => ipcRenderer.invoke('GET_SOURCES'),
    selectArea: () => ipcRenderer.invoke('SELECT_AREA'),
    openExternal: (url) => ipcRenderer.invoke('OPEN_EXTERNAL', url),
    onHotkeyToggleRecording: (callback) => ipcRenderer.on('HOTKEY_TOGGLE_RECORDING', callback),
    onHotkeySaveReplay: (callback) => ipcRenderer.on('HOTKEY_SAVE_REPLAY', callback),
    showOverlay: (mode) => ipcRenderer.send('SHOW_OVERLAY', { mode }),
    hideOverlay: () => ipcRenderer.send('HIDE_OVERLAY'),
    updateOverlayTime: (time) => ipcRenderer.send('UPDATE_OVERLAY_TIME', time),
});
