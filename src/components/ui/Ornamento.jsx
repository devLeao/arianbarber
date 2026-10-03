// Divisor vintage com tesoura, no estilo das barbearias clássicas
export default function Ornamento({ className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-4 text-brass-500 ${className}`} aria-hidden="true">
      <span className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-brass-500/70" />
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
      </svg>
      <span className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-brass-500/70" />
    </div>
  )
}

export function TituloSecao({ sobre, titulo, children, claro = false }) {
  return (
    <div className="text-center mb-12 md:mb-16">
      <p className="font-label uppercase tracking-[0.35em] text-brass-400 text-xs mb-3">{sobre}</p>
      <h2 className={`font-display text-4xl md:text-5xl font-bold ${claro ? 'text-ink-900' : 'text-cream-50'}`}>{titulo}</h2>
      <Ornamento className="mt-5" />
      {children && <p className={`mt-5 max-w-xl mx-auto ${claro ? 'text-ink-600' : 'text-cream-300'}`}>{children}</p>}
    </div>
  )
}
