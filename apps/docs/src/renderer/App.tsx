import { useState, useRef, useEffect, useCallback } from 'react'

export function App() {
  const [selectedTab, setSelectedTab] = useState<
    'home' | 'insert' | 'layout' | 'view'
  >('home')
  const [fontName, setFontName] = useState('Segoe UI')
  const [fontSize, setFontSize] = useState('3') // 3 = normal (12pt), 4 = 14pt, 5 = 18pt, 6 = 24pt, 7 = 36pt
  const [foreColor, setForeColor] = useState('#242424')
  const [highlightColor, setHighlightColor] = useState('#ffff00')
  const [zoom, setZoom] = useState(100)
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    'portrait'
  )
  const [marginSize, setMarginSize] = useState<'normal' | 'narrow' | 'wide'>(
    'normal'
  )
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrike, setIsStrike] = useState(false)
  const [docTitle, setDocTitle] = useState('Documento sem título')

  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Atualiza contadores e estados de formatação
  const updateEditorState = useCallback(() => {
    if (!editorRef.current) return

    const text = editorRef.current.innerText || ''
    const chars = text.replace(/[\r\n]/g, '').length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0

    setCharCount(chars)
    setWordCount(words)

    try {
      setIsBold(document.queryCommandState('bold'))
      setIsItalic(document.queryCommandState('italic'))
      setIsUnderline(document.queryCommandState('underline'))
      setIsStrike(document.queryCommandState('strikeThrough'))
    } catch {
      // Ignora se não houver seleção válida
    }
  }, [])

  useEffect(() => {
    updateEditorState()
  }, [updateEditorState])

  // Executa comandos de formatação com segurança
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand(command, false, value)
    updateEditorState()
  }

  // Manipulação de Arquivos
  const handleNewDocument = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML =
        '<p>Comece a digitar seu novo documento aqui...</p>'
      setDocTitle('Documento sem título')
      updateEditorState()
    }
  }

  const handleOpenDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editorRef.current) return

    setDocTitle(file.name.replace(/\.[^/.]+$/, ''))
    const reader = new FileReader()

    if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
      reader.onload = (event) => {
        if (editorRef.current && event.target?.result) {
          editorRef.current.innerHTML = String(event.target.result)
          updateEditorState()
        }
      }
      reader.readAsText(file)
    } else {
      reader.onload = (event) => {
        if (editorRef.current && event.target?.result) {
          const lines = String(event.target.result).split('\n')
          editorRef.current.innerHTML = lines
            .map((l) => `<p>${l || '<br>'}</p>`)
            .join('')
          updateEditorState()
        }
      }
      reader.readAsText(file)
    }
  }

  const handleSaveDoc = () => {
    if (!editorRef.current) return
    const content = editorRef.current.innerHTML
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docTitle}</title></head><body>${content}</body></html>`
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${docTitle || 'documento'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleInsertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        execCmd('insertImage', String(event.target.result))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleInsertTable = () => {
    const rows = prompt('Número de linhas:', '3')
    const cols = prompt('Número de colunas:', '3')
    const r = parseInt(rows || '0', 10)
    const c = parseInt(cols || '0', 10)
    if (r > 0 && c > 0) {
      let tableHtml =
        '<table style="border-collapse: collapse; width: 100%; margin: 12px 0;"><tbody>'
      for (let i = 0; i < r; i++) {
        tableHtml += '<tr>'
        for (let j = 0; j < c; j++) {
          tableHtml += `<td style="border: 1px solid var(--border-strong, #ccc); padding: 8px 12px; min-width: 60px;">Célula</td>`
        }
        tableHtml += '</tr>'
      }
      tableHtml += '</tbody></table><p><br></p>'
      execCmd('insertHTML', tableHtml)
    }
  }

  const handleInsertLink = () => {
    const url = prompt('Digite a URL do link:', 'https://')
    if (url) {
      execCmd('createLink', url)
    }
  }

  // Estilos de margem da página
  const getMarginPadding = () => {
    switch (marginSize) {
      case 'narrow':
        return '48px 36px'
      case 'wide':
        return '96px 120px'
      default:
        return '96px 72px'
    }
  }

  const getPageDimensions = () => {
    const baseWidth = pageSize === 'letter' ? 850 : 816
    const baseHeight = pageSize === 'letter' ? 1100 : 1056
    if (orientation === 'landscape') {
      return { width: `${baseHeight}px`, minHeight: `${baseWidth}px` }
    }
    return { width: `${baseWidth}px`, minHeight: `${baseHeight}px` }
  }

  return (
    <div className="app">
      {/* Inputs ocultos para abertura de arquivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm,.txt"
        style={{ display: 'none' }}
        onChange={handleOpenDoc}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleInsertImage}
      />

      {/* Ribbon */}
      <div className="ribbon">
        <div className="ribbon-tabs">
          <button
            className={`ribbon-tab ${selectedTab === 'home' ? 'active' : ''}`}
            onClick={() => setSelectedTab('home')}
          >
            Início
          </button>
          <button
            className={`ribbon-tab ${selectedTab === 'insert' ? 'active' : ''}`}
            onClick={() => setSelectedTab('insert')}
          >
            Inserir
          </button>
          <button
            className={`ribbon-tab ${selectedTab === 'layout' ? 'active' : ''}`}
            onClick={() => setSelectedTab('layout')}
          >
            Layout
          </button>
          <button
            className={`ribbon-tab ${selectedTab === 'view' ? 'active' : ''}`}
            onClick={() => setSelectedTab('view')}
          >
            Exibir
          </button>
        </div>

        <div className="ribbon-body">
          {/* Aba Início */}
          {selectedTab === 'home' && (
            <>
              {/* Área de Transferência & Arquivo */}
              <div className="ribbon-group">
                <div className="ribbon-group-items">
                  <button
                    className="rb-icon"
                    title="Novo Documento"
                    onClick={handleNewDocument}
                  >
                    📄
                  </button>
                  <button
                    className="rb-icon"
                    title="Abrir Arquivo"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📂
                  </button>
                  <button
                    className="rb-icon"
                    title="Salvar (.html)"
                    onClick={handleSaveDoc}
                  >
                    💾
                  </button>
                  <button
                    className="rb-icon"
                    title="Imprimir / PDF"
                    onClick={() => window.print()}
                  >
                    🖨️
                  </button>
                </div>
              </div>

              <div className="ribbon-sep" />

              <div className="ribbon-group">
                <div className="ribbon-group-items">
                  <button
                    className="rb-icon"
                    title="Desfazer (Ctrl+Z)"
                    onClick={() => execCmd('undo')}
                  >
                    ↩️
                  </button>
                  <button
                    className="rb-icon"
                    title="Refazer (Ctrl+Y)"
                    onClick={() => execCmd('redo')}
                  >
                    ↪️
                  </button>
                  <button
                    className="rb-icon"
                    title="Recortar"
                    onClick={() => execCmd('cut')}
                  >
                    ✂️
                  </button>
                  <button
                    className="rb-icon"
                    title="Copiar"
                    onClick={() => execCmd('copy')}
                  >
                    📋
                  </button>
                </div>
              </div>

              <div className="ribbon-sep" />

              {/* Fonte e Formatação */}
              <div className="ribbon-group">
                <div className="ribbon-group-items" style={{ marginBottom: 4 }}>
                  <select
                    className="select-like"
                    value={fontName}
                    onChange={(e) => {
                      setFontName(e.target.value)
                      execCmd('fontName', e.target.value)
                    }}
                    title="Fonte"
                  >
                    <option value="Segoe UI">Segoe UI</option>
                    <option value="Arial">Arial</option>
                    <option value="Calibri">Calibri</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                  </select>

                  <select
                    className="select-like"
                    value={fontSize}
                    onChange={(e) => {
                      setFontSize(e.target.value)
                      execCmd('fontSize', e.target.value)
                    }}
                    title="Tamanho da Fonte"
                  >
                    <option value="1">10 pt</option>
                    <option value="2">11 pt</option>
                    <option value="3">12 pt</option>
                    <option value="4">14 pt</option>
                    <option value="5">18 pt</option>
                    <option value="6">24 pt</option>
                    <option value="7">36 pt</option>
                  </select>
                </div>

                <div className="ribbon-group-items">
                  <button
                    className={`rb-icon ${isBold ? 'active' : ''}`}
                    style={{
                      fontWeight: isBold ? 800 : 400,
                      background: isBold ? 'var(--hover)' : undefined,
                    }}
                    title="Negrito (Ctrl+B)"
                    onClick={() => execCmd('bold')}
                  >
                    <b>B</b>
                  </button>
                  <button
                    className={`rb-icon ${isItalic ? 'active' : ''}`}
                    style={{
                      background: isItalic ? 'var(--hover)' : undefined,
                    }}
                    title="Itálico (Ctrl+I)"
                    onClick={() => execCmd('italic')}
                  >
                    <i>I</i>
                  </button>
                  <button
                    className={`rb-icon ${isUnderline ? 'active' : ''}`}
                    style={{
                      background: isUnderline ? 'var(--hover)' : undefined,
                    }}
                    title="Sublinhado (Ctrl+U)"
                    onClick={() => execCmd('underline')}
                  >
                    <u>U</u>
                  </button>
                  <button
                    className={`rb-icon ${isStrike ? 'active' : ''}`}
                    style={{
                      background: isStrike ? 'var(--hover)' : undefined,
                    }}
                    title="Tachado"
                    onClick={() => execCmd('strikeThrough')}
                  >
                    <s>S</s>
                  </button>

                  {/* Cor do Texto */}
                  <label
                    className="rb-icon"
                    title="Cor da Fonte"
                    style={{ position: 'relative', cursor: 'pointer' }}
                  >
                    <span style={{ color: foreColor, fontWeight: 'bold' }}>
                      A
                    </span>
                    <input
                      type="color"
                      value={foreColor}
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        width: '100%',
                        height: '100%',
                        cursor: 'pointer',
                      }}
                      onChange={(e) => {
                        setForeColor(e.target.value)
                        execCmd('foreColor', e.target.value)
                      }}
                    />
                  </label>

                  {/* Cor de Realce */}
                  <label
                    className="rb-icon"
                    title="Cor do Realce"
                    style={{ position: 'relative', cursor: 'pointer' }}
                  >
                    <span>🖍️</span>
                    <input
                      type="color"
                      value={highlightColor}
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        width: '100%',
                        height: '100%',
                        cursor: 'pointer',
                      }}
                      onChange={(e) => {
                        setHighlightColor(e.target.value)
                        execCmd('hiliteColor', e.target.value)
                      }}
                    />
                  </label>

                  <button
                    className="rb-icon"
                    title="Limpar Formatação"
                    onClick={() => execCmd('removeFormat')}
                  >
                    🧹
                  </button>
                </div>
              </div>

              <div className="ribbon-sep" />

              {/* Parágrafo e Alinhamento */}
              <div className="ribbon-group">
                <div className="ribbon-group-items" style={{ marginBottom: 4 }}>
                  <button
                    className="rb-icon"
                    title="Alinhar à Esquerda"
                    onClick={() => execCmd('justifyLeft')}
                  >
                    ⬅️
                  </button>
                  <button
                    className="rb-icon"
                    title="Centralizar"
                    onClick={() => execCmd('justifyCenter')}
                  >
                    ↔️
                  </button>
                  <button
                    className="rb-icon"
                    title="Alinhar à Direita"
                    onClick={() => execCmd('justifyRight')}
                  >
                    ➡️
                  </button>
                  <button
                    className="rb-icon"
                    title="Justificar"
                    onClick={() => execCmd('justifyFull')}
                  >
                    ⏸️
                  </button>
                </div>
                <div className="ribbon-group-items">
                  <button
                    className="rb-icon"
                    title="Lista com Marcadores"
                    onClick={() => execCmd('insertUnorderedList')}
                  >
                    •≡
                  </button>
                  <button
                    className="rb-icon"
                    title="Lista Numerada"
                    onClick={() => execCmd('insertOrderedList')}
                  >
                    1≡
                  </button>
                  <button
                    className="rb-icon"
                    title="Diminuir Recuo"
                    onClick={() => execCmd('outdent')}
                  >
                    ⇤
                  </button>
                  <button
                    className="rb-icon"
                    title="Aumentar Recuo"
                    onClick={() => execCmd('indent')}
                  >
                    ⇥
                  </button>
                </div>
              </div>

              <div className="ribbon-sep" />

              {/* Títulos e Estilos */}
              <div className="ribbon-group">
                <div className="ribbon-group-items">
                  <button
                    className="rb-icon"
                    title="Título 1"
                    onClick={() => execCmd('formatBlock', '<h1>')}
                  >
                    H1
                  </button>
                  <button
                    className="rb-icon"
                    title="Título 2"
                    onClick={() => execCmd('formatBlock', '<h2>')}
                  >
                    H2
                  </button>
                  <button
                    className="rb-icon"
                    title="Título 3"
                    onClick={() => execCmd('formatBlock', '<h3>')}
                  >
                    H3
                  </button>
                  <button
                    className="rb-icon"
                    title="Parágrafo Normal"
                    onClick={() => execCmd('formatBlock', '<p>')}
                  >
                    P
                  </button>
                  <button
                    className="rb-icon"
                    title="Citação"
                    onClick={() => execCmd('formatBlock', '<blockquote>')}
                  >
                    ❝
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Aba Inserir */}
          {selectedTab === 'insert' && (
            <>
              <div className="ribbon-group">
                <div className="ribbon-group-items">
                  <button
                    className="rb-icon"
                    title="Inserir Imagem do Computador"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    🖼️ Imagem
                  </button>
                  <button
                    className="rb-icon"
                    title="Inserir Tabela"
                    onClick={handleInsertTable}
                  >
                    📊 Tabela
                  </button>
                  <button
                    className="rb-icon"
                    title="Inserir Linha Divisória"
                    onClick={() => execCmd('insertHorizontalRule')}
                  >
                    ➖ Linha
                  </button>
                  <button
                    className="rb-icon"
                    title="Inserir Link"
                    onClick={handleInsertLink}
                  >
                    🔗 Link
                  </button>
                </div>
              </div>

              <div className="ribbon-sep" />

              <div className="ribbon-group">
                <div className="ribbon-group-items">
                  <button
                    className="rb-icon"
                    title="Inserir Símbolo ©"
                    onClick={() => execCmd('insertText', '©')}
                  >
                    ©
                  </button>
                  <button
                    className="rb-icon"
                    title="Inserir Símbolo ®"
                    onClick={() => execCmd('insertText', '®')}
                  >
                    ®
                  </button>
                  <button
                    className="rb-icon"
                    title="Inserir Símbolo ™"
                    onClick={() => execCmd('insertText', '™')}
                  >
                    ™
                  </button>
                  <button
                    className="rb-icon"
                    title="Inserir Símbolo §"
                    onClick={() => execCmd('insertText', '§')}
                  >
                    §
                  </button>
                  <button
                    className="rb-icon"
                    title="Inserir Data Atual"
                    onClick={() =>
                      execCmd(
                        'insertText',
                        new Date().toLocaleDateString('pt-BR')
                      )
                    }
                  >
                    📅 Data
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Aba Layout */}
          {selectedTab === 'layout' && (
            <>
              <div className="ribbon-group">
                <div className="ribbon-group-items">
                  <select
                    className="select-like"
                    value={marginSize}
                    onChange={(e) =>
                      setMarginSize(
                        e.target.value as 'normal' | 'narrow' | 'wide'
                      )
                    }
                    title="Margens"
                  >
                    <option value="normal">Margens: Normal (2.5 cm)</option>
                    <option value="narrow">Margens: Estreita (1.27 cm)</option>
                    <option value="wide">Margens: Larga (3.8 cm)</option>
                  </select>

                  <select
                    className="select-like"
                    value={orientation}
                    onChange={(e) =>
                      setOrientation(e.target.value as 'portrait' | 'landscape')
                    }
                    title="Orientação"
                  >
                    <option value="portrait">Orientação: Retrato</option>
                    <option value="landscape">Orientação: Paisagem</option>
                  </select>

                  <select
                    className="select-like"
                    value={pageSize}
                    onChange={(e) =>
                      setPageSize(e.target.value as 'a4' | 'letter')
                    }
                    title="Tamanho do Papel"
                  >
                    <option value="a4">Tamanho: A4</option>
                    <option value="letter">Tamanho: Carta (Letter)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Aba Exibir */}
          {selectedTab === 'view' && (
            <>
              <div className="ribbon-group">
                <div className="ribbon-group-items">
                  <button
                    className="rb-icon"
                    title="Zoom 75%"
                    onClick={() => setZoom(75)}
                  >
                    75%
                  </button>
                  <button
                    className="rb-icon"
                    title="Zoom 100%"
                    onClick={() => setZoom(100)}
                  >
                    100%
                  </button>
                  <button
                    className="rb-icon"
                    title="Zoom 125%"
                    onClick={() => setZoom(125)}
                  >
                    125%
                  </button>
                  <button
                    className="rb-icon"
                    title="Zoom 150%"
                    onClick={() => setZoom(150)}
                  >
                    150%
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Área do Editor */}
      <div className="editor-container">
        <div className="page-canvas">
          <div
            className="page"
            style={{
              ...getPageDimensions(),
              padding: getMarginPadding(),
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease, width 0.2s ease',
            }}
          >
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: 'var(--word-blue, #185abd)',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                marginBottom: '16px',
                fontFamily: 'inherit',
              }}
              title="Título do Documento"
            />
            <div
              ref={editorRef}
              className="page-editable"
              contentEditable
              suppressContentEditableWarning
              onInput={updateEditorState}
              onKeyUp={updateEditorState}
              onMouseUp={updateEditorState}
            >
              <p>
                Bem-vindo ao <b>GenOffice Docs</b>! Este é um editor de
                documentos rico e funcional.
              </p>
              <p>
                Você pode formatar texto com negrito, itálico, cores, alinhar
                parágrafos, inserir tabelas, imagens e exportar para HTML ou
                imprimir em PDF com um clique.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Status */}
      <div className="statusbar">
        <div className="statusbar-left">
          <span>{docTitle}</span>
          <span>—</span>
          <span>{wordCount} palavras</span>
          <span>—</span>
          <span>{charCount} caracteres</span>
          <span>—</span>
          <span>Modo de Edição</span>
        </div>
        <div className="statusbar-right">
          <span style={{ marginRight: 8 }}>Zoom: {zoom}%</span>
          <button
            className="qa-btn"
            title="Salvar (.html)"
            onClick={handleSaveDoc}
          >
            💾
          </button>
          <button
            className="qa-btn"
            title="Imprimir / Salvar PDF"
            onClick={() => window.print()}
          >
            🖨️
          </button>
        </div>
      </div>
    </div>
  )
}
