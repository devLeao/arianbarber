import { Coffee, Music2, Gamepad2, Wifi } from 'lucide-react'
import Ornamento from '../ui/Ornamento'

const MIMOS = [
  [Coffee, 'Café e cerveja gelada'],
  [Music2, 'Vinil rolando o dia todo'],
  [Gamepad2, 'Videogame na espera'],
  [Wifi, 'Wi-Fi liberado'],
]

export default function Sobre() {
  return (
    <section id="sobre" className="py-24 md:py-32 bg-ink-900 grain overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-14 md:gap-16 items-center">
        <div className="relative">
          <div className="absolute -inset-3 border border-brass-500/30 translate-x-4 translate-y-4" aria-hidden="true" />
          <img src="/img/barba.jpg" alt="Ambiente da barbearia" className="relative w-full aspect-[4/5] object-cover grayscale-[30%]" />
          <div className="absolute -bottom-6 -left-2 sm:-left-6 bg-brass-500 text-ink-950 px-6 py-4">
            <div className="font-display text-4xl font-extrabold leading-none">+2 mil</div>
            <div className="font-label uppercase tracking-widest text-xs mt-1">cortes realizados</div>
          </div>
        </div>
        <div>
          <p className="font-label uppercase tracking-[0.35em] text-brass-400 text-xs mb-3">A barbearia</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-cream-50">Mais que um corte</h2>
          <Ornamento className="mt-5 mb-8 !justify-start" />
          <div className="space-y-4 text-cream-300 leading-relaxed">
            <p>
              O <strong className="text-cream-50">Arian Barber</strong> nasceu da vontade de resgatar o clima das barbearias antigas: conversa boa,
              atendimento sem pressa e acabamento caprichado, com as técnicas e o estilo de hoje.
            </p>
            <p>Aqui você agenda online, chega no horário e é atendido na hora. Simples assim.</p>
          </div>
          <ul className="grid grid-cols-2 gap-4 mt-8">
            {MIMOS.map(([Icone, txt]) => (
              <li key={txt} className="flex items-center gap-3 text-sm text-cream-100">
                <span className="h-10 w-10 shrink-0 rounded-full border border-brass-500/40 flex items-center justify-center text-brass-400"><Icone size={18} /></span>
                {txt}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
