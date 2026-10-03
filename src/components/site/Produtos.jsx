import { Droplet, Droplets, Sparkles, Circle, Leaf, FlaskConical, SprayCan, Brush, Package } from 'lucide-react'
import { TituloSecao } from '../ui/Ornamento'
import { WhatsApp } from '../ui/Icones'
import { useStore } from '../../store/Store'
import { brl } from '../../lib/format'

export const ICONES_PRODUTO = {
  droplet: Droplet,
  droplets: Droplets,
  sparkles: Sparkles,
  circle: Circle,
  leaf: Leaf,
  flask: FlaskConical,
  spray: SprayCan,
  comb: Brush,
  package: Package,
}

export default function Produtos() {
  const { db } = useStore()
  const produtos = db.produtos.filter((p) => p.ativo).sort((a, b) => a.ordem - b.ordem)

  return (
    <section id="produtos" className="py-24 md:py-32 bg-cream-100 text-ink-900 relative grain">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <TituloSecao claro sobre="Leve pra casa" titulo="Produtos">
          Os mesmos produtos que usamos na cadeira. Separe o seu pelo WhatsApp e retire no seu próximo horário.
        </TituloSecao>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {produtos.map((p) => {
            const Icone = ICONES_PRODUTO[p.icone] || Package
            const esgotado = p.estoque === 0
            const msg = encodeURIComponent(`Olá! Tenho interesse no produto: ${p.nome} (${brl(p.preco)}).`)
            return (
              <article key={p.id} className="bg-cream-50 border border-ink-900/10 shadow-[0_1px_0_rgba(0,0,0,0.04)] flex flex-col group">
                <div className="aspect-[4/3] bg-gradient-to-br from-ink-800 to-ink-950 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-4 border border-brass-500/20" aria-hidden="true" />
                  <Icone size={56} strokeWidth={1.1} className="text-brass-400 group-hover:scale-110 transition-transform duration-500" />
                  <span className="absolute top-3 left-3 font-label uppercase tracking-[0.2em] text-[10px] text-cream-300 bg-ink-950/70 px-2 py-1">{p.categoria}</span>
                  {esgotado && <span className="absolute top-3 right-3 font-label uppercase tracking-widest text-[10px] bg-wine-600 text-cream-50 px-2 py-1">Esgotado</span>}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-display text-xl font-bold">{p.nome}</h3>
                  <p className="text-sm text-ink-500 mt-1.5 flex-1">{p.desc}</p>
                  <div className="flex items-center justify-between mt-5">
                    <span className="font-display text-2xl font-bold">{brl(p.preco)}</span>
                    <a
                      href={esgotado ? undefined : `https://wa.me/${db.config.whatsapp}?text=${msg}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-disabled={esgotado}
                      className={`flex items-center gap-2 font-label uppercase tracking-widest text-xs px-3 py-2 transition-colors ${esgotado ? 'bg-ink-900/10 text-ink-500 cursor-not-allowed' : 'bg-ink-900 text-cream-50 hover:bg-brass-600'}`}
                    >
                      <WhatsApp size={14} /> {esgotado ? 'Avise-me' : 'Quero'}
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
