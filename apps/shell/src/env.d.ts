/// <reference types="vite/client" />

export interface DesktopApi {
  getTheme?: () => Promise<string>
  getDocumentTheme?: () => Promise<string>
  onThemeChanged?: (cb: (theme: string) => void) => () => void
  onDocumentThemeChanged?: (cb: (theme: string) => void) => () => void
  getAiPanelPrefs?: () => Promise<unknown>
  onAiPanelPrefsChanged?: (cb: (prefs: unknown) => void) => () => void
  switchTab?: (tab: 'docs' | 'sheets' | 'pdf') => Promise<{ success: boolean }>
  openExternal?: (url: string) => void
  convertAltChunkHtml?: (html: string) => Promise<unknown>
}

declare global {
  interface Window {
    desktop?: DesktopApi
  }
}
