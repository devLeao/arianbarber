import { Clock } from 'lucide-react'
import { TituloSecao } from '../ui/Ornamento'
import { useStore } from '../../store/Store'
import { precoLabel } from '../../lib/format'

export default function Servicos({ onEscolher }) {
  const { db } = useStore()
  const servicos = db.servicos.filter((s) => s.ativo).sort((a, b) => a.ordem - b.ordem)

  return (
    <section id="servicos" className="py-24 md:py-32 bg-ink-850 border-y border-ink-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <TituloSecao sobre="Tabela de preços" titulo="Nossos serviços">
          Escolha o serviço e agende direto pelo site. Dá pra combinar mais de um no mesmo horário.
        </TituloSecao>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {servicos.map((s) => (
            <article key={s.id} className="group bg-ink-900 border border-ink-600 hover:border-brass-500/60 transition-colors flex flex-col">
              <div className="h-52 overflow-hidden relative">
                <img src={s.img || '/img/corte.jpg'} alt={s.nome} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent" />
                <span className="absolute top-3 right-3 flex items-center gap-1 bg-ink-950/80 backdrop-blur px-2.5 py-1 text-xs text-cream-100 font-label tracking-wider">
                  <Clock size={12} className="text-brass-400" /> {s.duracao} MIN
                </span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-ink-500 pb-3 mb-3">
                  <h3 className="font-display text-2xl font-bold text-cream-50">{s.nome}</h3>
                  <span className="font-label text-lg text-brass-400 whitespace-nowrap">{precoLabel(s)}</span>
                </div>
                <p className="text-sm text-cream-500 flex-1">{s.desc}</p>
                <button onClick={() => onEscolher(s.id)} className="btn-ghost !py-2.5 mt-5 w-full group-hover:bg-brass-500 group-hover:text-ink-950 group-hover:border-brass-500">
                  Agendar
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
