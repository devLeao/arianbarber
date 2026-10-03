import { useEffect, useMemo, useState } from 'react'
import { Check, CalendarX2, Lock, ShieldAlert, CalendarCheck2, Clock, QrCode } from 'lucide-react'
import { TituloSecao } from '../ui/Ornamento'
import { useStore, multasAbertasDe, descricaoMulta } from '../../store/Store'
import { brl, dataCurta, dataLonga, DIAS_CURTOS, fromISO, telefoneMask, precoLabel, toMin, fromMin } from '../../lib/format'
import { gerarSlots, diaAberto, intervalosOcupados, slotLivre, proximosDias } from '../../lib/schedule'

function Passo({ n, titulo, children, ativo = true }) {
  return (
    <div className={`transition-opacity ${ativo ? '' : 'opacity-35 pointer-events-none'}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="h-7 w-7 rounded-full bg-brass-500 text-ink-950 font-label text-sm flex items-center justify-center">{n}</span>
        <h3 className="font-label uppercase tracking-[0.2em] text-cream-50 text-sm">{titulo}</h3>
      </div>
      {children}
    </div>
  )
}

export default function Agendamento({ servicoInicial, onLogin, onPagarMulta }) {
  const { db, usuario, criarAgendamento, avisar } = useStore()
  const { config } = db
  const servicos = db.servicos.filter((s) => s.ativo).sort((a, b) => a.ordem - b.ordem)

  const [selecionados, setSelecionados] = useState([])
  const [data, setData] = useState(null)
  const [hora, setHora] = useState(null)
  const [telefone, setTelefone] = useState('')
  const [confirmado, setConfirmado] = useState(null)

  useEffect(() => {
    if (servicoInicial) {
      setSelecionados([servicoInicial.id])
      setHora(null)
      setConfirmado(null)
    }
  }, [servicoInicial])

  useEffect(() => {
    if (usuario?.telefone) setTelefone(usuario.telefone)
  }, [usuario?.id, usuario?.telefone])

  const itens = selecionados.map((id) => servicos.find((s) => s.id === id)).filter(Boolean)
  const duracao = itens.reduce((s, i) => s + i.duracao, 0)
  const total = itens.reduce((s, i) => s + (i.preco ?? 0), 0)
  const temACombinar = itens.some((i) => i.preco == null)

  const dias = useMemo(() => proximosDias(config, config.diasAgendaAberta), [config])
  const slots = useMemo(() => gerarSlots(config), [config])
  const ocupados = useMemo(() => (data ? intervalosOcupados(db.agendamentos, data) : []), [db.agendamentos, data])
  const diaBloqueado = (iso) => db.agendamentos.some((a) => a.data === iso && a.status === 'bloqueio' && a.diaInteiro)

  const toggle = (id) => {
    setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
    setHora(null)
  }

  const confirmar = () => {
    if (telefone.replace(/\D/g, '').length < 11) return avisar('Informe um WhatsApp válido.', 'erro')
    // revalida o horário (outro cliente pode ter pego enquanto escolhia)
    if (!slotLivre(config, hora, duracao, intervalosOcupados(db.agendamentos, data), data)) {
      setHora(null)
      return avisar('Ops! Esse horário acabou de ser ocupado.', 'erro')
    }
    const ag = {
      clienteId: usuario.id,
      clienteNome: usuario.nome,
      clienteTelefone: telefone,
      servicoIds: itens.map((i) => i.id),
      servicoNomes: itens.map((i) => i.nome).join(' + '),
      total,
      duracao,
      data,
      hora,
    }
    criarAgendamento(ag)
    setConfirmado(ag)
    setSelecionados([])
    setData(null)
    setHora(null)
  }

  // ---------- Estados especiais ----------
  let conteudo
  if (!usuario) {
    conteudo = (
      <div className="text-center py-16">
        <Lock className="mx-auto text-brass-500 mb-5" size={40} />
        <h3 className="font-display text-2xl text-cream-50 font-bold mb-2">Identifique-se para agendar</h3>
        <p className="text-cream-500 mb-8">É rapidinho: entre com sua conta Google.</p>
        <button onClick={onLogin} className="btn-brass">Entrar com Google</button>
      </div>
    )
  } else if (usuario.tipo === 'admin') {
    conteudo = (
      <div className="text-center py-16 text-cream-300">
        Você está logado como <strong className="text-cream-50">administrador</strong>. Para encaixar um cliente, use a Agenda no painel.
      </div>
    )
  } else if (multasAbertasDe(db, usuario.id).length > 0) {
    const multas = multasAbertasDe(db, usuario.id)
    const devido = multas.reduce((s, m) => s + m.valor, 0)
    conteudo = (
      <div className="max-w-lg mx-auto text-center py-10">
        <ShieldAlert className="mx-auto text-red-500 mb-5" size={48} />
        <h3 className="font-display text-3xl text-cream-50 font-bold mb-3">Agendamento bloqueado</h3>
        <p className="text-cream-300 mb-4">
          Olá, <strong className="text-cream-50">{usuario.nome.split(' ')[0]}</strong>. Existe{multas.length > 1 ? 'm' : ''} pendência{multas.length > 1 ? 's' : ''} no seu cadastro:
        </p>
        <ul className="text-left bg-ink-900 border border-ink-600 divide-y divide-ink-600 mb-6">
          {multas.map((m) => (
            <li key={m.id} className="flex justify-between gap-4 px-4 py-3 text-sm">
              <span className="text-cream-300">{descricaoMulta(m)}</span>
              <span className="text-cream-50 tabular-nums whitespace-nowrap">{brl(m.valor)}</span>
            </li>
          ))}
        </ul>
        <div className="bg-ink-900 border border-red-500/40 px-8 py-5 inline-block mb-8">
          <div className="font-label uppercase tracking-[0.25em] text-xs text-cream-500 mb-1">Total em aberto</div>
          <div className="font-display text-4xl font-extrabold text-red-400">{brl(devido)}</div>
        </div>
        <div>
          <button onClick={() => onPagarMulta(multas)} className="btn-brass"><QrCode size={18} /> Pagar com Pix</button>
          <p className="text-xs text-cream-500 mt-4">Assim que o pagamento for confirmado, seu acesso é liberado automaticamente.</p>
        </div>
      </div>
    )
  } else if (confirmado) {
    conteudo = (
      <div className="text-center py-14 max-w-md mx-auto animate-fade-up">
        <div className="h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto mb-5">
          <CalendarCheck2 className="text-emerald-400" size={30} />
        </div>
        <h3 className="font-display text-3xl text-cream-50 font-bold mb-2">Horário confirmado!</h3>
        <p className="text-cream-300 mb-6">Te esperamos no dia e horário abaixo.</p>
        <div className="bg-ink-900 border border-ink-600 p-5 text-left space-y-2 mb-6">
          <Linha k="Serviço" v={confirmado.servicoNomes} />
          <Linha k="Data" v={dataLonga(confirmado.data)} />
          <Linha k="Horário" v={`${confirmado.hora} às ${fromMin(toMin(confirmado.hora) + confirmado.duracao)}`} />
          <Linha k="Valor" v={brl(confirmado.total)} />
        </div>
        <p className="text-xs text-cream-500 mb-6">
          Cancelamentos até {config.antecedenciaCancelHoras}h antes, pelo botão "Meus horários". Faltas sem aviso geram multa de {config.multaPct}%.
        </p>
        <button onClick={() => setConfirmado(null)} className="btn-ghost">Agendar outro horário</button>
      </div>
    )
  } else {
    conteudo = (
      <div className="grid lg:grid-cols-[1fr_340px] gap-10">
        <div className="space-y-10 min-w-0">
          <Passo n={1} titulo="Escolha o(s) serviço(s)">
            <div className="flex flex-wrap gap-2">
              {servicos.map((s) => {
                const on = selecionados.includes(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 border text-sm transition-all cursor-pointer ${on ? 'bg-brass-500 border-brass-500 text-ink-950 font-semibold' : 'border-ink-500 text-cream-100 hover:border-brass-500'}`}
                  >
                    {on && <Check size={14} />}
                    {s.nome}
                    <span className={on ? 'text-ink-800' : 'text-cream-500'}>· {precoLabel(s)}</span>
                  </button>
                )
              })}
            </div>
          </Passo>

          <Passo n={2} titulo="Escolha o dia" ativo={itens.length > 0}>
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin -mx-1 px-1">
              {dias.map((iso) => {
                const lotado =
                  diaAberto(config, iso) &&
                  !slots.some((h) => slotLivre(config, h, duracao || config.slotMin, intervalosOcupados(db.agendamentos, iso), iso))
                const fechado = !diaAberto(config, iso) || diaBloqueado(iso) || lotado
                const d = fromISO(iso)
                const on = data === iso
                return (
                  <button
                    key={iso}
                    disabled={fechado}
                    title={lotado ? 'Sem horários livres' : undefined}
                    onClick={() => { setData(iso); setHora(null) }}
                    className={`shrink-0 w-16 py-3 border flex flex-col items-center gap-0.5 transition-all cursor-pointer disabled:cursor-not-allowed ${
                      on ? 'bg-brass-500 border-brass-500 text-ink-950' : fechado ? 'border-ink-700 text-cream-700 line-through' : 'border-ink-500 text-cream-100 hover:border-brass-500'
                    }`}
                  >
                    <span className="font-label text-[11px] uppercase tracking-wider">{DIAS_CURTOS[d.getDay()]}</span>
                    <span className="font-display text-2xl font-bold leading-none">{d.getDate()}</span>
                  </button>
                )
              })}
            </div>
          </Passo>

          <Passo n={3} titulo="Escolha o horário" ativo={!!data}>
            {data && (() => {
              const livres = slots.filter((h) => slotLivre(config, h, duracao, ocupados, data))
              if (!livres.length)
                return (
                  <div className="flex items-center gap-3 text-cream-500 py-4">
                    <CalendarX2 size={20} /> Sem horários livres para a duração escolhida ({duracao} min) neste dia.
                  </div>
                )
              return (
                <>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2">
                    {slots.map((h) => {
                      const livre = livres.includes(h)
                      const on = hora === h
                      // horários seguintes que ficam ocupados pela duração do atendimento
                      const coberto = hora && toMin(h) > toMin(hora) && toMin(h) < toMin(hora) + duracao
                      return (
                        <button
                          key={h}
                          disabled={!livre || coberto}
                          onClick={() => setHora(h)}
                          className={`py-2.5 border font-label text-sm tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed ${
                            on
                              ? 'bg-brass-500 border-brass-500 text-ink-950'
                              : coberto
                                ? 'bg-brass-500/30 border-brass-500 text-brass-200'
                                : livre
                                  ? 'border-ink-500 text-cream-100 hover:border-brass-500'
                                  : 'border-ink-700 text-cream-700/60 line-through'
                          }`}
                        >
                          {h}
                        </button>
                      )
                    })}
                  </div>
                  {hora && (
                    <p className="text-sm text-cream-300 mt-4 flex items-center gap-2">
                      <Clock size={14} className="text-brass-400" />
                      Seu atendimento: <strong className="text-cream-50">{hora} às {fromMin(toMin(hora) + duracao)}</strong> ({duracao} min)
                    </p>
                  )}
                </>
              )
            })()}
            {!data && <p className="text-cream-500 text-sm">Selecione um dia primeiro.</p>}
          </Passo>
        </div>

        {/* Resumo */}
        <aside className="lg:sticky lg:top-28 h-fit bg-ink-900 border border-ink-600 p-6">
          <h3 className="font-label uppercase tracking-[0.2em] text-brass-400 text-sm mb-5">Resumo</h3>
          {itens.length === 0 ? (
            <p className="text-cream-500 text-sm">Nenhum serviço selecionado.</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {itens.map((i) => (
                <li key={i.id} className="flex justify-between text-sm">
                  <span className="text-cream-100">{i.nome}</span>
                  <span className="text-cream-300">{precoLabel(i)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-dashed border-ink-500 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-cream-500"><span className="flex items-center gap-1.5"><Clock size={14} /> Duração</span><span>{duracao} min</span></div>
            <div className="flex justify-between text-cream-500"><span>Quando</span><span className="text-cream-100">{data ? `${dataCurta(data)}${hora ? ` · ${hora}–${fromMin(toMin(hora) + duracao)}` : ''}` : '—'}</span></div>
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-cream-300">Total</span>
              <span className="font-display text-3xl font-bold text-cream-50">{brl(total)}</span>
            </div>
            {temACombinar && <p className="text-xs text-cream-500 text-right">+ valor a combinar</p>}
          </div>
          <label className="label mt-6">WhatsApp <span className="text-red-400">*</span></label>
          <input className="input" type="tel" value={telefone} onChange={(e) => setTelefone(telefoneMask(e.target.value))} placeholder="(31) 99999-9999" />
          <button onClick={confirmar} disabled={!itens.length || !data || !hora} className="btn-brass w-full mt-4">Confirmar agendamento</button>
          <p className="text-[11px] text-cream-700 mt-3 leading-relaxed">
            Faltas sem aviso geram multa de {config.multaPct}% do valor, a ser paga antes do próximo agendamento.
          </p>
        </aside>
      </div>
    )
  }

  return (
    <section id="agendar" className="py-24 md:py-32 bg-ink-900 grain">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <TituloSecao sobre="Online, 24 horas" titulo="Agende seu horário" />
        {conteudo}
      </div>
    </section>
  )
}

const Linha = ({ k, v }) => (
  <div className="flex justify-between gap-4 text-sm">
    <span className="text-cream-500">{k}</span>
    <span className="text-cream-50 text-right">{v}</span>
  </div>
)
