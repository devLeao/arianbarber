import { useMemo, useState } from 'react'
import { Wallet, Scissors, Ticket, Users, UserX, Ban, HandCoins, TrendingDown, Download } from 'lucide-react'
import { useStore } from '../../store/Store'
import { Cabecalho, Kpi, Delta, Abas, Botao, Vazio } from '../../components/admin/ui'
import { CardGrafico, GraficoColunas, BarrasRanking, MapaCalor } from '../../components/admin/Graficos'
import { calcularStats, variacao } from '../../lib/stats'
import { brl, toISO, fromISO, addDays, DIAS_CURTOS, dataCurta, dataBR, toMin } from '../../lib/format'

const PRESETS = [
  ['7d', '7 dias'],
  ['30d', '30 dias'],
  ['mes', 'Este mês'],
  ['mesAnt', 'Mês passado'],
  ['90d', '90 dias'],
  ['custom', 'Personalizado'],
]

function intervalo(preset, custom) {
  const h = new Date()
  const hoje = toISO(h)
  switch (preset) {
    case '7d': return [toISO(addDays(h, -6)), hoje]
    case '30d': return [toISO(addDays(h, -29)), hoje]
    case 'mes': return [toISO(new Date(h.getFullYear(), h.getMonth(), 1)), hoje]
    case 'mesAnt': return [toISO(new Date(h.getFullYear(), h.getMonth() - 1, 1)), toISO(new Date(h.getFullYear(), h.getMonth(), 0))]
    case '90d': return [toISO(addDays(h, -89)), hoje]
    default: return custom
  }
}

const pct = (v) => `${(v * 100).toFixed(1).replace('.', ',')}%`

export default function Relatorios() {
  const { db } = useStore()
  const [preset, setPreset] = useState('30d')
  const [custom, setCustom] = useState([toISO(addDays(new Date(), -13)), toISO(new Date())])
  const [ini, fim] = intervalo(preset, custom)

  // Período anterior de mesmo tamanho, para comparação
  const dias = Math.round((fromISO(fim) - fromISO(ini)) / 86400000) + 1
  const antFim = toISO(addDays(fromISO(ini), -1))
  const antIni = toISO(addDays(fromISO(ini), -dias))

  const s = useMemo(() => calcularStats(db, ini, fim), [db, ini, fim])
  const a = useMemo(() => calcularStats(db, antIni, antFim), [db, antIni, antFim])

  // Para períodos longos, agrupa o faturamento por semana
  const porSemana = dias > 45
  const serie = porSemana
    ? Object.values(
        s.porDia.reduce((acc, d) => {
          const dt = fromISO(d.data)
          const chave = toISO(addDays(dt, -dt.getDay()))
          acc[chave] ??= { data: chave, faturamento: 0, atendimentos: 0 }
          acc[chave].faturamento += d.faturamento
          acc[chave].atendimentos += d.atendimentos
          return acc
        }, {})
      )
    : s.porDia

  const horas = []
  for (let h = Math.floor(toMin(db.config.abre) / 60); h < Math.ceil(toMin(db.config.fecha) / 60); h++) horas.push(h)

  const desfecho = [
    ['Concluídos', s.concluidos.length, 'bg-emerald-500'],
    ['Agendados', s.agendados.length, 'bg-sky-500'],
    ['Cancelados', s.cancelados.length, 'bg-cream-700'],
    ['Faltas', s.faltas.length, 'bg-red-500'],
  ]
  const totalDesf = desfecho.reduce((x, d) => x + d[1], 0)

  const exportar = () => {
    const linhas = [['Data', 'Hora', 'Cliente', 'Telefone', 'Serviços', 'Valor', 'Status']]
    s.ags
      .slice()
      .sort((x, y) => (x.data + x.hora).localeCompare(y.data + y.hora))
      .forEach((g) => linhas.push([dataBR(g.data), g.hora, g.clienteNome, g.clienteTelefone || '', g.servicoNomes, String(g.total).replace('.', ','), g.status]))
    const csv = '﻿' + linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const el = document.createElement('a')
    el.href = url
    el.download = `relatorio-${ini}-a-${fim}.csv`
    el.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Cabecalho titulo="Relatórios" sub={`${dataBR(ini)} a ${dataBR(fim)} · comparado com ${dataBR(antIni)} a ${dataBR(antFim)}`}>
        <Botao onClick={exportar}><Download size={16} /> Exportar CSV</Botao>
      </Cabecalho>

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <Abas valor={preset} onChange={setPreset} abas={PRESETS} />
        {preset === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" className="input !w-auto !py-1.5 [color-scheme:dark]" value={custom[0]} max={custom[1]} onChange={(e) => e.target.value && setCustom([e.target.value, custom[1]])} />
            <span className="text-cream-500 text-sm">até</span>
            <input type="date" className="input !w-auto !py-1.5 [color-scheme:dark]" value={custom[1]} min={custom[0]} onChange={(e) => e.target.value && setCustom([custom[0], e.target.value])} />
          </div>
        )}
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Kpi icone={Wallet} rotulo="Faturamento" valor={brl(s.faturamento)} detalhe={<Delta v={variacao(s.faturamento, a.faturamento)} />} tom="bom" />
        <Kpi icone={Scissors} rotulo="Atendimentos" valor={s.concluidos.length} detalhe={<Delta v={variacao(s.concluidos.length, a.concluidos.length)} />} />
        <Kpi icone={Ticket} rotulo="Ticket médio" valor={brl(s.ticket)} detalhe={<Delta v={variacao(s.ticket, a.ticket)} />} />
        <Kpi icone={Users} rotulo="Clientes atendidos" valor={s.atendidos} detalhe={`${s.novos} novos · ${s.recorrentes} recorrentes`} />
        <Kpi icone={UserX} rotulo="Faltas" valor={`${s.faltas.length} · ${pct(s.taxaFalta)}`} detalhe={<Delta v={variacao(s.faltas.length, a.faltas.length)} menorMelhor />} tom="critico" />
        <Kpi icone={Ban} rotulo="Cancelamentos" valor={`${s.cancelados.length} · ${pct(s.taxaCancel)}`} detalhe={<Delta v={variacao(s.cancelados.length, a.cancelados.length)} menorMelhor />} tom="alerta" />
        <Kpi icone={TrendingDown} rotulo="Perdido com faltas" valor={brl(s.perdaFaltas)} detalhe={`${brl(s.multasGeradas)} em multas geradas`} tom="critico" />
        <Kpi icone={HandCoins} rotulo="Multas recebidas" valor={brl(s.multasRecebidas)} detalhe={`${brl(s.multasAbertasValor)} em aberto hoje`} tom="bom" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="lg:col-span-2 min-w-0">
          <CardGrafico
            titulo={`Faturamento por ${porSemana ? 'semana' : 'dia'}`}
            sub="Somente atendimentos concluídos"
            tabela={{ colunas: [porSemana ? 'Semana de' : 'Dia', 'Faturamento', 'Atendimentos'], linhas: serie.map((d) => [dataCurta(d.data), brl(d.faturamento), d.atendimentos]) }}
          >
            <GraficoColunas
              dados={serie}
              x="data"
              y="faturamento"
              altura={260}
              formatarY={(v) => brl(v)}
              formatarTick={(v) => (v >= 1000 ? `R$${(v / 1000).toFixed(1).replace('.', ',')}k` : `R$${v}`)}
              tickX={(iso) => dataCurta(iso)}
              rotuloTooltip={(iso, p) => `${porSemana ? 'Semana de ' : `${DIAS_CURTOS[fromISO(iso).getDay()]}, `}${dataCurta(iso)} · ${p.atendimentos} atendimento(s)`}
            />
          </CardGrafico>
        </div>

        <section className="card p-4 sm:p-5">
          <h3 className="text-sm font-medium text-cream-50">Desfecho dos agendamentos</h3>
          <p className="text-xs text-cream-500 mt-0.5 mb-5">{totalDesf} agendamentos no período</p>
          {totalDesf === 0 ? <Vazio texto="Sem dados no período." /> : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden gap-[2px] mb-5">
                {desfecho.filter((d) => d[1]).map(([n, v, cor]) => (
                  <div key={n} className={`${cor} first:rounded-l-full last:rounded-r-full`} style={{ width: `${(v / totalDesf) * 100}%` }} title={`${n}: ${v}`} />
                ))}
              </div>
              <ul className="space-y-3">
                {desfecho.map(([n, v, cor]) => (
                  <li key={n} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-cream-300"><span className={`h-2.5 w-2.5 rounded-sm ${cor}`} />{n}</span>
                    <span className="tabular-nums text-cream-50">{v} <span className="text-cream-500 text-xs ml-1">{pct(v / totalDesf)}</span></span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <CardGrafico
          titulo="Serviços mais vendidos"
          sub="Quantidade · receita estimada"
          tabela={{ colunas: ['Serviço', 'Qtd', 'Receita'], linhas: s.porServico.map((x) => [x.nome, x.qtd, brl(x.receita)]) }}
        >
          {s.porServico.length ? (
            <BarrasRanking itens={s.porServico} valor={(x) => x.qtd} rotulo={(x) => x.nome} formatar={(v) => `${v}x`} extra={(x) => brl(x.receita)} />
          ) : <Vazio texto="Sem atendimentos no período." />}
        </CardGrafico>

        <CardGrafico
          titulo="Movimento por dia da semana"
          sub="Atendimentos concluídos"
          tabela={{ colunas: ['Dia', 'Atendimentos', 'Faturamento'], linhas: s.porDiaSemana.map((d) => [DIAS_CURTOS[d.dia], d.atendimentos, brl(d.faturamento)]) }}
        >
          <GraficoColunas
            dados={s.porDiaSemana.filter((d) => db.config.diasAbertos.includes(d.dia) || d.atendimentos)}
            x="dia"
            y="atendimentos"
            altura={240}
            formatarY={(v) => `${v} atendimentos`}
            formatarTick={(v) => v}
            tickX={(d) => DIAS_CURTOS[d]}
            rotuloTooltip={(d, p) => `${DIAS_CURTOS[d]} · ${brl(p.faturamento)}`}
          />
        </CardGrafico>
      </div>

      <div className="mb-6">
        <CardGrafico titulo="Horários de pico" sub="Atendimentos concluídos por dia da semana e hora de início">
          <MapaCalor heat={s.heat} dias={db.config.diasAbertos} horas={horas} nomesDias={DIAS_CURTOS} />
        </CardGrafico>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <TabelaRank titulo="Clientes que mais gastaram" linhas={s.topGasto} colunas={['Cliente', 'Visitas', 'Gasto']} valores={(c) => [c.visitas, brl(c.gasto)]} />
        <TabelaRank titulo="Clientes que mais faltaram" linhas={s.topFaltas} colunas={['Cliente', 'Faltas', 'Visitas']} valores={(c) => [c.faltas, c.visitas]} vazio="Nenhuma falta no período. 👏" />
      </div>
    </>
  )
}

function TabelaRank({ titulo, linhas, colunas, valores, vazio = 'Sem dados.' }) {
  return (
    <section className="card p-4 sm:p-5">
      <h3 className="text-sm font-medium text-cream-50 mb-3">{titulo}</h3>
      {linhas.length === 0 ? <Vazio texto={vazio} /> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-cream-500">
              {colunas.map((c, i) => <th key={c} className={`font-medium pb-2 ${i ? 'text-right' : 'text-left'}`}>{c}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-600">
            {linhas.map((c, i) => (
              <tr key={c.id}>
                <td className="py-2 text-cream-100"><span className="text-cream-700 tabular-nums mr-2">{i + 1}.</span>{c.nome}</td>
                {valores(c).map((v, j) => <td key={j} className="py-2 text-right tabular-nums text-cream-300">{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
