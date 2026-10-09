import { useState, useCallback } from 'react'

export function App() {
  const [content, setContent] = useState('')
  const [selectedTab, setSelectedTab] = useState<string>('home')

  const handleTabChange = useCallback((tab: string) => {
    setSelectedTab(tab)
  }, [])

  return (
    <div className="app">
      {/* Ribbon */}
      <div className="ribbon">
        <div className="ribbon-tabs">
          <button
            className={`ribbon-tab ${selectedTab === 'home' ? 'active' : ''}`}
            onClick={() => handleTabChange('home')}
          >
            Início
          </button>
          <button
            className={`ribbon-tab ${selectedTab === 'insert' ? 'active' : ''}`}
            onClick={() => handleTabChange('insert')}
          >
            Inserir
          </button>
          <button
            className={`ribbon-tab ${selectedTab === 'layout' ? 'active' : ''}`}
            onClick={() => handleTabChange('layout')}
          >
            Layout
          </button>
        </div>
        <div className="ribbon-body">
          {selectedTab === 'home' && (
            <>
              <div className="ribbon-group">
                <div className="ribbon-group-items">
                  <button className="rb-icon" title="Copiar">📋</button>
                  <button className="rb-icon" title="Colar">📋</button>
                  <button className="rb-icon" title="Recortar">✂️</button>
                </div>
              </div>
              <div className="ribbon-sep" />
              <div className="ribbon-group">
                <div className="ribbon-group-items">
                  <button className="rb-icon" title="Negrito"><b>B</b></button>
                  <button className="rb-icon" title="Itálico"><i>I</i></button>
                  <button className="rb-icon" title="Sublinhado"><u>U</u></button>
                </div>
              </div>
              <div className="ribbon-sep" />
              <div className="ribbon-group">
                <div className="ribbon-group-items">
                  <button className="rb-icon" title="Alinhar esquerda">⬅️</button>
                  <button className="rb-icon" title="Centralizar">⬇️</button>
                  <button className="rb-icon" title="Alinhar direita">➡️</button>
                </div>
              </div>
            </>
          )}
          {selectedTab === 'insert' && (
            <>
              <div className="ribbon-group">
                <div className="ribbon-group-items">
                  <button className="rb-icon" title="Imagem">🖼️</button>
                  <button className="rb-icon" title="Tabela">📊</button>
                  <button className="rb-icon" title="Forma">🔷</button>
                </div>
              </div>
            </>
          )}
          {selectedTab === 'layout' && (
            <>
              <div className="ribbon-group">
                <div className="ribbon-group-items">
                  <button className="rb-icon" title="Margens">📐</button>
                  <button className="rb-icon" title="Orientação">🔄</button>
                  <button className="rb-icon" title="Tamanho página">📏</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="editor-container">
        <div className="page-canvas">
          <div className="page">
            <h1 contentEditable suppressContentEditableWarning>
              Documento
            </h1>
            <div
              className="page-editable"
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setContent((e.target as HTMLElement).innerHTML)}
            >
              <p>Início do documento...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="statusbar">
        <div className="statusbar-left">
          <span>Doc 1</span>
          <span>—</span>
          <span>Modo de Edição</span>
        </div>
        <div className="statusbar-right">
          <button className="qa-btn" title="Salvar">💾</button>
          <button className="qa-btn" title="Configurações">⚙️</button>
        </div>
      </div>
    </div>
  )
}
