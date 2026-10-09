"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("desktop", {
  getLanguage: () => electron.ipcRenderer.invoke("app:get-language"),
  getTheme: () => electron.ipcRenderer.invoke("app:get-theme"),
  getDocumentTheme: () => electron.ipcRenderer.invoke("app:get-document-theme"),
  onThemeChanged: (cb) => {
    const listener = (_e, t) => cb(t);
    electron.ipcRenderer.on("theme:changed", listener);
    return () => electron.ipcRenderer.removeListener("theme:changed", listener);
  },
  onDocumentThemeChanged: (cb) => {
    const listener = (_e, t) => cb(t);
    electron.ipcRenderer.on("document-theme:changed", listener);
    return () => electron.ipcRenderer.removeListener("document-theme:changed", listener);
  },
  getAiPanelPrefs: () => electron.ipcRenderer.invoke("app:get-ai-panel-prefs"),
  onAiPanelPrefsChanged: (cb) => {
    const listener = (_e, p) => cb(p);
    electron.ipcRenderer.on("ai-panel-prefs:changed", listener);
    return () => electron.ipcRenderer.removeListener("ai-panel-prefs:changed", listener);
  },
  convertAltChunkHtml: (html) => electron.ipcRenderer.invoke("convert:alt-chunk-html", html)
});
