const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getSources: () => ipcRenderer.invoke('GET_SOURCES'),
    selectArea: () => ipcRenderer.invoke('SELECT_AREA'),
    openExternal: (url) => ipcRenderer.invoke('OPEN_EXTERNAL', url),
    onHotkeyToggleRecording: (callback) => ipcRenderer.on('HOTKEY_TOGGLE_RECORDING', callback),
});
