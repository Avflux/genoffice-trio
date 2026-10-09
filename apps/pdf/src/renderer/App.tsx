import { useState, useRef, useEffect, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Configura o worker do pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

// PDF demonstrativo inicial codificado em base64 (2 páginas válidas)
const DEFAULT_DEMO_PDF_B64 =
  'JVBERi0xLjcKJYGBgYEKCjcgMCBvYmoKPDwKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL0xlbmd0aCAyODgKPj4Kc3RyZWFtCnicdVDRSgNBDHzfr9hnoTWbyya7IML1eocPvgj3A6JVlIpUxO930m3FYr1jN7lJLpmZXVjNgZZmkZYsuFKKH8/h8maz/dp8vjzcL1bv28eFUS1SyEqN6Jqfgt+3IUXCm2KmaIXi/BauxDTrKJP6U7XTzJRJRBTRkWzoML6O82uYL8I4h7uwayw4Hs8phWrCWjhriemf7dK2+wbrLGvSAVmPKDoZMyH+YtK+vMtEEzJnBsz/QkyHetXRHDXjNglYp5OufyaN2lvH4zk17mY7p2qYiArlWjQmPq+GDmqcoTkL59ilI+8OehgcJFsxcjfRs3bfrfGewKkxBYLqBF15jzUXeiCuYkCOqnuA7rTX53XRAg/Xyr4Zs4c/Gr8BMLx69AplbmRzdHJlYW0KZW5kb2JqCgo5IDAgb2JqCjw8Ci9GaWx0ZXIgL0ZsYXRlRGVjb2RlCi9MZW5ndGggMjM0Cj4+CnN0cmVhbQp4nG2Q0UpDMQyG7/sUuRY207RJVhhebDsHL7wR+gKiU5QNmYjP759uXgzkcNr8f9Lka09p0xMvcyFeFsViTl9v6fZ+f/jZf78/Py02n4eXRXPlak3YSZj6a5JK/SFlYnyZlMlX8I9prcXU3NUmq5aFlS2bW4OGgjcLV6xWULND7eRQd9Q/Ur9JU0+P6XRmEvr7r4FcXbQUWxkB+1+WemGxmGMKbEZUIwoOt2DELiOjtkVckNsNzgZVY8rFPZOHkvAQRz26hbIt9OzROVvk2+iacTvkxq7hjNOhGqbP8S4VzyDT1c1/AV1dVe8KZW5kc3RyZWFtCmVuZG9iagoKMTAgMCBvYmoKPDwKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL1R5cGUgL09ialN0bQovTiA3Ci9GaXJzdCAzOAovTGVuZ3RoIDQyOAo+PgpzdHJlYW0KeJzVU92L1DAQf89fMY/6cGQ2bb6OZWE/WgU5PO4ED8WHXhuWypJIm5Xzv3em3XM5RRTRBynTZGZ+M5lJ5rcABAUaoQBXQgm6cKDBKBKwaMGBLy0sl0K++fIpgLxu9mEU8lXfjfCeMAg3hOH/ByG36RgzKLFaiXPEtsnNIe3FHAoLBj8irofUHdswwLKu6hrRIqIpSQyi2tG6JfEkinTyKUd7EluehGy2QCzW5KtnMXaOYf+E1af4ilbCGsbsZmzpZv3buXxWNedQv6rHr4S8St2uyQGe7S4VKrNA9Ao1lvbdc7qOITQ5/b/NTfX3Kf60wyfvXKeYhbw93udJZeNCyE0zBvaAfBkOn0Pu2+Zikw6dkFVsU9fHPci3fVzHsX80/GHa387Ic8jTOASKn8dR3oQxHYeW5pNxU2bePK35wqJ3dKvWeWLKFHcGeFsq45Q2zJ/vfPy6DrV35uSjeuTd6/uPoZ3OYbV6yC9uM9/0bGDbVej6ZpMeiGlIn/aaSKqYaesYU2YGTqyLmVphzZ6Y+Jf69TRepaH3tj/2a7VVuijMP+/Jn3v6CsXTLokKZW5kc3RyZWFtCmVuZG9iagoKMTEgMCBvYmoKPDwKL1NpemUgMTIKL1Jvb3QgMiAwIFIKL0luZm8gMyAwIFIKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL1R5cGUgL1hSZWYKL0xlbmd0aCA0OQovVyBbIDEgMiAyIF0KL0luZGV4IFsgMCAxMiBdCj4+CnN0cmVhbQp4nCXKsRUAIAjE0IBoYeW67uQOjobcs/lNAmQ6E4QJF02E6Mb6dZht6jlFXHiPBgRnCmVuZHN0cmVhbQplbmRvYmoKCnN0YXJ0eHJlZgoxMjE1CiUlRU9G'

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

export function App() {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [fileName, setFileName] = useState('demonstracao.pdf')
  const [rawPdfBuffer, setRawPdfBuffer] = useState<ArrayBuffer | null>(null)
  const [loading, setLoading] = useState(false)
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const renderTaskRef = useRef<RenderTask | null>(null)

  // Carrega documento PDF na memória
  const loadPdfDocument = useCallback(
    async (buffer: ArrayBuffer, name = 'documento.pdf') => {
      setLoading(true)
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel()
          renderTaskRef.current = null
        }

        const doc = await pdfjsLib.getDocument({ data: buffer }).promise
        setPdfDoc(doc)
        setTotalPages(doc.numPages)
        setCurrentPage(1)
        setFileName(name)
        setRawPdfBuffer(buffer)

        // Gera miniaturas das páginas
        const thumbs: string[] = []
        for (let i = 1; i <= Math.min(doc.numPages, 10); i++) {
          const page = await doc.getPage(i)
          const viewport = page.getViewport({ scale: 0.25 })
          const thumbCanvas = document.createElement('canvas')
          thumbCanvas.width = viewport.width
          thumbCanvas.height = viewport.height
          const ctx = thumbCanvas.getContext('2d')
          if (ctx) {
            await page.render({
              canvas: thumbCanvas,
              canvasContext: ctx,
              viewport,
            }).promise
            thumbs.push(thumbCanvas.toDataURL())
          }
        }
        setPageThumbnails(thumbs)
      } catch (err) {
        console.error('Erro ao processar PDF:', err)
        alert('Erro ao carregar o arquivo PDF.')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Inicializa com o PDF de demonstração
  useEffect(() => {
    const defaultBuffer = base64ToArrayBuffer(DEFAULT_DEMO_PDF_B64)
    void loadPdfDocument(defaultBuffer, 'demonstracao.pdf')
  }, [loadPdfDocument])

  // Renderiza a página atual no Canvas do PDF.js
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return

    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }

      const page = await pdfDoc.getPage(currentPage)
      const scale = zoom / 100
      const viewport = page.getViewport({ scale, rotation })

      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      if (!context) return

      // Trata resolução para telas de alta densidade (Retina/DPI)
      const outputScale = window.devicePixelRatio || 1
      canvas.width = Math.floor(viewport.width * outputScale)
      canvas.height = Math.floor(viewport.height * outputScale)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`

      const transform =
        outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined

      const renderTask = page.render({
        canvas,
        canvasContext: context,
        viewport,
        transform,
      })
      renderTaskRef.current = renderTask
      await renderTask.promise
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'RenderingCancelledException') {
        console.error('Erro de renderização da página:', err)
      }
    }
  }, [pdfDoc, currentPage, zoom, rotation])

  useEffect(() => {
    void renderCurrentPage()
  }, [renderCurrentPage])

  // Abertura de arquivo PDF local
  const handleOpenLocalPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer
      if (buffer) {
        void loadPdfDocument(buffer, file.name)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // Baixar PDF atual
  const handleDownloadPdf = () => {
    if (!rawPdfBuffer) return
    const blob = new Blob([rawPdfBuffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="app"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={handleOpenLocalPdf}
      />

      {/* Ribbon / Toolbar Principal */}
      <div
        className="ribbon"
        style={{
          borderBottom: '1px solid var(--border-strong)',
          padding: '6px 12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '18px' }}>📑</span>
            <span
              style={{
                fontWeight: 600,
                fontSize: '13.5px',
                color: 'var(--text-primary)',
              }}
            >
              {fileName}
            </span>
          </div>

          <div
            style={{
              width: '1px',
              height: '22px',
              background: 'var(--border)',
            }}
          />

          <button
            className="rb-icon"
            title="Abrir Arquivo PDF"
            onClick={() => fileInputRef.current?.click()}
          >
            📂 Abrir
          </button>
          <button
            className="rb-icon"
            title="Baixar PDF"
            onClick={handleDownloadPdf}
          >
            💾 Baixar
          </button>
          <button
            className="rb-icon"
            title="Imprimir"
            onClick={() => window.print()}
          >
            🖨️ Imprimir
          </button>

          <div
            style={{
              width: '1px',
              height: '22px',
              background: 'var(--border)',
            }}
          />

          {/* Navegação de Páginas */}
          <button
            className="qa-btn"
            title="Primeira Página"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(1)}
          >
            ⏮
          </button>
          <button
            className="qa-btn"
            title="Página Anterior"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ◀
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="number"
              value={currentPage}
              min={1}
              max={totalPages || 1}
              style={{
                width: '42px',
                textAlign: 'center',
                padding: '2px 4px',
                border: '1px solid var(--border-subtle)',
                borderRadius: '3px',
                fontSize: '12px',
              }}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                if (val >= 1 && val <= totalPages) setCurrentPage(val)
              }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              / {totalPages || 1}
            </span>
          </div>

          <button
            className="qa-btn"
            title="Próxima Página"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            ▶
          </button>
          <button
            className="qa-btn"
            title="Última Página"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            ⏭
          </button>

          <div
            style={{
              width: '1px',
              height: '22px',
              background: 'var(--border)',
            }}
          />

          {/* Controles de Zoom e Rotação */}
          <button
            className="qa-btn"
            title="Diminuir Zoom"
            onClick={() => setZoom((z) => Math.max(30, z - 15))}
          >
            ➖
          </button>
          <span
            style={{ fontSize: '12px', minWidth: '45px', textAlign: 'center' }}
          >
            {zoom}%
          </span>
          <button
            className="qa-btn"
            title="Aumentar Zoom"
            onClick={() => setZoom((z) => Math.min(300, z + 15))}
          >
            ➕
          </button>

          <select
            className="select-like"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ fontSize: '12px', height: '26px' }}
            title="Predefinição de Zoom"
          >
            <option value={50}>50%</option>
            <option value={75}>75%</option>
            <option value={100}>100% (Original)</option>
            <option value={125}>125%</option>
            <option value={150}>150%</option>
            <option value={200}>200%</option>
          </select>

          <button
            className="rb-icon"
            title="Girar 90° no Sentido Horário"
            onClick={() => setRotation((r) => (r + 90) % 360)}
          >
            🔄 Girar
          </button>
        </div>
      </div>

      {/* Área Central: Thumbnails laterais + Canvas da Página */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          background: 'var(--bg-content, #e6e6e6)',
        }}
      >
        {/* Painel de Miniaturas */}
        <div
          style={{
            width: '170px',
            background: 'var(--surface, #fff)',
            borderRight: '1px solid var(--border-strong)',
            overflowY: 'auto',
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
            }}
          >
            Miniaturas ({totalPages})
          </div>
          {pageThumbnails.map((thumbUrl, idx) => {
            const pageNum = idx + 1
            const isSelected = pageNum === currentPage
            return (
              <div
                key={pageNum}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  border: isSelected
                    ? '2px solid var(--accent, #c43e1c)'
                    : '1px solid var(--border)',
                  backgroundColor: isSelected
                    ? 'var(--accent-soft, #fbeae5)'
                    : 'var(--surface)',
                }}
                onClick={() => setCurrentPage(pageNum)}
              >
                <img
                  src={thumbUrl}
                  alt={`Página ${pageNum}`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '2px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    marginTop: '4px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Página {pageNum}
                </span>
              </div>
            )
          })}
        </div>

        {/* Visualizador Principal do Canvas */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '24px',
          }}
        >
          {loading ? (
            <div
              style={{
                marginTop: '40px',
                fontSize: '14px',
                color: 'var(--text-secondary)',
              }}
            >
              Carregando documento PDF...
            </div>
          ) : (
            <div
              style={{
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                borderRadius: '4px',
                background: '#fff',
                overflow: 'hidden',
                lineHeight: 0,
              }}
            >
              <canvas ref={canvasRef} />
            </div>
          )}
        </div>
      </div>

      {/* Barra de Status */}
      <div
        className="status-bar"
        style={{
          padding: '0 12px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div className="status-left">
          <span>{fileName}</span>
          <span>—</span>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <span>—</span>
          <span>Zoom: {zoom}%</span>
          {rotation > 0 && <span>— Rotação: {rotation}°</span>}
        </div>
        <div style={{ flex: 1 }} />
        <div className="status-right">
          <button
            className="qa-btn"
            title="Ajustar ao Padrão (100%)"
            onClick={() => setZoom(100)}
          >
            📐 100%
          </button>
        </div>
      </div>
    </div>
  )
}
