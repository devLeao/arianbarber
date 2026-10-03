import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ aberto, onFechar, titulo, children, largura = 'max-w-md', rodape }) {
  useEffect(() => {
    if (!aberto) return
    const esc = (e) => e.key === 'Escape' && onFechar()
    document.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = ''
    }
  }, [aberto, onFechar])

  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm sm:p-4" onMouseDown={onFechar}>
      <div
        className={`w-full ${largura} bg-ink-800 border border-ink-600 sm:rounded-xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col animate-fade-up`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {titulo && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-600">
            <h3 className="font-semibold text-cream-50 text-lg">{titulo}</h3>
            <button onClick={onFechar} className="p-1.5 rounded-md text-cream-500 hover:text-cream-50 hover:bg-ink-600 cursor-pointer" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-5 overflow-y-auto scrollbar-thin">{children}</div>
        {rodape && <div className="px-5 py-4 border-t border-ink-600 flex gap-2 justify-end">{rodape}</div>}
      </div>
    </div>
  )
}
