import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import * as XLSX from 'xlsx'

interface CellData {
  raw: string
  computed: string
  bold?: boolean
  italic?: boolean
  color?: string
  bg?: string
  align?: 'left' | 'center' | 'right'
  numFmt?: 'general' | 'currency' | 'percent' | 'number'
}

type SheetStore = Record<string, CellData>

const DEFAULT_COLS = 26 // A até Z
const DEFAULT_ROWS = 60 // 1 até 60

// Converte índice (0-based) para letra da coluna (0 -> A, 25 -> Z)
function colToLetter(colIndex: number): string {
  let temp = colIndex
  let letter = ''
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter
    temp = Math.floor(temp / 26) - 1
  }
  return letter
}

// Converte coordenada ex: 'A1' para { col: 0, row: 0 }
function parseCellKey(key: string): { col: number; row: number } | null {
  const match = key.match(/^([A-Z]+)(\d+)$/)
  if (!match) return null
  const letters = match[1]
  const row = parseInt(match[2], 10) - 1
  let col = 0
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64)
  }
  return { col: col - 1, row }
}

// Expande intervalo ex: 'A1:B3' para lista de chaves ['A1', 'A2', 'A3', 'B1', 'B2', 'B3']
function expandRange(rangeStr: string): string[] {
  const parts = rangeStr.split(':')
  if (parts.length !== 2) return [rangeStr.trim().toUpperCase()]

  const start = parseCellKey(parts[0].trim().toUpperCase())
  const end = parseCellKey(parts[1].trim().toUpperCase())
  if (!start || !end) return []

  const minCol = Math.min(start.col, end.col)
  const maxCol = Math.max(start.col, end.col)
  const minRow = Math.min(start.row, end.row)
  const maxRow = Math.max(start.row, end.row)

  const keys: string[] = []
  for (let c = minCol; c <= maxCol; c++) {
    for (let r = minRow; r <= maxRow; r++) {
      keys.push(`${colToLetter(c)}${r + 1}`)
    }
  }
  return keys
}

// Avaliador de Fórmulas simples e reativo
function evaluateFormula(
  expr: string,
  store: SheetStore,
  visited = new Set<string>()
): string {
  if (!expr.startsWith('=')) return expr
  const cleanExpr = expr.slice(1).trim()
  const upper = cleanExpr.toUpperCase()

  // Função SOMA / SUM
  const sumMatch = upper.match(/^(?:SUM|SOMA)\(([^)]+)\)$/)
  if (sumMatch) {
    const rangeKeys = expandRange(sumMatch[1])
    let sum = 0
    for (const key of rangeKeys) {
      if (!visited.has(key)) {
        const val = getNumericValue(
          store[key]?.raw || '',
          store,
          new Set([...visited, key])
        )
        sum += val
      }
    }
    return String(sum)
  }

  // Função MÉDIA / AVERAGE
  const avgMatch = upper.match(/^(?:AVERAGE|MEDIA|MÉDIA)\(([^)]+)\)$/)
  if (avgMatch) {
    const rangeKeys = expandRange(avgMatch[1])
    let sum = 0
    let count = 0
    for (const key of rangeKeys) {
      if (!visited.has(key)) {
        const val = getNumericValue(
          store[key]?.raw || '',
          store,
          new Set([...visited, key])
        )
        sum += val
        count++
      }
    }
    return count > 0 ? String(Number((sum / count).toFixed(2))) : '0'
  }

  // Função CONTAR / COUNT
  const countMatch = upper.match(/^(?:COUNT|CONTAR|CONT\.VALORES)\(([^)]+)\)$/)
  if (countMatch) {
    const rangeKeys = expandRange(countMatch[1])
    let count = 0
    for (const key of rangeKeys) {
      const cell = store[key]
      if (cell && cell.raw.trim()) count++
    }
    return String(count)
  }

  // Função MÁXIMO / MAX
  const maxMatch = upper.match(/^(?:MAX|MÁXIMO)\(([^)]+)\)$/)
  if (maxMatch) {
    const rangeKeys = expandRange(maxMatch[1])
    const nums: number[] = []
    for (const key of rangeKeys) {
      if (!visited.has(key)) {
        nums.push(
          getNumericValue(
            store[key]?.raw || '',
            store,
            new Set([...visited, key])
          )
        )
      }
    }
    return nums.length ? String(Math.max(...nums)) : '0'
  }

  // Função MÍNIMO / MIN
  const minMatch = upper.match(/^(?:MIN|MÍNIMO)\(([^)]+)\)$/)
  if (minMatch) {
    const rangeKeys = expandRange(minMatch[1])
    const nums: number[] = []
    for (const key of rangeKeys) {
      if (!visited.has(key)) {
        nums.push(
          getNumericValue(
            store[key]?.raw || '',
            store,
            new Set([...visited, key])
          )
        )
      }
    }
    return nums.length ? String(Math.min(...nums)) : '0'
  }

  // Expressões aritméticas simples (ex: A1 + B1, A1 * 2)
  try {
    const substituted = cleanExpr.replace(/[A-Z]+\d+/gi, (cellRef) => {
      const refKey = cellRef.toUpperCase()
      if (visited.has(refKey)) return '0'
      const val = getNumericValue(
        store[refKey]?.raw || '',
        store,
        new Set([...visited, refKey])
      )
      return String(val)
    })
    // Avalia apenas números e operadores matemáticos com segurança
    if (/^[0-9+\-*/().\s]+$/.test(substituted)) {
      const result = Function(`'use strict'; return (${substituted})`)()
      return typeof result === 'number' && !isNaN(result)
        ? String(Number(result.toFixed(4)))
        : String(result)
    }
  } catch {
    return '#ERRO!'
  }

  return cleanExpr
}

function getNumericValue(
  raw: string,
  store: SheetStore,
  visited = new Set<string>()
): number {
  if (!raw) return 0
  if (raw.startsWith('=')) {
    const evalResult = evaluateFormula(raw, store, visited)
    const parsed = parseFloat(evalResult)
    return isNaN(parsed) ? 0 : parsed
  }
  const parsed = parseFloat(raw.replace(/[R$\s%]/g, '').replace(',', '.'))
  return isNaN(parsed) ? 0 : parsed
}

export function App() {
  const [activeSheet, setActiveSheet] = useState('Planilha1')
  const [sheetTabs, setSheetTabs] = useState(['Planilha1', 'Planilha2'])
  const [sheetsData, setSheetsData] = useState<Record<string, SheetStore>>({
    Planilha1: {
      A1: {
        raw: 'Produto',
        computed: 'Produto',
        bold: true,
        align: 'left',
        bg: '#f0f2f5',
      },
      B1: {
        raw: 'Quantidade',
        computed: 'Quantidade',
        bold: true,
        align: 'right',
        bg: '#f0f2f5',
      },
      C1: {
        raw: 'Preço Unitário',
        computed: 'Preço Unitário',
        bold: true,
        align: 'right',
        bg: '#f0f2f5',
      },
      D1: {
        raw: 'Total',
        computed: 'Total',
        bold: true,
        align: 'right',
        bg: '#f0f2f5',
      },
      A2: { raw: 'Caneta Azul', computed: 'Caneta Azul' },
      B2: { raw: '10', computed: '10', align: 'right' },
      C2: { raw: '2.50', computed: '2.50', align: 'right', numFmt: 'currency' },
      D2: { raw: '=B2*C2', computed: '25', align: 'right', numFmt: 'currency' },
      A3: { raw: 'Caderno 100fls', computed: 'Caderno 100fls' },
      B3: { raw: '5', computed: '5', align: 'right' },
      C3: {
        raw: '18.90',
        computed: '18.90',
        align: 'right',
        numFmt: 'currency',
      },
      D3: {
        raw: '=B3*C3',
        computed: '94.5',
        align: 'right',
        numFmt: 'currency',
      },
      A4: { raw: 'Total Geral', computed: 'Total Geral', bold: true },
      D4: {
        raw: '=SUM(D2:D3)',
        computed: '119.5',
        bold: true,
        align: 'right',
        numFmt: 'currency',
      },
    },
    Planilha2: {},
  })

  const [selectedCell, setSelectedCell] = useState('A1')
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editInput, setEditInput] = useState('')
  const [formulaBarInput, setFormulaBarInput] = useState('')
  const [workbookTitle, setWorkbookTitle] = useState('Pasta1')
  const [zoom, setZoom] = useState(100)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cellInputRef = useRef<HTMLInputElement>(null)

  const currentStore = useMemo(
    () => sheetsData[activeSheet] || {},
    [sheetsData, activeSheet]
  )

  // Recalcula fórmulas quando a planilha for modificada
  const recalculateStore = useCallback((store: SheetStore): SheetStore => {
    const updated: SheetStore = { ...store }
    for (const key of Object.keys(updated)) {
      const cell = updated[key]
      if (cell && cell.raw.startsWith('=')) {
        updated[key] = {
          ...cell,
          computed: evaluateFormula(cell.raw, updated),
        }
      }
    }
    return updated
  }, [])

  // Sincroniza barra de fórmula ao mudar célula selecionada
  useEffect(() => {
    const rawVal = currentStore[selectedCell]?.raw || ''
    setFormulaBarInput(rawVal)
    if (editingCell) {
      setEditInput(rawVal)
    }
  }, [selectedCell, currentStore, editingCell])

  // Atualização de conteúdo de uma célula
  const updateCellValue = (key: string, newRaw: string) => {
    setSheetsData((prev) => {
      const store = { ...(prev[activeSheet] || {}) }
      const prevCell = store[key] || { raw: '', computed: '' }
      const newComputed = newRaw.startsWith('=')
        ? evaluateFormula(newRaw, store)
        : newRaw

      store[key] = {
        ...prevCell,
        raw: newRaw,
        computed: newComputed,
      }

      const recalculated = recalculateStore(store)
      return {
        ...prev,
        [activeSheet]: recalculated,
      }
    })
  }

  // Formatação de células
  const toggleFormat = (key: keyof CellData, value?: unknown) => {
    setSheetsData((prev) => {
      const store = { ...(prev[activeSheet] || {}) }
      const current = store[selectedCell] || { raw: '', computed: '' }

      const updatedCell: CellData = {
        ...current,
        [key]: value !== undefined ? value : !current[key],
      }
      store[selectedCell] = updatedCell

      return {
        ...prev,
        [activeSheet]: store,
      }
    })
  }

  // Manipulação de Arquivos XLSX
  const handleOpenFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setWorkbookTitle(file.name.replace(/\.[^/.]+$/, ''))
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })

        const newSheetsData: Record<string, SheetStore> = {}
        const newSheetTabs: string[] = []

        workbook.SheetNames.forEach((sheetName) => {
          newSheetTabs.push(sheetName)
          const ws = workbook.Sheets[sheetName]
          const store: SheetStore = {}

          // Converte células da planilha XLSX para o formato da app
          for (const cellAddress in ws) {
            if (cellAddress.startsWith('!')) continue
            const cellObj = ws[cellAddress]
            if (cellObj) {
              const rawStr = cellObj.f
                ? `=${cellObj.f}`
                : String(cellObj.v ?? '')
              store[cellAddress] = {
                raw: rawStr,
                computed: String(cellObj.v ?? rawStr),
                align: typeof cellObj.v === 'number' ? 'right' : 'left',
              }
            }
          }
          newSheetsData[sheetName] = recalculateStore(store)
        })

        setSheetTabs(newSheetTabs)
        setActiveSheet(newSheetTabs[0] || 'Planilha1')
        setSheetsData(newSheetsData)
      } catch (err) {
        alert('Erro ao abrir arquivo de planilha: ' + String(err))
      }
    }

    reader.readAsArrayBuffer(file)
  }

  const handleExportXLSX = () => {
    const wb = XLSX.utils.book_new()

    sheetTabs.forEach((sName) => {
      const store = sheetsData[sName] || {}
      const maxCol = DEFAULT_COLS
      const maxRow = DEFAULT_ROWS
      const aoa: (string | number)[][] = []

      for (let r = 0; r < maxRow; r++) {
        const rowArr: (string | number)[] = []
        let rowHasData = false
        for (let c = 0; c < maxCol; c++) {
          const key = `${colToLetter(c)}${r + 1}`
          const cell = store[key]
          if (cell && cell.computed) {
            const num = parseFloat(cell.computed)
            rowArr.push(
              isNaN(num) || cell.raw.startsWith("'") ? cell.computed : num
            )
            rowHasData = true
          } else {
            rowArr.push('')
          }
        }
        if (rowHasData || r < 20) {
          aoa.push(rowArr)
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(aoa)
      XLSX.utils.book_append_sheet(wb, ws, sName)
    })

    XLSX.writeFile(wb, `${workbookTitle || 'Planilha'}.xlsx`)
  }

  // Estatísticas para a barra de status
  const statusStats = useMemo(() => {
    let sum = 0
    let count = 0
    let numericCount = 0

    for (const key of Object.keys(currentStore)) {
      const cell = currentStore[key]
      if (cell && cell.raw.trim()) {
        count++
        const num = parseFloat(cell.computed)
        if (!isNaN(num)) {
          sum += num
          numericCount++
        }
      }
    }

    const avg = numericCount > 0 ? Number((sum / numericCount).toFixed(2)) : 0
    return { count, sum: Number(sum.toFixed(2)), avg }
  }, [currentStore])

  // Formatação do valor para renderização na célula
  const formatDisplayValue = (cell?: CellData) => {
    if (!cell) return ''
    const val = cell.computed
    if (cell.numFmt === 'currency') {
      const num = parseFloat(val)
      return isNaN(num)
        ? val
        : num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
    if (cell.numFmt === 'percent') {
      const num = parseFloat(val)
      return isNaN(num) ? val : `${(num * 100).toFixed(1)}%`
    }
    return val
  }

  return (
    <div
      className="app-shell"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={handleOpenFile}
      />

      {/* Header com Título da Planilha */}
      <div
        className="excel-header"
        style={{
          padding: '6px 12px',
          borderBottom: '1px solid var(--border-strong)',
        }}
      >
        <span style={{ fontSize: '18px', marginRight: '6px' }}>📊</span>
        <input
          className="workbook-title-input"
          value={workbookTitle}
          onChange={(e) => setWorkbookTitle(e.target.value)}
          title="Renomear Pasta de Trabalho"
        />
        <div className="header-spacer" style={{ flex: 1 }} />
        <button
          className="qa-btn"
          title="Novo"
          onClick={() => setSheetsData({ Planilha1: {} })}
        >
          📄
        </button>
        <button
          className="qa-btn"
          title="Abrir Arquivo (.xlsx, .csv)"
          onClick={() => fileInputRef.current?.click()}
        >
          📂
        </button>
        <button
          className="qa-btn"
          title="Exportar / Salvar (.xlsx)"
          onClick={handleExportXLSX}
        >
          💾
        </button>
      </div>

      {/* Ribbon de Ferramentas */}
      <div className="ribbon" style={{ height: '76px' }}>
        <div className="ribbon-group">
          <div className="ribbon-group-content">
            <button
              className="rb-icon"
              title="Abrir Planilha (.xlsx)"
              onClick={() => fileInputRef.current?.click()}
            >
              📂 Abrir
            </button>
            <button
              className="rb-icon"
              title="Salvar Excel (.xlsx)"
              onClick={handleExportXLSX}
            >
              💾 Salvar
            </button>
          </div>
        </div>

        <div className="ribbon-sep" />

        {/* Formatação de Fonte e Estilo */}
        <div className="ribbon-group">
          <div className="ribbon-group-content">
            <button
              className={`rb-icon ${currentStore[selectedCell]?.bold ? 'active' : ''}`}
              style={{
                fontWeight: currentStore[selectedCell]?.bold ? 800 : 400,
              }}
              title="Negrito"
              onClick={() => toggleFormat('bold')}
            >
              <b>B</b>
            </button>
            <button
              className={`rb-icon ${currentStore[selectedCell]?.italic ? 'active' : ''}`}
              title="Itálico"
              onClick={() => toggleFormat('italic')}
            >
              <i>I</i>
            </button>

            {/* Cor da Fonte */}
            <label
              className="rb-icon"
              title="Cor da Fonte"
              style={{ position: 'relative', cursor: 'pointer' }}
            >
              <span
                style={{
                  color:
                    currentStore[selectedCell]?.color || 'var(--text-primary)',
                  fontWeight: 'bold',
                }}
              >
                A
              </span>
              <input
                type="color"
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                }}
                onChange={(e) => toggleFormat('color', e.target.value)}
              />
            </label>

            {/* Cor de Preenchimento da Célula */}
            <label
              className="rb-icon"
              title="Cor de Fundo da Célula"
              style={{ position: 'relative', cursor: 'pointer' }}
            >
              <span>🪣</span>
              <input
                type="color"
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                }}
                onChange={(e) => toggleFormat('bg', e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="ribbon-sep" />

        {/* Alinhamento */}
        <div className="ribbon-group">
          <div className="ribbon-group-content">
            <button
              className="rb-icon"
              title="Alinhar à Esquerda"
              onClick={() => toggleFormat('align', 'left')}
            >
              ⬅️
            </button>
            <button
              className="rb-icon"
              title="Centralizar"
              onClick={() => toggleFormat('align', 'center')}
            >
              ↔️
            </button>
            <button
              className="rb-icon"
              title="Alinhar à Direita"
              onClick={() => toggleFormat('align', 'right')}
            >
              ➡️
            </button>
          </div>
        </div>

        <div className="ribbon-sep" />

        {/* Formatos Numéricos */}
        <div className="ribbon-group">
          <div className="ribbon-group-content">
            <button
              className="rb-icon"
              title="Formato Moeda (R$)"
              onClick={() =>
                toggleFormat(
                  'numFmt',
                  currentStore[selectedCell]?.numFmt === 'currency'
                    ? 'general'
                    : 'currency'
                )
              }
            >
              💲 R$
            </button>
            <button
              className="rb-icon"
              title="Formato Porcentagem (%)"
              onClick={() =>
                toggleFormat(
                  'numFmt',
                  currentStore[selectedCell]?.numFmt === 'percent'
                    ? 'general'
                    : 'percent'
                )
              }
            >
              %
            </button>
            <button
              className="rb-icon"
              title="Formato Geral"
              onClick={() => toggleFormat('numFmt', 'general')}
            >
              123
            </button>
          </div>
        </div>

        <div className="ribbon-sep" />

        {/* Funções Rápidas */}
        <div className="ribbon-group">
          <div className="ribbon-group-content">
            <button
              className="rb-icon"
              title="Inserir AutoSoma =SUM(A1:A5)"
              onClick={() => updateCellValue(selectedCell, '=SUM(A1:A5)')}
            >
              Σ AutoSoma
            </button>
            <button
              className="rb-icon"
              title="Inserir Média =AVERAGE(A1:A5)"
              onClick={() => updateCellValue(selectedCell, '=AVERAGE(A1:A5)')}
            >
              x̄ Média
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Fórmulas */}
      <div
        className="formula-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          borderBottom: '1px solid var(--border-strong)',
          background: 'var(--surface)',
          gap: '6px',
        }}
      >
        <div
          style={{
            minWidth: '50px',
            textAlign: 'center',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            fontSize: '12px',
          }}
        >
          {selectedCell}
        </div>
        <div
          style={{
            color: 'var(--excel-green, #217346)',
            fontWeight: 'bold',
            fontStyle: 'italic',
            fontSize: '14px',
          }}
        >
          fx
        </div>
        <input
          style={{
            flex: 1,
            padding: '4px 8px',
            border: '1px solid var(--border-subtle)',
            borderRadius: '3px',
            outline: 'none',
            fontFamily: 'Consolas, monospace',
            fontSize: '12.5px',
          }}
          placeholder="Digite um valor ou fórmula (ex: =SUM(A1:A10), =A1+B1)"
          value={formulaBarInput}
          onChange={(e) => {
            setFormulaBarInput(e.target.value)
            updateCellValue(selectedCell, e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const parsed = parseCellKey(selectedCell)
              if (parsed)
                setSelectedCell(`${colToLetter(parsed.col)}${parsed.row + 2}`)
            }
          }}
        />
      </div>

      {/* Grid da Planilha */}
      <div
        className="spreadsheet-container"
        style={{ flex: 1, overflow: 'auto', background: 'var(--surface)' }}
      >
        <table
          style={{
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            width: 'max-content',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  width: '45px',
                  background: 'var(--sheets-statusbar-bg, #f3f4f6)',
                  borderRight: '1px solid var(--border-strong)',
                  borderBottom: '1px solid var(--border-strong)',
                  position: 'sticky',
                  top: 0,
                  left: 0,
                  zIndex: 20,
                }}
              />
              {Array.from({ length: DEFAULT_COLS }).map((_, c) => {
                const colLetter = colToLetter(c)
                const isColActive = selectedCell.startsWith(colLetter)
                return (
                  <th
                    key={colLetter}
                    style={{
                      width: '90px',
                      padding: '5px',
                      fontSize: '11px',
                      background: isColActive
                        ? 'var(--excel-green-soft, #e9f3ed)'
                        : 'var(--sheets-statusbar-bg, #f3f4f6)',
                      color: isColActive
                        ? 'var(--excel-green, #217346)'
                        : 'var(--text-secondary)',
                      fontWeight: isColActive ? 'bold' : 'normal',
                      borderRight: '1px solid var(--border-subtle)',
                      borderBottom: '1px solid var(--border-strong)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      userSelect: 'none',
                    }}
                  >
                    {colLetter}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: DEFAULT_ROWS }).map((_, r) => {
              const rowNum = r + 1
              const isRowActive = selectedCell.endsWith(String(rowNum))
              return (
                <tr key={rowNum}>
                  <td
                    style={{
                      textAlign: 'center',
                      fontSize: '11px',
                      background: isRowActive
                        ? 'var(--excel-green-soft, #e9f3ed)'
                        : 'var(--sheets-statusbar-bg, #f3f4f6)',
                      color: isRowActive
                        ? 'var(--excel-green, #217346)'
                        : 'var(--text-secondary)',
                      fontWeight: isRowActive ? 'bold' : 'normal',
                      borderRight: '1px solid var(--border-strong)',
                      borderBottom: '1px solid var(--border-subtle)',
                      position: 'sticky',
                      left: 0,
                      zIndex: 5,
                      userSelect: 'none',
                    }}
                  >
                    {rowNum}
                  </td>
                  {Array.from({ length: DEFAULT_COLS }).map((_, c) => {
                    const key = `${colToLetter(c)}${rowNum}`
                    const cell = currentStore[key]
                    const isSelected = selectedCell === key
                    const isEditing = editingCell === key

                    return (
                      <td
                        key={key}
                        style={{
                          height: '24px',
                          padding: '3px 6px',
                          fontSize: '12px',
                          borderRight: '1px solid var(--border-subtle)',
                          borderBottom: '1px solid var(--border-subtle)',
                          outline: isSelected
                            ? '2px solid var(--excel-green, #217346)'
                            : 'none',
                          outlineOffset: '-1px',
                          backgroundColor: isSelected
                            ? 'var(--accent-soft, #e9f3ed)'
                            : cell?.bg || 'transparent',
                          color: cell?.color || 'inherit',
                          fontWeight: cell?.bold ? 'bold' : 'normal',
                          fontStyle: cell?.italic ? 'italic' : 'normal',
                          textAlign: cell?.align || 'left',
                          cursor: 'cell',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          userSelect: 'none',
                        }}
                        onClick={() => {
                          setSelectedCell(key)
                          if (editingCell && editingCell !== key)
                            setEditingCell(null)
                        }}
                        onDoubleClick={() => {
                          setEditingCell(key)
                          setEditInput(cell?.raw || '')
                          setTimeout(() => cellInputRef.current?.focus(), 10)
                        }}
                      >
                        {isEditing ? (
                          <input
                            ref={cellInputRef}
                            value={editInput}
                            autoFocus
                            style={{
                              width: '100%',
                              height: '100%',
                              border: 'none',
                              outline: 'none',
                              background: '#fff',
                              fontSize: '12px',
                              fontFamily: 'inherit',
                            }}
                            onChange={(e) => setEditInput(e.target.value)}
                            onBlur={() => {
                              updateCellValue(key, editInput)
                              setEditingCell(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateCellValue(key, editInput)
                                setEditingCell(null)
                                setSelectedCell(`${colToLetter(c)}${r + 2}`)
                              } else if (e.key === 'Escape') {
                                setEditingCell(null)
                              }
                            }}
                          />
                        ) : (
                          formatDisplayValue(cell)
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Barra de Abas Inferior (Worksheets) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--sheets-statusbar-bg, #f3f4f6)',
          borderTop: '1px solid var(--border-strong)',
          padding: '2px 8px',
          gap: '4px',
        }}
      >
        {sheetTabs.map((sName) => (
          <button
            key={sName}
            style={{
              padding: '4px 12px',
              border: 'none',
              background:
                activeSheet === sName ? 'var(--surface, #fff)' : 'transparent',
              color:
                activeSheet === sName
                  ? 'var(--excel-green, #217346)'
                  : 'var(--text-secondary)',
              fontWeight: activeSheet === sName ? 600 : 'normal',
              borderTop:
                activeSheet === sName
                  ? '2px solid var(--excel-green, #217346)'
                  : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            onClick={() => setActiveSheet(sName)}
          >
            {sName}
          </button>
        ))}
        <button
          className="qa-btn"
          title="Nova Planilha"
          style={{ width: '24px', height: '24px', fontSize: '14px' }}
          onClick={() => {
            const nextName = `Planilha${sheetTabs.length + 1}`
            setSheetTabs([...sheetTabs, nextName])
            setActiveSheet(nextName)
          }}
        >
          ➕
        </button>
      </div>

      {/* Barra de Status com Estatísticas */}
      <div className="status-bar">
        <div className="status-left">
          <span>Pronto</span>
          <span>—</span>
          <span>Contagem: {statusStats.count}</span>
          {statusStats.sum > 0 && (
            <>
              <span>—</span>
              <span>Soma: {statusStats.sum}</span>
              <span>—</span>
              <span>Média: {statusStats.avg}</span>
            </>
          )}
        </div>
        <div className="status-right">
          <button
            className="zoom-btn"
            title="Diminuir Zoom"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
          >
            ➖
          </button>
          <span className="zoom-value">{zoom}%</span>
          <button
            className="zoom-btn"
            title="Aumentar Zoom"
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
          >
            ➕
          </button>
        </div>
      </div>
    </div>
  )
}
