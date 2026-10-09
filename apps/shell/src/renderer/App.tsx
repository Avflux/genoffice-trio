import { useState, useEffect } from 'react'

type Tab = 'docs' | 'sheets' | 'pdf'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'docs', label: 'Docs', icon: '📄' },
  { id: 'sheets', label: 'Sheets', icon: '📊' },
  { id: 'pdf', label: 'PDF', icon: '📑' },
]

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  useEffect(() => {
    const applyTheme = (t: string) => {
      setTheme(t as 'light' | 'dark' | 'system')
      if (t === 'system') {
        document.documentElement.removeAttribute('data-theme')
      } else {
        document.documentElement.setAttribute('data-theme', t)
      }
    }
    applyTheme('system')
    window.desktop?.onThemeChanged?.(applyTheme)
  }, [])

  const cycleTheme = () => {
    const next: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system']
    const current = next.indexOf(theme)
    const newTheme = next[(current + 1) % next.length]
    setTheme(newTheme)
    if (newTheme === 'system') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', newTheme)
    }
    window.desktop?.onThemeChanged?.(newTheme)
  }

  return (
    <button className="icon-btn" onClick={cycleTheme} title="Alternar tema (Light / Dark / System)">
      {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
    </button>
  )
}

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('docs')

  const switchTab = async (tab: Tab) => {
    setActiveTab(tab)
    window.desktop?.switchTab?.(tab)
  }

  return (
    <div className="app-shell">
      <div className="toolbar">
        <span className="toolbar-title">GenOffice Trio</span>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => switchTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
        <div className="toolbar-spacer" />
        <ThemeToggle />
      </div>
      <div className="renderer-frame">
        {activeTab === 'docs' && (
          <iframe
            title="Docs"
            src={window.location.origin === 'file:' ? '../docs/src/renderer/index.html' : 'http://localhost:5173'}
          />
        )}
        {activeTab === 'sheets' && (
          <iframe
            title="Sheets"
            src={window.location.origin === 'file:' ? '../sheets/src/renderer/index.html' : 'http://localhost:5174'}
          />
        )}
        {activeTab === 'pdf' && (
          <iframe
            title="PDF"
            src={window.location.origin === 'file:' ? '../pdf/src/renderer/index.html' : 'http://localhost:5175'}
          />
        )}
      </div>
    </div>
  )
}
