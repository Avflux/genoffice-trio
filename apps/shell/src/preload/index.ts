import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('desktop', {
  // Tema
  getTheme: () => ipcRenderer.invoke('app:get-theme'),
  getDocumentTheme: () => ipcRenderer.invoke('app:get-document-theme'),
  onThemeChanged: (cb: (theme: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, theme: string) => cb(theme)
    ipcRenderer.on('theme:changed', listener)
    return () => ipcRenderer.removeListener('theme:changed', listener)
  },
  onDocumentThemeChanged: (cb: (theme: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, theme: string) => cb(theme)
    ipcRenderer.on('document-theme:changed', listener)
    return () => ipcRenderer.removeListener('document-theme:changed', listener)
  },
  // AI panel prefs
  getAiPanelPrefs: () => ipcRenderer.invoke('app:get-ai-panel-prefs'),
  onAiPanelPrefsChanged: (cb: (prefs: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, prefs: unknown) => cb(prefs)
    ipcRenderer.on('ai-panel-prefs:changed', listener)
    return () => ipcRenderer.removeListener('ai-panel-prefs:changed', listener)
  },
  // Navegação entre tabs
  switchTab: (tab: 'docs' | 'sheets' | 'pdf') => ipcRenderer.invoke('tab:switch', tab),
  // Abrir links externos
  openExternal: (url: string) => ipcRenderer.send('shell:open-external', url),
  // Converter HTML para docx
  convertAltChunkHtml: (html: string) => ipcRenderer.invoke('convert:alt-chunk-html', html),
})
