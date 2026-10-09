import { useState, useEffect } from 'react'

type Tab = 'docs' | 'sheets' | 'pdf'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'docs', label: 'Docs', icon: '📄' },
  { id: 'sheets', label: 'Sheets', icon: '📊' },
  { id: 'pdf', label: 'PDF', icon: '📑' },
]

const RENDERER_URLS: Record<Tab, string> = {
  docs: import.meta.env.VITE_DOCS_URL || 'http://localhost:5173',
  sheets: import.meta.env.VITE_SHEETS_URL || 'http://localhost:5174',
  pdf: import.meta.env.VITE_PDF_URL || 'http://localhost:5175',
}

function ThemeToggle({
  theme,
  onCycle,
}: {
  theme: 'light' | 'dark' | 'system'
  onCycle: () => void
}) {
  return (
    <button
      className="icon-btn"
      onClick={onCycle}
      title="Alternar tema (Light / Dark / System)"
    >
      {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
    </button>
  )
}

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('docs')
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  useEffect(() => {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  const cycleTheme = () => {
    const sequence: ('light' | 'dark' | 'system')[] = [
      'light',
      'dark',
      'system',
    ]
    const nextIndex = (sequence.indexOf(theme) + 1) % sequence.length
    setTheme(sequence[nextIndex])
  }

  return (
    <div className="app-shell">
      <div className="toolbar">
        <span className="toolbar-title">GenOffice Trio</span>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
        <div className="toolbar-spacer" />
        <ThemeToggle theme={theme} onCycle={cycleTheme} />
      </div>
      <div className="renderer-frame">
        <iframe
          title="Docs"
          src={RENDERER_URLS.docs}
          style={{ display: activeTab === 'docs' ? 'block' : 'none' }}
        />
        <iframe
          title="Sheets"
          src={RENDERER_URLS.sheets}
          style={{ display: activeTab === 'sheets' ? 'block' : 'none' }}
        />
        <iframe
          title="PDF"
          src={RENDERER_URLS.pdf}
          style={{ display: activeTab === 'pdf' ? 'block' : 'none' }}
        />
      </div>
    </div>
  )
}
