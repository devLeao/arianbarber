import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Lock, CalendarOff, CalendarCheck, ChevronDown, Search } from 'lucide-react'
import { useStore } from '../../store/Store'
import { Cabecalho, Botao, Vazio } from '../../components/admin/ui'
import { AgendamentoCard, useAcoesAgendamento } from '../../components/admin/AgendamentoCard'
import Modal from '../../components/ui/Modal'
import { brl, toISO, fromISO, addDays, DIAS_CURTOS, dataLonga, toMin, fromMin, telefoneMask, precoLabel } from '../../lib/format'
import { gerarSlots, diaAberto, intervalosOcupados, slotLivre } from '../../lib/schedule'

export default function Agenda() {
  const { db, desbloquearDia, bloquearDia, avisar } = useStore()
  const { config } = db
  const [data, setData] = useState(toISO(new Date()))
  const [onAcao, modais] = useAcoesAgendamento()
  const [encaixe, setEncaixe] = useState(null) // hora pré-selecionada ou ''
  const [bloqueio, setBloqueio] = useState(null)
  const [fecharDia, setFecharDia] = useState(false)
  const [verCancelados, setVerCancelados] = useState(false)

  const doDia = db.agendamentos.filter((a) => a.data === data)
  const ativos = doDia.filter((a) => a.status !== 'cancelado')
  const cancelados = doDia.filter((a) => a.status === 'cancelado')
  const diaFechado = doDia.some((a) => a.status === 'bloqueio' && a.diaInteiro)
  const aberto = diaAberto(config, data)
  const clientes = ativos.filter((a) => a.status !== 'bloqueio')
  const previsto = clientes.filter((a) => a.status !== 'falta').reduce((s, a) => s + a.total, 0)

  // Linha do tempo: agendamentos + horários livres
  const linhas = useMemo(() => {
    if (diaFechado) return ativos.map((a) => ({ tipo: 'ag', ag: a, hora: a.hora }))
    // Faltas não ocupam a agenda: a vaga fica livre para outro cliente
    const ocupados = intervalosOcupados(db.agendamentos, data)
    const faltas = ativos.filter((a) => a.status === 'falta').map((a) => [toMin(a.hora), toMin(a.hora) + a.duracao])
    const livres = aberto
      ? gerarSlots(config).filter((h) => slotLivre(config, h, config.slotMin, ocupados, '0000-00-00'))
      : []
    return [
      ...ativos.map((a) => ({ tipo: 'ag', ag: a, hora: a.hora })),
      ...livres.map((h) => ({ tipo: 'livre', hora: h, liberada: faltas.some(([i, f]) => toMin(h) >= i && toMin(h) < f) })),
    ].sort((a, b) => a.hora.localeCompare(b.hora) || (a.tipo === 'ag' ? -1 : 1))
  }, [db.agendamentos, data, config, aberto, diaFechado, ativos])

  // Semana (domingo a sábado) da data selecionada
  const d0 = fromISO(data)
  const semana = Array.from({ length: 7 }, (_, i) => toISO(addDays(d0, i - d0.getDay())))
  const hoje = toISO(new Date())

  return (
    <>
      <Cabecalho titulo="Agenda" sub={dataLonga(data)}>
        <Botao variante="pri" onClick={() => setEncaixe('')} disabled={diaFechado}><Plus size={16} /> Encaixar cliente</Botao>
        <Botao onClick={() => setBloqueio('')} disabled={diaFechado}><Lock size={15} /> Bloquear horário</Botao>
        {diaFechado ? (
          <Botao onClick={() => { desbloquearDia(data); avisar('Dia reaberto.') }}><CalendarCheck size={15} /> Reabrir dia</Botao>
        ) : (
          <Botao onClick={() => setFecharDia(true)}><CalendarOff size={15} /> Fechar dia</Botao>
        )}
      </Cabecalho>

      {/* Navegação por semana */}
      <div className="card p-2 sm:p-3 mb-5 flex items-center gap-1 sm:gap-2">
        <button onClick={() => setData(toISO(addDays(d0, -7)))} className="p-2 rounded-lg hover:bg-ink-700 text-cream-300 cursor-pointer" aria-label="Semana anterior"><ChevronLeft size={18} /></button>
        <div className="grid grid-cols-7 gap-1 flex-1">
          {semana.map((iso) => {
            const d = fromISO(iso)
            const n = db.agendamentos.filter((a) => a.data === iso && ['agendado', 'concluido'].includes(a.status)).length
            const sel = iso === data
            const fechado = !diaAberto(config, iso)
            return (
              <button
                key={iso}
                onClick={() => setData(iso)}
                className={`rounded-lg py-2 flex flex-col items-center cursor-pointer transition-colors ${sel ? 'bg-brass-500 text-ink-950' : 'hover:bg-ink-700'} ${fechado && !sel ? 'opacity-40' : ''}`}
              >
                <span className={`text-[10px] sm:text-xs ${sel ? '' : 'text-cream-500'}`}>{DIAS_CURTOS[d.getDay()]}</span>
                <span className={`text-base sm:text-lg font-semibold ${iso === hoje && !sel ? 'text-brass-400' : ''}`}>{d.getDate()}</span>
                <span className={`text-[10px] h-3 ${sel ? 'text-ink-800' : 'text-cream-500'}`}>{n ? `${n}` : ''}</span>
              </button>
            )
          })}
        </div>
        <button onClick={() => setData(toISO(addDays(d0, 7)))} className="p-2 rounded-lg hover:bg-ink-700 text-cream-300 cursor-pointer" aria-label="Próxima semana"><ChevronRight size={18} /></button>
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-ink-600">
          <Botao variante="fantasma" onClick={() => setData(hoje)}>Hoje</Botao>
          <input type="date" value={data} onChange={(e) => e.target.value && setData(e.target.value)} className="input !w-auto !py-1.5 text-sm [color-scheme:dark]" />
        </div>
      </div>

      {/* Resumo do dia */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm mb-4 px-1">
        <span className="text-cream-500">Clientes: <strong className="text-cream-50 font-semibold">{clientes.length}</strong></span>
        <span className="text-cream-500">Previsto: <strong className="text-cream-50 font-semibold">{brl(previsto)}</strong></span>
        <span className="text-cream-500">Horários livres: <strong className="text-cream-50 font-semibold">{linhas.filter((l) => l.tipo === 'livre').length}</strong></span>
      </div>

      {!aberto && !ativos.length && <div className="card"><Vazio icone={CalendarOff} texto={`${DIAS_CURTOS[d0.getDay()]} é dia de folga. Altere os dias de funcionamento em Configurações.`} /></div>}
      {diaFechado && (
        <div className="card p-4 mb-3 text-sm text-cream-300 flex items-center gap-3 border-l-4 border-l-ink-500">
          <CalendarOff size={18} className="text-cream-500" /> Este dia está fechado para agendamentos.
        </div>
      )}

      <div className="space-y-2">
        {linhas.map((l) =>
          l.tipo === 'ag' ? (
            <AgendamentoCard key={l.ag.id} ag={l.ag} onAcao={onAcao} />
          ) : (
            <div key={l.hora} className="group flex items-center gap-3 rounded-xl border border-dashed border-ink-600 px-3 sm:px-4 py-2.5 hover:border-ink-500">
              <span className="w-14 text-sm text-cream-500 tabular-nums">{l.hora}</span>
              <span className="flex-1 text-sm text-cream-700">
                Livre{l.liberada && <span className="text-orange-300/80"> · vaga liberada pela falta</span>}
              </span>
              <div className="flex gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <Botao variante="fantasma" className="!py-1 !px-2 !text-xs" onClick={() => setEncaixe(l.hora)}><Plus size={14} /> Encaixar</Botao>
                <Botao variante="fantasma" className="!py-1 !px-2 !text-xs" onClick={() => setBloqueio(l.hora)}><Lock size={13} /> Bloquear</Botao>
              </div>
            </div>
          )
        )}
      </div>

      {cancelados.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setVerCancelados(!verCancelados)} className="flex items-center gap-1 text-sm text-cream-500 hover:text-cream-100 mb-2 cursor-pointer">
            <ChevronDown size={16} className={verCancelados ? '' : '-rotate-90'} /> Cancelados ({cancelados.length})
          </button>
          {verCancelados && <div className="space-y-2">{cancelados.map((a) => <AgendamentoCard key={a.id} ag={a} onAcao={onAcao} />)}</div>}
        </div>
      )}

      {modais}
      {encaixe !== null && <ModalEncaixe data={data} horaInicial={encaixe} onFechar={() => setEncaixe(null)} />}
      {bloqueio !== null && <ModalBloqueio data={data} horaInicial={bloqueio} onFechar={() => setBloqueio(null)} />}
      <Modal aberto={fecharDia} onFechar={() => setFecharDia(false)} titulo="Fechar o dia?"
        rodape={<><Botao onClick={() => setFecharDia(false)}>Voltar</Botao><Botao variante="perigo" onClick={() => { bloquearDia(data, 'Dia fechado'); setFecharDia(false); avisar('Dia fechado para agendamentos.') }}>Fechar dia</Botao></>}>
        <p className="text-sm text-cream-300">Ninguém conseguirá agendar em {dataLonga(data)}.</p>
        {clientes.filter((a) => a.status === 'agendado').length > 0 && (
          <p className="text-sm text-orange-300 mt-3">Atenção: há {clientes.filter((a) => a.status === 'agendado').length} cliente(s) já agendado(s) neste dia. Eles continuam na agenda. Avise-os pelo WhatsApp.</p>
        )}
      </Modal>
    </>
  )
}

function ModalEncaixe({ data, horaInicial, onFechar }) {
  const { db, criarAgendamento, criarCliente, avisar } = useStore()
  const { config } = db
  const [busca, setBusca] = useState('')
  const [cliente, setCliente] = useState(null)
  const [novoTel, setNovoTel] = useState('')
  const [sel, setSel] = useState(['corte'])
  const [hora, setHora] = useState(horaInicial)

  const itens = sel.map((id) => db.servicos.find((s) => s.id === id)).filter(Boolean)
  const duracao = itens.reduce((s, i) => s + i.duracao, 0)
  const total = itens.reduce((s, i) => s + (i.preco ?? 0), 0)
  const ocupados = intervalosOcupados(db.agendamentos, data)
  const horas = gerarSlots(config).filter((h) => slotLivre(config, h, duracao || config.slotMin, ocupados, '0000-00-00'))
  const sugestoes = busca.length >= 2 ? db.clientes.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase())).slice(0, 5) : []

  const salvar = () => {
    let c = cliente
    if (!c) {
      if (!busca.trim()) return avisar('Informe o cliente.', 'erro')
      c = criarCliente({ nome: busca.trim(), telefone: novoTel })
    }
    criarAgendamento({
      clienteId: c.id,
      clienteNome: c.nome,
      clienteTelefone: c.telefone || novoTel,
      servicoIds: sel,
      servicoNomes: itens.map((i) => i.nome).join(' + '),
      total,
      duracao,
      data,
      hora,
      origem: 'admin',
    })
    avisar('Cliente encaixado na agenda.')
    onFechar()
  }

  return (
    <Modal aberto onFechar={onFechar} titulo="Encaixar cliente" largura="max-w-lg"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao variante="pri" disabled={!sel.length || !hora || !horas.includes(hora) || (!cliente && !busca.trim())} onClick={salvar}>Agendar</Botao></>}>
      <div className="space-y-5">
        <div className="relative">
          <label className="label">Cliente</label>
          {cliente ? (
            <div className="flex items-center justify-between input">
              <span>{cliente.nome} <span className="text-cream-500 text-sm">{cliente.telefone}</span></span>
              <button onClick={() => { setCliente(null); setBusca('') }} className="text-xs text-brass-400 cursor-pointer">trocar</button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-500" />
                <input className="input !pl-9" placeholder="Buscar ou digitar nome de cliente novo" value={busca} onChange={(e) => setBusca(e.target.value)} autoFocus />
              </div>
              {sugestoes.length > 0 && (
                <ul className="absolute z-10 left-0 right-0 mt-1 card shadow-xl overflow-hidden">
                  {sugestoes.map((c) => (
                    <li key={c.id}>
                      <button onClick={() => setCliente(c)} className="w-full text-left px-3 py-2 hover:bg-ink-700 text-sm cursor-pointer">
                        {c.nome} <span className="text-cream-500">{c.telefone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {busca.trim() && !sugestoes.some((c) => c.nome.toLowerCase() === busca.toLowerCase()) && (
                <div className="mt-3">
                  <label className="label">WhatsApp do cliente novo (opcional)</label>
                  <input className="input" value={novoTel} onChange={(e) => setNovoTel(telefoneMask(e.target.value))} placeholder="(31) 99999-9999" />
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label className="label">Serviços</label>
          <div className="flex flex-wrap gap-2">
            {db.servicos.filter((s) => s.ativo).map((s) => {
              const on = sel.includes(s.id)
              return (
                <button key={s.id} onClick={() => setSel(on ? sel.filter((x) => x !== s.id) : [...sel, s.id])}
                  className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer ${on ? 'bg-brass-500 text-ink-950 border-brass-500' : 'border-ink-500 text-cream-300 hover:border-cream-500'}`}>
                  {s.nome} <span className="opacity-70">· {precoLabel(s)}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Horário</label>
            <select className="input" value={hora} onChange={(e) => setHora(e.target.value)}>
              <option value="">Selecione</option>
              {horas.map((h) => <option key={h} value={h}>{h} – {fromMin(toMin(h) + duracao)}</option>)}
            </select>
            {hora && !horas.includes(hora) && <p className="text-xs text-red-400 mt-1">Não cabe {duracao} min nesse horário.</p>}
          </div>
          <div className="bg-ink-900 rounded-lg p-3 text-right">
            <div className="text-xs text-cream-500">{duracao} min</div>
            <div className="text-lg font-semibold text-cream-50">{brl(total)}</div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function ModalBloqueio({ data, horaInicial, onFechar }) {
  const { db, bloquearHorario, avisar } = useStore()
  const { config } = db
  const [hora, setHora] = useState(horaInicial)
  const [duracao, setDuracao] = useState(config.slotMin)
  const [motivo, setMotivo] = useState('')
  const ocupados = intervalosOcupados(db.agendamentos, data)
  const horas = gerarSlots(config).filter((h) => slotLivre(config, h, config.slotMin, ocupados, '0000-00-00'))
  const ateFim = hora ? toMin(config.fecha) - toMin(hora) : 0

  return (
    <Modal aberto onFechar={onFechar} titulo="Bloquear horário"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao variante="pri" disabled={!hora} onClick={() => { bloquearHorario(data, hora, Number(duracao), motivo); avisar('Horário bloqueado.'); onFechar() }}>Bloquear</Botao></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">A partir de</label>
            <select className="input" value={hora} onChange={(e) => setHora(e.target.value)}>
              <option value="">Selecione</option>
              {horas.map((h) => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Duração</label>
            <select className="input" value={duracao} onChange={(e) => setDuracao(e.target.value)}>
              {[1, 2, 3].map((n) => <option key={n} value={config.slotMin * n}>{config.slotMin * n} min</option>)}
              {ateFim > 0 && <option value={ateFim}>Até o fim do dia</option>}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Motivo (opcional, só você vê)</label>
          <input className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: médico, compromisso" />
        </div>
      </div>
    </Modal>
  )
}
