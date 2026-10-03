import { useState } from 'react'
import Navbar from '../components/site/Navbar'
import Hero from '../components/site/Hero'
import Sobre from '../components/site/Sobre'
import Servicos from '../components/site/Servicos'
import Agendamento from '../components/site/Agendamento'
import Produtos from '../components/site/Produtos'
import Galeria from '../components/site/Galeria'
import { Contato, Rodape } from '../components/site/Contato'
import { LoginModal, MinhaContaModal, PagarMultaModal } from '../components/site/Modais'
import { WhatsApp } from '../components/ui/Icones'
import { useStore } from '../store/Store'

export default function Site() {
  const { db } = useStore()
  const [login, setLogin] = useState(false)
  const [conta, setConta] = useState(false)
  const [multa, setMulta] = useState(null)
  const [servicoInicial, setServicoInicial] = useState(null)

  const escolherServico = (id) => {
    setServicoInicial({ id, t: Date.now() })
    document.getElementById('agendar')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Navbar onLogin={() => setLogin(true)} onMinhaConta={() => setConta(true)} />
      <main>
        <Hero />
        <Sobre />
        <Servicos onEscolher={escolherServico} />
        <Agendamento servicoInicial={servicoInicial} onLogin={() => setLogin(true)} onPagarMulta={setMulta} />
        <Produtos />
        <Galeria />
        <Contato />
      </main>
      <Rodape />

      <a
        href={`https://wa.me/${db.config.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
        aria-label="Falar no WhatsApp"
      >
        <WhatsApp size={28} />
      </a>

      {/* Selo do protótipo: deixa claro para quem testa que os dados são fictícios */}
      <div className="fixed bottom-5 left-4 z-40 max-w-[60vw] text-[11px] leading-tight bg-ink-950/90 backdrop-blur border border-brass-500/40 text-cream-300 px-3 py-2 rounded-md shadow-xl">
        <span className="text-brass-400 font-semibold">Versão de teste</span> · dados e login fictícios
      </div>

      <LoginModal aberto={login} onFechar={() => setLogin(false)} />
      <MinhaContaModal aberto={conta} onFechar={() => setConta(false)} onPagarMulta={setMulta} />
      <PagarMultaModal pendencias={multa} onFechar={() => setMulta(null)} />
    </>
  )
}
