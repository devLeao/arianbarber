import { ChevronDown } from 'lucide-react'
import Ornamento from '../ui/Ornamento'

export default function Hero() {
  return (
    <section id="inicio" className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      <img src="/img/corte.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-[30%_40%] scale-105 grayscale-[40%]" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/80 via-ink-950/70 to-ink-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />

      <div className="relative z-10 text-center px-4 max-w-3xl animate-fade-up">
        <p className="font-label uppercase tracking-[0.5em] text-brass-400 text-xs sm:text-sm mb-6">Barbearia · Desde 2024</p>
        <h1 className="font-display font-extrabold text-cream-50 leading-[0.95] text-5xl sm:text-7xl md:text-8xl">
          Tradição na <br />
          <span className="italic text-brass-400">navalha.</span>
        </h1>
        <Ornamento className="my-8" />
        <p className="text-cream-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Uma barbearia moderna com uma dose retrô. Corte na régua, barba com toalha quente e aquele atendimento que faz você voltar.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <a href="#agendar" className="btn-brass">Agendar horário</a>
          <a href="#servicos" className="btn-ghost">Ver serviços</a>
        </div>
      </div>

      <a href="#sobre" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream-500 hover:text-brass-400 animate-bounce" aria-label="Rolar">
        <ChevronDown size={28} />
      </a>
    </section>
  )
}
