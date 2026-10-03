import { Link } from 'react-router-dom'
import { Wallet, CalendarCheck, Gauge, Receipt, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { useStore } from '../../store/Store'
import { Cabecalho, Kpi, Vazio } from '../../components/admin/ui'
import { AgendamentoCard, useAcoesAgendamento } from '../../components/admin/AgendamentoCard'
import { CardGrafico, GraficoColunas } from '../../components/admin/Graficos'
import { calcularStats, variacao } from '../../lib/stats'
import { brl, toISO, addDays, DIAS_CURTOS, fromISO, dataCurta, toMin } from '../../lib/format'
import { gerarSlots, diaAberto } from '../../lib/schedule'

export default function VisaoGeral() {
  const { db } = useStore()
  const [onAcao, modais] = useAcoesAgendamento()
  const hoje = toISO(new Date())
  const agora = new Date()

  const doDia = db.agendamentos
    .filter((a) => a.data === hoje && a.status !== 'cancelado')
    .sort((a, b) => a.hora.localeCompare(b.hora))
  const clientesHoje = doDia.filter((a) => a.status !== 'bloqueio')
  const pendentes = clientesHoje.filter((a) => a.status === 'agendado')
  const previstoHoje = clientesHoje.filter((a) => a.status !== 'falta').reduce((s, a) => s + a.total, 0)
  const recebidoHoje = clientesHoje.filter((a) => a.status === 'concluido').reduce((s, a) => s + a.total, 0)

  // Ocupação: minutos ocupados / minutos de expediente
  const abertoHoje = diaAberto(db.config, hoje)
  const minExpediente = toMin(db.config.fecha) - toMin(db.config.abre) - (toMin(db.config.almocoFim) - toMin(db.config.almocoInicio))
  const minOcupados = doDia.filter((a) => !a.diaInteiro).reduce((s, a) => s + a.duracao, 0)
  const ocupacao = abertoHoje ? Math.min(1, minOcupados / minExpediente) : 0

  // Mês atual vs mês anterior até o mesmo dia
  const iniMes = toISO(new Date(agora.getFullYear(), agora.getMonth(), 1))
  const iniMesAnt = toISO(new Date(agora.getFullYear(), agora.getMonth() - 1, 1))
  const fimMesAnt = toISO(new Date(agora.getFullYear(), agora.getMonth() - 1, Math.min(agora.getDate(), new Date(agora.getFullYear(), agora.getMonth(), 0).getDate())))
  const mes = calcularStats(db, iniMes, hoje)
  const mesAnt = calcularStats(db, iniMesAnt, fimMesAnt)
  const varFat = variacao(mes.faturamento, mesAnt.faturamento)

  const ultimos7 = calcularStats(db, toISO(addDays(agora, -6)), hoje).porDia

  const multasAbertas = db.multas.filter((m) => m.status === 'aberta')
  const saudacao = agora.getHours() < 12 ? 'Bom dia' : agora.getHours() < 18 ? 'Boa tarde' : 'Boa noite'
  const proximo = pendentes.find((a) => toMin(a.hora) + a.duracao > agora.getHours() * 60 + agora.getMinutes())

  return (
    <>
      <Cabecalho titulo={`${saudacao}, Arian`} sub={abertoHoje ? `${clientesHoje.length} clientes hoje · ${pendentes.length} ainda por atender` : 'Hoje a barbearia está fechada.'}>
        <Link to="/admin/agenda" className="inline-flex items-center gap-2 text-sm px-3.5 py-2 rounded-lg bg-brass-500 text-ink-950 font-semibold hover:bg-brass-400">
          Abrir agenda <ArrowRight size={16} />
        </Link>
      </Cabecalho>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Kpi icone={Wallet} rotulo="Faturamento hoje" valor={brl(recebidoHoje)} detalhe={`${brl(previstoHoje)} previsto`} />
        <Kpi icone={CalendarCheck} rotulo="Atendimentos hoje" valor={`${clientesHoje.filter((a) => a.status === 'concluido').length} / ${clientesHoje.length}`} detalhe="concluídos / marcados" />
        <Kpi icone={Gauge} rotulo="Ocupação da agenda" valor={`${Math.round(ocupacao * 100)}%`} detalhe={abertoHoje ? `${gerarSlots(db.config).length} horários no dia` : 'fechado hoje'} />
        <Kpi icone={Receipt} rotulo="Multas em aberto" valor={brl(multasAbertas.reduce((s, m) => s + m.valor, 0))} detalhe={`${multasAbertas.length} cliente(s) bloqueado(s)`} tom={multasAbertas.length ? 'alerta' : 'bom'} />
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <section className="min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-cream-50">Agenda de hoje</h2>
            {proximo && <span className="text-xs text-cream-500">Próximo: <span className="text-brass-300">{proximo.hora} · {proximo.clienteNome}</span></span>}
          </div>
          <div className="space-y-2">
            {doDia.length === 0 ? (
              <div className="card"><Vazio texto={abertoHoje ? 'Nenhum agendamento para hoje.' : 'Fechado hoje. Bom descanso!'} /></div>
            ) : (
              doDia.map((a) => <AgendamentoCard key={a.id} ag={a} onAcao={onAcao} compacto />)
            )}
          </div>
        </section>

        <div className="space-y-6 min-w-0">
          <section className="card p-5">
            <div className="text-sm text-cream-500">Faturamento do mês</div>
            <div className="text-3xl font-semibold text-cream-50 tracking-tight mt-1 tabular-nums">{brl(mes.faturamento)}</div>
            {varFat != null && (
              <div className={`inline-flex items-center gap-1 text-xs mt-2 ${varFat >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {varFat >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {varFat >= 0 ? '+' : ''}{Math.round(varFat * 100)}% vs. mesmo período do mês passado
              </div>
            )}
            <dl className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-ink-600 text-center">
              <div><dt className="text-[11px] text-cream-500">Atendimentos</dt><dd className="text-cream-50 font-semibold tabular-nums">{mes.concluidos.length}</dd></div>
              <div><dt className="text-[11px] text-cream-500">Ticket médio</dt><dd className="text-cream-50 font-semibold tabular-nums">{brl(mes.ticket)}</dd></div>
              <div><dt className="text-[11px] text-cream-500">Faltas</dt><dd className="text-cream-50 font-semibold tabular-nums">{mes.faltas.length}</dd></div>
            </dl>
            <Link to="/admin/relatorios" className="text-xs text-brass-400 hover:underline inline-flex items-center gap-1 mt-4">Ver relatório completo <ArrowRight size={12} /></Link>
          </section>

          <CardGrafico
            titulo="Faturamento · últimos 7 dias"
            tabela={{ colunas: ['Dia', 'Faturamento', 'Atendimentos'], linhas: ultimos7.map((d) => [dataCurta(d.data), brl(d.faturamento), d.atendimentos]) }}
          >
            <GraficoColunas
              dados={ultimos7}
              x="data"
              y="faturamento"
              altura={180}
              formatarY={(v) => brl(v)}
              formatarTick={(v) => `R$${v}`}
              tickX={(iso) => DIAS_CURTOS[fromISO(iso).getDay()]}
              rotuloTooltip={(iso, p) => `${dataCurta(iso)} · ${p.atendimentos} atendimento(s)`}
            />
          </CardGrafico>

          {multasAbertas.length > 0 && (
            <section className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-cream-50">Multas pendentes</h3>
                <Link to="/admin/multas" className="text-xs text-brass-400 hover:underline">Ver todas</Link>
              </div>
              <ul className="divide-y divide-ink-600">
                {multasAbertas.slice(0, 4).map((m) => (
                  <li key={m.id} className="py-2 flex justify-between text-sm">
                    <span className="text-cream-100">{m.clienteNome}</span>
                    <span className="text-orange-300 tabular-nums">{brl(m.valor)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
      {modais}
    </>
  )
}
