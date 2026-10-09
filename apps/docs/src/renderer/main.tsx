import { createRoot } from 'react-dom/client'
import { App } from './App'
import { applyAiPanelPrefs, installScreenTips } from '@genoffice/ui'
import '@genoffice/ui/tokens.css'
import './styles.css'

installScreenTips()

function applyTheme(theme: string) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

function applyDocumentTheme(theme: string) {
  if (theme === 'follow') {
    document.documentElement.removeAttribute('data-doc-theme')
  } else {
    document.documentElement.setAttribute('data-doc-theme', theme)
  }
}

async function bootstrap() {
  let lang = 'zh'
  let theme = 'system'
  let docTheme = 'follow'

  try {
    const [l, t, dt] = await Promise.all([
      window.desktop?.getLanguage().catch(() => 'zh'),
      window.desktop?.getTheme().catch(() => 'system'),
      window.desktop?.getDocumentTheme?.().catch(() => 'follow'),
    ])
    if (l) lang = l
    if (t) theme = t
    if (dt) docTheme = dt
  } catch {
    // dev sem preload
  }

  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  applyTheme(theme)
  applyDocumentTheme(docTheme)
  window.desktop?.onThemeChanged?.(applyTheme)
  window.desktop?.onDocumentThemeChanged?.(applyDocumentTheme)
  await window.desktop
    ?.getAiPanelPrefs?.()
    .then(applyAiPanelPrefs)
    .catch(() => {})
  window.desktop?.onAiPanelPrefsChanged?.(applyAiPanelPrefs)

  createRoot(document.getElementById('root')!).render(<App />)
}

void bootstrap()
