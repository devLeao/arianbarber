import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, CalendarDays, LayoutDashboard, LogOut, AlertCircle } from 'lucide-react'
import Logo from '../ui/Logo'
import { useStore, multasAbertasDe } from '../../store/Store'

const LINKS = [
  ['inicio', 'Início'],
  ['sobre', 'Sobre'],
  ['servicos', 'Serviços'],
  ['produtos', 'Produtos'],
  ['agendar', 'Agendar'],
  ['contato', 'Contato'],
]

export default function Navbar({ onLogin, onMinhaConta }) {
  const { usuario, sair, db } = useStore()
  const [aberto, setAberto] = useState(false)
  const [rolou, setRolou] = useState(false)
  const pendente = usuario?.tipo === 'cliente' && multasAbertasDe(db, usuario.id).length > 0

  useEffect(() => {
    const f = () => setRolou(window.scrollY > 40)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])

  const botaoConta = !usuario ? (
    <button onClick={onLogin} className="btn-brass !py-2 !px-5 !text-xs">Entrar</button>
  ) : usuario.tipo === 'admin' ? (
    <div className="flex items-center gap-2">
      <Link to="/admin" className="btn-brass !py-2 !px-4 !text-xs"><LayoutDashboard size={14} /> Painel</Link>
      <button onClick={sair} className="p-2 text-cream-500 hover:text-cream-50 cursor-pointer" title="Sair"><LogOut size={18} /></button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <button onClick={onMinhaConta} className="btn-ghost !py-2 !px-4 !text-xs relative">
        <CalendarDays size={14} /> Meus horários
        {pendente && <AlertCircle size={16} className="absolute -top-2 -right-2 text-red-500 fill-ink-900" />}
      </button>
      <button onClick={sair} className="p-2 text-cream-500 hover:text-cream-50 cursor-pointer" title="Sair"><LogOut size={18} /></button>
    </div>
  )

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${rolou || aberto ? 'bg-ink-950/95 backdrop-blur-md border-b border-brass-500/20 py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        <a href="#inicio" aria-label="Início"><Logo /></a>
        <nav className="hidden lg:flex items-center gap-8">
          {LINKS.map(([id, nome]) => (
            <a key={id} href={`#${id}`} className="font-label uppercase tracking-[0.2em] text-[13px] text-cream-100 hover:text-brass-400 transition-colors">{nome}</a>
          ))}
        </nav>
        <div className="hidden lg:block">{botaoConta}</div>
        <button className="lg:hidden p-2 text-cream-50 cursor-pointer" onClick={() => setAberto(!aberto)} aria-label="Menu">
          {aberto ? <X /> : <Menu />}
        </button>
      </div>
      {aberto && (
        <nav className="lg:hidden border-t border-ink-600 mt-3 px-6 py-6 flex flex-col gap-5 animate-fade-up">
          {LINKS.map(([id, nome]) => (
            <a key={id} href={`#${id}`} onClick={() => setAberto(false)} className="font-label uppercase tracking-[0.2em] text-cream-100 hover:text-brass-400">{nome}</a>
          ))}
          <div className="pt-2" onClick={() => setAberto(false)}>{botaoConta}</div>
        </nav>
      )}
    </header>
  )
}
