import { useEffect, useRef, useState } from 'react'
import { NavLink, Route, Routes, Link, Navigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, Users, Receipt, BarChart3, Package, Settings, Bell, ExternalLink, LogOut, MoreHorizontal, X, Crown,
  CheckCircle2, CalendarPlus, CalendarX, Info,
} from 'lucide-react'
import Logo from '../../components/ui/Logo'
import { useStore } from '../../store/Store'
import VisaoGeral from './VisaoGeral'
import Agenda from './Agenda'
import Clientes from './Clientes'
import Multas from './Multas'
import Relatorios from './Relatorios'
import Catalogo from './Catalogo'
import Configuracoes from './Configuracoes'

const MENU = [
  ['', 'Visão geral', LayoutDashboard],
  ['agenda', 'Agenda', CalendarDays],
  ['clientes', 'Clientes', Users],
  ['multas', 'Multas', Receipt],
  ['relatorios', 'Relatórios', BarChart3],
  ['catalogo', 'Serviços & produtos', Package],
  ['configuracoes', 'Configurações', Settings],
]
const MOBILE_PRINCIPAL = ['', 'agenda', 'clientes', 'relatorios']

export default function AdminApp() {
  const { usuario, entrarComoAdmin, db } = useStore()

  if (usuario?.tipo !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-ink-950">
        <div className="card p-8 max-w-sm w-full text-center">
          <Logo className="justify-center mb-6" />
          <h1 className="text-xl font-semibold text-cream-50 mb-1">Painel administrativo</h1>
          <p className="text-sm text-cream-500 mb-6">Acesso restrito ao barbeiro.</p>
          <button onClick={entrarComoAdmin} className="w-full flex items-center justify-center gap-3 bg-white text-ink-900 font-medium py-2.5 rounded-lg hover:bg-cream-100 cursor-pointer">
            <GoogleG /> Entrar com Google
          </button>
          <p className="text-xs text-cream-700 mt-4">Protótipo: entra direto como admin.</p>
          <Link to="/" className="text-xs text-brass-400 hover:underline mt-6 inline-block">← Voltar ao site</Link>
        </div>
      </div>
    )
  }

  const multasAbertas = db.multas.filter((m) => m.status === 'aberta').length

  return (
    <div className="min-h-screen bg-ink-900 text-cream-100 lg:pl-64">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-ink-950 border-r border-ink-700">
        <div className="h-16 flex items-center px-5 border-b border-ink-700"><Logo /></div>
        <nav className="flex-1 p-3 space-y-0.5">
          {MENU.map(([to, nome, Icone]) => (
            <ItemMenu key={to} to={to} nome={nome} Icone={Icone} badge={to === 'multas' ? multasAbertas : 0} />
          ))}
        </nav>
        <div className="p-3 border-t border-ink-700">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-cream-500 hover:text-cream-50 hover:bg-ink-800">
            <ExternalLink size={18} /> Ver site
          </Link>
        </div>
      </aside>

      <Topo />

      <main className="px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10 max-w-7xl">
        <Routes>
          <Route index element={<VisaoGeral />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="multas" element={<Multas />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="catalogo" element={<Catalogo />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>

      <NavMobile badgeMultas={multasAbertas} />
    </div>
  )
}

function ItemMenu({ to, nome, Icone, badge }) {
  return (
    <NavLink
      to={`/admin/${to}`}
      end={to === ''}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-ink-700 text-cream-50 font-medium' : 'text-cream-500 hover:text-cream-50 hover:bg-ink-800'}`
      }
    >
      {({ isActive }) => (
        <>
          <Icone size={18} className={isActive ? 'text-brass-400' : ''} />
          <span className="flex-1">{nome}</span>
          {badge > 0 && <span className="text-[11px] min-w-5 h-5 px-1.5 rounded-full bg-orange-500/15 text-orange-300 flex items-center justify-center">{badge}</span>}
        </>
      )}
    </NavLink>
  )
}

function Topo() {
  const { db, sair, lerNotificacoes } = useStore()
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)
  const naoLidas = db.notificacoes.filter((n) => !n.lida).length

  useEffect(() => {
    const f = (e) => ref.current && !ref.current.contains(e.target) && setAberto(false)
    document.addEventListener('mousedown', f)
    return () => document.removeEventListener('mousedown', f)
  }, [])

  const ICONE = { multa_paga: [CheckCircle2, 'text-emerald-400'], agendamento: [CalendarPlus, 'text-sky-400'], cancelamento: [CalendarX, 'text-orange-400'], info: [Info, 'text-brass-400'] }

  return (
    <header className="sticky top-0 z-30 h-16 bg-ink-900/90 backdrop-blur border-b border-ink-700 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="lg:hidden"><Logo compacto /></div>
      <div className="hidden lg:block text-sm text-cream-500">
        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="relative" ref={ref}>
          <button
            onClick={() => { setAberto(!aberto); if (!aberto && naoLidas) setTimeout(lerNotificacoes, 1500) }}
            className="relative p-2 rounded-lg text-cream-300 hover:bg-ink-700 hover:text-cream-50 cursor-pointer"
            aria-label="Notificações"
          >
            <Bell size={20} />
            {naoLidas > 0 && <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] font-semibold text-white flex items-center justify-center">{naoLidas}</span>}
          </button>
          {aberto && (
            <div className="absolute right-0 mt-2 w-[min(92vw,360px)] card shadow-2xl overflow-hidden animate-fade-up">
              <div className="px-4 py-3 border-b border-ink-600 flex justify-between items-center">
                <span className="font-medium text-cream-50 text-sm">Notificações</span>
                <button onClick={() => setAberto(false)} className="text-cream-500 hover:text-cream-50 cursor-pointer"><X size={16} /></button>
              </div>
              <ul className="max-h-96 overflow-y-auto scrollbar-thin divide-y divide-ink-600">
                {db.notificacoes.slice(0, 20).map((n) => {
                  const [Ic, cor] = ICONE[n.tipo] || ICONE.info
                  return (
                    <li key={n.id} className={`px-4 py-3 flex gap-3 ${n.lida ? '' : 'bg-brass-500/5'}`}>
                      <Ic size={18} className={`${cor} shrink-0 mt-0.5`} />
                      <div className="min-w-0">
                        <p className="text-sm text-cream-50">{n.titulo}</p>
                        <p className="text-xs text-cream-500 mt-0.5">{n.texto}</p>
                        <p className="text-[11px] text-cream-700 mt-1">{tempoAtras(n.criadoEm)}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-ink-600">
          <span className="h-8 w-8 rounded-full bg-brass-500 text-ink-950 flex items-center justify-center"><Crown size={15} /></span>
          <span className="text-sm text-cream-100">Arian</span>
        </div>
        <button onClick={sair} className="p-2 rounded-lg text-cream-500 hover:bg-ink-700 hover:text-cream-50 cursor-pointer" title="Sair"><LogOut size={18} /></button>
      </div>
    </header>
  )
}

function NavMobile({ badgeMultas }) {
  const [mais, setMais] = useState(false)
  const loc = useLocation()
  useEffect(() => setMais(false), [loc.pathname])
  const principais = MENU.filter(([to]) => MOBILE_PRINCIPAL.includes(to))
  const extras = MENU.filter(([to]) => !MOBILE_PRINCIPAL.includes(to))

  return (
    <>
      {mais && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMais(false)}>
          <div className="absolute bottom-16 inset-x-0 bg-ink-850 border-t border-ink-600 rounded-t-2xl p-3 pb-4 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            {extras.map(([to, nome, Icone]) => (
              <ItemMenu key={to} to={to} nome={nome} Icone={Icone} badge={to === 'multas' ? badgeMultas : 0} />
            ))}
            <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-cream-500"><ExternalLink size={18} /> Ver site</Link>
          </div>
        </div>
      )}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 h-16 bg-ink-950 border-t border-ink-700 grid grid-cols-5">
        {principais.map(([to, nome, Icone]) => (
          <NavLink
            key={to}
            to={`/admin/${to}`}
            end={to === ''}
            className={({ isActive }) => `flex flex-col items-center justify-center gap-1 text-[10px] ${isActive ? 'text-brass-400' : 'text-cream-500'}`}
          >
            <Icone size={20} />
            {nome.split(' ')[0]}
          </NavLink>
        ))}
        <button onClick={() => setMais(!mais)} className={`relative flex flex-col items-center justify-center gap-1 text-[10px] cursor-pointer ${mais ? 'text-brass-400' : 'text-cream-500'}`}>
          <MoreHorizontal size={20} />
          Mais
          {badgeMultas > 0 && <span className="absolute top-2 right-[30%] h-2 w-2 rounded-full bg-orange-400" />}
        </button>
      </nav>
    </>
  )
}

function tempoAtras(iso) {
  const min = Math.round((Date.now() - new Date(iso)) / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  if (min < 1440) return `há ${Math.round(min / 60)} h`
  return `há ${Math.round(min / 1440)} dias`
}

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
)
