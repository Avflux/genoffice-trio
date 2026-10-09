/// <reference types="vite/client" />

export interface DesktopApi {
  getLanguage: () => Promise<string>
  getTheme: () => Promise<string>
  getDocumentTheme?: () => Promise<string>
  onThemeChanged?: (cb: (theme: string) => void) => () => void
  onDocumentThemeChanged?: (cb: (theme: string) => void) => () => void
  getAiPanelPrefs?: () => Promise<unknown>
  onAiPanelPrefsChanged?: (cb: (prefs: unknown) => void) => () => void
}

declare global {
  interface Window {
    desktop?: DesktopApi
  }
}
