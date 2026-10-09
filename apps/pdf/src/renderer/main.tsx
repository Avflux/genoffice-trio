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

async function bootstrap() {
  let lang = 'zh'
  let theme = 'system'

  try {
    const [l, t] = await Promise.all([
      window.pdfApi?.getLanguage().catch(() => 'zh'),
      window.pdfApi?.getTheme().catch(() => 'system'),
    ])
    if (l) lang = l
    if (t) theme = t
  } catch {}

  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  applyTheme(theme)
  window.pdfApi?.onThemeChanged?.(applyTheme)
  await window.pdfApi
    ?.getAiPanelPrefs?.()
    .then(applyAiPanelPrefs)
    .catch(() => {})
  window.pdfApi?.onAiPanelPrefsChanged?.(applyAiPanelPrefs)

  createRoot(document.getElementById('root')!).render(<App />)
}

void bootstrap()
