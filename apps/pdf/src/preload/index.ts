import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('pdfApi', {
  getLanguage: () => ipcRenderer.invoke('app:get-language'),
  getTheme: () => ipcRenderer.invoke('app:get-theme'),
  onThemeChanged: (cb: (theme: string) => void) => {
    const listener = (_e: Electron.IpcRendererEvent, t: string) => cb(t)
    ipcRenderer.on('theme:changed', listener)
    return () => ipcRenderer.removeListener('theme:changed', listener)
  },
  getAiPanelPrefs: () => ipcRenderer.invoke('app:get-ai-panel-prefs'),
  onAiPanelPrefsChanged: (cb: (prefs: unknown) => void) => {
    const listener = (_e: Electron.IpcRendererEvent, p: unknown) => cb(p)
    ipcRenderer.on('ai-panel-prefs:changed', listener)
    return () => ipcRenderer.removeListener('ai-panel-prefs:changed', listener)
  },
})
