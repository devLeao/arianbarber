import { useMemo, useState } from 'react'
import { Search, ArrowUpDown, AlertTriangle } from 'lucide-react'
import { useStore, descricaoMulta } from '../../store/Store'
import ModalDebito from '../../components/admin/ModalDebito'
import { Cabecalho, Avatar, Status, Abas, Vazio, Botao } from '../../components/admin/ui'
import { WhatsApp } from '../../components/ui/Icones'
import Modal from '../../components/ui/Modal'
import { resumoClientes } from '../../lib/stats'
import { brl, dataBR, dataCurta, fromISO } from '../../lib/format'

const ORDENS = [
  ['gasto', 'Mais gastam'],
  ['visitas', 'Mais visitas'],
  ['ultima', 'Visita recente'],
  ['faltas', 'Mais faltas'],
  ['nome', 'Nome'],
]

export default function Clientes() {
  const { db } = useStore()
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState('gasto')
  const [filtro, setFiltro] = useState('todos')
  const [aberto, setAberto] = useState(null)

  const todos = useMemo(() => resumoClientes(db), [db])
  const hoje = new Date()
  const sumidos = (c) => c.ultima && (hoje - fromISO(c.ultima)) / 86400000 > 30 && !c.proximo

  const lista = todos
    .filter((c) => !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) || (c.telefone || '').includes(busca))
    .filter((c) => filtro === 'todos' || (filtro === 'devendo' && c.devendo > 0) || (filtro === 'sumidos' && sumidos(c)))
    .sort((a, b) => (ordem === 'nome' ? a.nome.localeCompare(b.nome) : ordem === 'ultima' ? (b.ultima || '').localeCompare(a.ultima || '') : b[ordem] - a[ordem]))

  return (
    <>
      <Cabecalho titulo="Clientes" sub={`${todos.length} clientes cadastrados`} />

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-500" />
          <input className="input !pl-9" placeholder="Buscar por nome ou telefone" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Abas
          valor={filtro}
          onChange={setFiltro}
          abas={[
            ['todos', 'Todos', todos.length],
            ['devendo', 'Devendo', todos.filter((c) => c.devendo > 0).length],
            ['sumidos', 'Sumidos +30d', todos.filter(sumidos).length],
          ]}
        />
        <label className="relative">
          <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-500 pointer-events-none" />
          <select className="input !pl-8 md:!w-44" value={ordem} onChange={(e) => setOrdem(e.target.value)}>
            {ORDENS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
          </select>
        </label>
      </div>

      <div className="card overflow-hidden">
        {lista.length === 0 ? (
          <Vazio texto="Nenhum cliente encontrado." />
        ) : (
          <>
            {/* Tabela desktop */}
            <table className="w-full text-sm hidden md:table">
              <thead className="text-xs text-cream-500 border-b border-ink-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Cliente</th>
                  <th className="text-right font-medium px-4 py-3">Visitas</th>
                  <th className="text-right font-medium px-4 py-3">Total gasto</th>
                  <th className="text-right font-medium px-4 py-3">Faltas</th>
                  <th className="text-left font-medium px-4 py-3">Última visita</th>
                  <th className="text-left font-medium px-4 py-3">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-600">
                {lista.map((c) => (
                  <tr key={c.id} onClick={() => setAberto(c)} className="hover:bg-ink-700/50 cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar nome={c.nome} />
                        <div>
                          <div className="text-cream-50">{c.nome}</div>
                          <div className="text-xs text-cream-500">{c.telefone || c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.visitas}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-cream-50">{brl(c.gasto)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${c.faltas ? 'text-orange-300' : 'text-cream-500'}`}>{c.faltas}</td>
                    <td className="px-4 py-3 text-cream-300">{c.ultima ? dataBR(c.ultima) : '—'}</td>
                    <td className="px-4 py-3"><Situacao c={c} sumido={sumidos(c)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Cards mobile */}
            <ul className="md:hidden divide-y divide-ink-600">
              {lista.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setAberto(c)} className="w-full flex items-center gap-3 p-4 text-left cursor-pointer">
                    <Avatar nome={c.nome} />
                    <div className="flex-1 min-w-0">
                      <div className="text-cream-50 truncate">{c.nome}</div>
                      <div className="text-xs text-cream-500">{c.visitas} visitas · {brl(c.gasto)}{c.faltas ? ` · ${c.faltas} falta(s)` : ''}</div>
                    </div>
                    <Situacao c={c} sumido={sumidos(c)} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {aberto && <FichaCliente cliente={todos.find((c) => c.id === aberto.id)} onFechar={() => setAberto(null)} />}
    </>
  )
}

function Situacao({ c, sumido }) {
  if (c.devendo > 0) return <span className="text-[11px] px-2 py-0.5 rounded-full border text-orange-300 bg-orange-500/10 border-orange-500/30 whitespace-nowrap">Deve {brl(c.devendo)}</span>
  if (c.proximo) return <span className="text-[11px] px-2 py-0.5 rounded-full border text-sky-300 bg-sky-500/10 border-sky-500/30 whitespace-nowrap">Agendado</span>
  if (sumido) return <span className="text-[11px] px-2 py-0.5 rounded-full border text-cream-300 bg-ink-700 border-ink-500 whitespace-nowrap">Sumido</span>
  return <span className="text-[11px] text-cream-700">—</span>
}

function FichaCliente({ cliente: c, onFechar }) {
  const { db } = useStore()
  const [aba, setAba] = useState('historico')
  const [debito, setDebito] = useState(false)
  const ags = db.agendamentos.filter((a) => a.clienteId === c.id).sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora))
  const multas = db.multas.filter((m) => m.clienteId === c.id)
  const tel = (c.telefone || '').replace(/\D/g, '')

  // Serviço favorito
  const cont = {}
  ags.filter((a) => a.status === 'concluido').forEach((a) => (cont[a.servicoNomes] = (cont[a.servicoNomes] || 0) + 1))
  const favorito = Object.entries(cont).sort((a, b) => b[1] - a[1])[0]?.[0]

  return (
    <Modal aberto onFechar={onFechar} titulo="Ficha do cliente" largura="max-w-xl">
      <div className="flex items-center gap-4 mb-5">
        <Avatar nome={c.nome} className="!h-14 !w-14 !text-base" />
        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold text-cream-50">{c.nome}</div>
          <div className="text-sm text-cream-500 truncate">{c.telefone || 'sem telefone'} · {c.email || 'sem e-mail'}</div>
          <div className="text-xs text-cream-700 mt-0.5">Cliente desde {dataBR(c.criadoEm)}</div>
        </div>
        {tel && (
          <a href={`https://wa.me/55${tel}`} target="_blank" rel="noreferrer" className="p-2.5 rounded-lg bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25" title="WhatsApp">
            <WhatsApp size={20} />
          </a>
        )}
      </div>

      {c.devendo > 0 && (
        <div className="flex items-center gap-2 text-sm text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2 mb-5">
          <AlertTriangle size={16} /> Bloqueado para agendar: {brl(c.devendo)} em aberto (multas/débitos).
        </div>
      )}

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {[
          ['Visitas', c.visitas],
          ['Total gasto', brl(c.gasto)],
          ['Ticket médio', brl(c.visitas ? c.gasto / c.visitas : 0)],
          ['Faltas', c.faltas],
        ].map(([k, v]) => (
          <div key={k} className="bg-ink-900 rounded-lg p-3">
            <dt className="text-[11px] text-cream-500">{k}</dt>
            <dd className="text-cream-50 font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {favorito && <p className="text-sm text-cream-500 mb-5">Serviço favorito: <span className="text-cream-100">{favorito}</span></p>}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Abas valor={aba} onChange={setAba} abas={[['historico', 'Histórico', ags.length], ['multas', 'Multas e débitos', multas.length]]} />
        <Botao className="!py-1.5" onClick={() => setDebito(true)}>+ Lançar débito</Botao>
      </div>
      <div className="mt-3">
        {aba === 'historico' ? (
          ags.length === 0 ? <Vazio texto="Sem atendimentos." /> : (
            <ul className="divide-y divide-ink-600">
              {ags.map((a) => (
                <li key={a.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="text-cream-100 truncate">{a.servicoNomes}</div>
                    <div className="text-xs text-cream-500">{dataCurta(a.data)} · {a.hora} · {brl(a.total)}</div>
                  </div>
                  <Status s={a.status} />
                </li>
              ))}
            </ul>
          )
        ) : multas.length === 0 ? <Vazio texto="Nenhuma multa." /> : (
          <ul className="divide-y divide-ink-600">
            {multas.map((m) => (
              <li key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <div>
                  <div className="text-cream-100">{brl(m.valor)}</div>
                  <div className="text-xs text-cream-500">{descricaoMulta(m)}{m.pagaEm ? ` · resolvida em ${dataCurta(m.pagaEm)}` : ''}</div>
                </div>
                <Status s={m.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {debito && <ModalDebito cliente={c} onFechar={() => setDebito(false)} />}
    </Modal>
  )
}
