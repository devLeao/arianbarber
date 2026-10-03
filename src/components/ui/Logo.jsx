// Logo provisório (fictício) até recebermos o logo real do cliente.
export default function Logo({ className = '', compacto = false }) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <svg viewBox="0 0 48 48" className="h-10 w-10 shrink-0" aria-hidden="true">
        <circle cx="24" cy="24" r="22.5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brass-500" />
        <circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" strokeWidth="0.75" className="text-brass-500/60" />
        <text x="24" y="31" textAnchor="middle" fontFamily="Playfair Display, serif" fontWeight="800" fontSize="20" className="fill-cream-50">A</text>
        <path d="M10 24h4M34 24h4" stroke="currentColor" strokeWidth="1.5" className="text-brass-500" />
      </svg>
      {!compacto && (
        <div className="leading-none">
          <div className="font-display font-extrabold text-xl tracking-wide text-cream-50">Arian</div>
          <div className="font-label text-[10px] tracking-[0.35em] text-brass-400 mt-1">BARBER · EST. 2024</div>
        </div>
      )}
    </div>
  )
}
