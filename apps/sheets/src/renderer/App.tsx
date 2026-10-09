import { useState, useCallback } from 'react'

interface CellData {
  [key: string]: string
}

export function App() {
  const [cells, setCells] = useState<CellData>({})
  const [selectedCell, setSelectedCell] = useState<string>('A1')
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [sheetName] = useState('Plan1')

  const rowCount = 20
  const colCount = 8
  const letters = 'ABCDEFGH'.slice(0, colCount)

  const getCellKey = (col: number, row: number) => `${letters[col]}${row + 1}`
  const getCellValue = (col: number, row: number) =>
    cells[getCellKey(col, row)] || ''

  const handleCellClick = useCallback((col: number, row: number) => {
    const key = getCellKey(col, row)
    setSelectedCell(key)
    setEditingCell(null)
  }, [])

  const handleCellDoubleClick = useCallback((col: number, row: number) => {
    const key = getCellKey(col, row)
    setSelectedCell(key)
    setEditingCell(key)
  }, [])

  const handleCellChange = useCallback(
    (col: number, row: number, value: string) => {
      const key = getCellKey(col, row)
      setCells((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setEditingCell(null)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      setEditingCell(null)
    }
  }, [])

  // Renderizar linhas
  const renderRows = () => {
    const rows = []
    for (let r = 0; r < rowCount; r++) {
      const rowCells = []
      for (let c = 0; c < colCount; c++) {
        const key = getCellKey(c, r)
        const isSelected = key === selectedCell
        const isEditing = key === editingCell
        rowCells.push(
          <td
            key={key}
            className={`grid-cell ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
            style={{ gridColumn: c + 1, gridRow: r + 1 }}
            onClick={() => handleCellClick(c, r)}
            onDoubleClick={() => handleCellDoubleClick(c, r)}
          >
            {isEditing ? (
              <input
                autoFocus
                value={getCellValue(c, r)}
                onChange={(e) => handleCellChange(c, r, e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => setEditingCell(null)}
              />
            ) : (
              <span>{getCellValue(c, r)}</span>
            )}
          </td>
        )
      }
      rows.push(
        <tr key={`row-${r}`}>
          <td
            className="grid-header-cell"
            style={{ gridColumn: 1, gridRow: r + 2, textAlign: 'center' }}
          >
            {r + 1}
          </td>
          {rowCells}
        </tr>
      )
    }
    return rows
  }

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="excel-header">
        <input className="workbook-title-input" value={sheetName} readOnly />
        <div className="header-spacer" />
        <button className="qa-btn" title="Novo arquivo">
          📄
        </button>
        <button className="qa-btn" title="Abrir">
          📂
        </button>
        <button className="qa-btn" title="Salvar">
          💾
        </button>
      </div>

      {/* Ribbon */}
      <div className="ribbon">
        {['File', 'Home', 'Insert', 'Formulas', 'Data', 'Review', 'View'].map(
          (tab, i) => (
            <div key={tab} className="ribbon-group">
              <div className="ribbon-group-content">
                <button
                  className={`ribbon-tool large ${i === 1 ? 'is-current' : ''}`}
                  onClick={() => {}}
                >
                  <div className="tool-icon-row">
                    {i === 0
                      ? '📄'
                      : i === 1
                        ? '🏠'
                        : i === 2
                          ? '📊'
                          : i === 3
                            ? '∑'
                            : i === 4
                              ? '📈'
                              : i === 5
                                ? '👁️'
                                : '🔍'}
                  </div>
                  <strong>{tab}</strong>
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Spreadsheet */}
      <div className="sheet-body">
        <div className="spreadsheet-container">
          <table
            className="spreadsheet"
            style={{
              gridTemplateColumns: `32px repeat(${colCount}, 1fr)`,
              tableLayout: 'fixed',
            }}
          >
            <thead>
              <tr>
                <td />
                {letters.split('').map((letter, i) => (
                  <th
                    key={letter}
                    className="grid-header-cell"
                    style={{ gridColumn: i + 2 }}
                  >
                    {letter}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{renderRows()}</tbody>
          </table>
        </div>
      </div>

      {/* Status bar */}
      <div className="status-bar">
        <div className="status-left">
          <span className="status-msg">{sheetName}</span>
          <span>|</span>
          <span className="status-msg">{selectedCell}</span>
        </div>
        <div className="status-right">
          <button className="zoom-btn">🗙</button>
          <span className="zoom-value">100%</span>
          <button className="zoom-btn">➕</button>
        </div>
      </div>
    </div>
  )
}
