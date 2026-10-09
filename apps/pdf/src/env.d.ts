/// <reference types="vite/client" />

export interface PdfApi {
  getLanguage: () => Promise<string>
  getTheme: () => Promise<string>
  onThemeChanged?: (cb: (theme: string) => void) => () => void
  getAiPanelPrefs?: () => Promise<unknown>
  onAiPanelPrefsChanged?: (cb: (prefs: unknown) => void) => () => void
}

declare global {
  interface Window {
    pdfApi?: PdfApi
  }
}
