import { useState } from 'react'

export function App() {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [hasDocument, setHasDocument] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  const pages = []
  for (let i = 0; i < totalPages; i++) {
    pages.push(
      <div key={i} className="pdf-page">
        <div className="pdf-page-content">
          <div className="pdf-placeholder">
            <div className="pdf-placeholder-icon">📄</div>
            <div className="pdf-placeholder-text">Página {i + 1}</div>
            <div className="pdf-placeholder-sub">PDF.js render aqui</div>
          </div>
        </div>
      </div>
    )
  }

  const thumbnails = []
  for (let i = 0; i < totalPages; i++) {
    thumbnails.push(
      <div
        key={i}
        className={`pdf-thumb ${i + 1 === currentPage ? 'active' : ''}`}
        onClick={() => setCurrentPage(i + 1)}
      >
        <div className="pdf-thumb-box" />
        <span className="pdf-thumb-no">{i + 1}</span>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Ribbon */}
      <div className="ribbon">
        <div className="ribbon-tabs">
          <button className="ribbon-tab active">Arquivo</button>
          <button className="ribbon-tab">Editar</button>
          <button className="ribbon-tab">Exibir</button>
          <button className="ribbon-tab">Ferramentas</button>
          <button className="ribbon-tab">Ajuda</button>
        </div>
        <div className="ribbon-body">
          <div className="ribbon-group">
            <div className="ribbon-group-items">
              <button className="rb-big">
                <div className="rb-big-icon">📂</div>
                Abrir
              </button>
              <button className="rb-big">
                <div className="rb-big-icon">💾</div>
                Salvar
              </button>
              <div className="ribbon-sep" />
              <button className="rb-small">📥 Baixar</button>
              <button className="rb-small">🖨️ Imprimir</button>
            </div>
          </div>
          <div className="ribbon-sep" />
          <div className="ribbon-group">
            <div className="ribbon-group-items">
              <button className="rb-icon">🔍</button>
              <button className="rb-icon">✏️</button>
              <button className="rb-icon">📝</button>
              <button className="rb-icon">📋</button>
            </div>
          </div>
          <div className="ribbon-sep" />
          <div className="ribbon-group">
            <div className="ribbon-group-items">
              <button className="rb-icon">🔒</button>
              <button className="rb-icon">🔐</button>
            </div>
          </div>
        </div>
      </div>

      {hasDocument ? (
        <>
          {/* Toolbar de navegação */}
          <div className="pdf-toolbar">
            <button className="qa-btn">◀</button>
            <input
              className="tb-page-input"
              type="number"
              value={currentPage}
              min={1}
              max={totalPages || 1}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                if (val >= 1 && val <= (totalPages || 1)) {
                  setCurrentPage(val)
                }
              }}
            />
            <span className="tb-page-total">
              / {totalPages || 1}
            </span>
            <div className="tb-sep" />
            <button className="qa-btn">➖</button>
            <span className="tb-zoom">{zoom}%</span>
            <button className="qa-btn">➕</button>
            <div className="tb-sep" />
            <button className="qa-btn" title="Ir para página">📑</button>
            <button className="qa-btn" title="Bookmarks">🔖</button>
            <button className="qa-btn" title="Thumbnails">🖼️</button>
          </div>

          {/* Área do PDF */}
          <div className="pdf-body">
            <div className="pdf-thumbs">
              {totalPages > 0 ? thumbnails : (
                <div className="pdf-placeholder">
                  <div className="pdf-placeholder-icon">📂</div>
                  <div className="pdf-placeholder-text">Abra um PDF</div>
                </div>
              )}
            </div>
            <div className="pdf-scroll">
              {totalPages > 0 ? (
                <div className="pdf-row">
                  {pages}
                </div>
              ) : (
                <div className="pdf-empty">
                  <div className="pdf-empty-icon">📄</div>
                  <div className="pdf-empty-title">Nenhum documento aberto</div>
                  <div className="pdf-empty-sub">Abra um arquivo PDF para visualizar</div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Área de placeholder */}
          <div className="pdf-body">
            <div className="pdf-scroll">
              <div className="pdf-empty">
                <div className="pdf-empty-icon">📄</div>
                <div className="pdf-empty-title">GenOffice PDF</div>
                <div className="pdf-empty-sub">
                  <button className="rb-big" style={{ padding: '12px 32px' }}>
                    <div className="rb-big-icon">📂</div>
                    Abrir PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Status bar */}
      <div className="status-bar">
        <div className="status-left">
          <span>PDF</span>
          <span>—</span>
          {hasDocument && totalPages > 0 ? (
            <>
              <span>Página {currentPage} de {totalPages}</span>
              <span>—</span>
              <span>Zoom: {zoom}%</span>
            </>
          ) : (
            <span>Nenhum documento</span>
          )}
        </div>
        <div className="status-right">
          <button className="qa-btn" title="Modo Leitura">📖</button>
          <button className="qa-btn" title="Layout de Página">📐</button>
        </div>
      </div>
    </div>
  )
}
