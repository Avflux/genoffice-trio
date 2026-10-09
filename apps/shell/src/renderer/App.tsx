import { useState, useEffect, useRef } from 'react'

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
  }, [theme, setTheme])

  const cycleTheme = () => {
    const next: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system']
    const current = next.indexOf(theme)
    const newTheme = next[(current + 1) % next.length]
    setTheme(newTheme)
  }

  return (
    <button className="icon-btn" onClick={cycleTheme} title="Alternar tema (Light / Dark / System)">
      {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
    </button>
  )
}

async function applyThemeToFrame(iframe: HTMLIFrameElement, theme: 'light' | 'dark' | 'system') {
  const doc = iframe.contentDocument
  if (!doc) return
  doc.documentElement.setAttribute('data-theme', theme)
}

async function switchTab(tab: Tab, iframe: HTMLIFrameElement, appTheme: 'light' | 'dark' | 'system') {
  const urlMap: Record<Tab, string> = {
    docs: 'http://localhost:5173',
    sheets: 'http://localhost:5174',
    pdf: 'http://localhost:5175',
  }
  iframe.src = urlMap[tab]
  if (appTheme !== 'system') {
    await applyThemeToFrame(iframe, appTheme)
  }
}

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('docs')
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  useEffect(() => {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const activeFrameRef = useRef<HTMLIFrameElement | null>(null)

  const switchTabLocal = (tab: Tab) => {
    setActiveTab(tab)
    switchTab(tab, activeFrameRef.current!, theme)
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
        <ThemeToggle />
      </div>
      <div className="renderer-frame">
        {activeTab === 'docs' && <iframe ref={(el) => { activeFrameRef.current = el }} title="Docs" src="http://localhost:5173" />}
        {activeTab === 'sheets' && <iframe ref={(el) => { activeFrameRef.current = el }} title="Sheets" src="http://localhost:5174" />}
        {activeTab === 'pdf' && <iframe ref={(el) => { activeFrameRef.current = el }} title="PDF" src="http://localhost:5175" />}
      </div>
    </div>
  )
}
