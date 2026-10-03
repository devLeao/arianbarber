import { useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Table2, BarChart3 } from 'lucide-react'

export const COR = {
  serie: '#c9a227',
  serieHover: '#e5c66e',
  grade: '#2c2720',
  eixo: '#9d927f',
  superficie: '#17140f',
}

/** Card de gráfico com alternância para visualização em tabela. */
export function CardGrafico({ titulo, sub, tabela, children, acao }) {
  const [verTabela, setVerTabela] = useState(false)
  return (
    <section className="card p-4 sm:p-5 min-w-0">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-medium text-cream-50">{titulo}</h3>
          {sub && <p className="text-xs text-cream-500 mt-0.5">{sub}</p>}
        </div>
        <div className="flex items-center gap-1">
          {acao}
          {tabela && (
            <button
              onClick={() => setVerTabela(!verTabela)}
              className="p-1.5 rounded-md text-cream-500 hover:text-cream-50 hover:bg-ink-700 cursor-pointer"
              title={verTabela ? 'Ver gráfico' : 'Ver tabela'}
            >
              {verTabela ? <BarChart3 size={16} /> : <Table2 size={16} />}
            </button>
          )}
        </div>
      </div>
      {verTabela && tabela ? <TabelaDados {...tabela} /> : children}
    </section>
  )
}

function TabelaDados({ colunas, linhas }) {
  return (
    <div className="max-h-72 overflow-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-ink-800">
          <tr>{colunas.map((c, i) => <th key={c} className={`py-2 px-2 font-medium text-cream-500 text-xs ${i ? 'text-right' : 'text-left'}`}>{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-ink-600">
          {linhas.map((l, i) => (
            <tr key={i}>{l.map((v, j) => <td key={j} className={`py-1.5 px-2 tabular-nums ${j ? 'text-right text-cream-100' : 'text-cream-300'}`}>{v}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DicaTooltip({ active, payload, label, formatar, rotulo }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ink-950 border border-ink-500 rounded-lg px-3 py-2 shadow-xl text-xs">
      <div className="text-cream-500 mb-0.5">{rotulo ? rotulo(label, payload[0].payload) : label}</div>
      <div className="text-cream-50 font-semibold tabular-nums">{formatar(payload[0].value, payload[0].payload)}</div>
    </div>
  )
}

/** Colunas verticais, uma série. */
export function GraficoColunas({ dados, x, y, formatarY, formatarTick, rotuloTooltip, altura = 240, tickX }) {
  return (
    <div style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke={COR.grade} />
          <XAxis dataKey={x} tick={{ fill: COR.eixo, fontSize: 11 }} tickLine={false} axisLine={{ stroke: COR.grade }} tickFormatter={tickX} interval="preserveStartEnd" minTickGap={12} />
          <YAxis tick={{ fill: COR.eixo, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatarTick || formatarY} width={56} allowDecimals={false} />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<DicaTooltip formatar={formatarY} rotulo={rotuloTooltip} />} />
          <Bar dataKey={y} fill={COR.serie} radius={[4, 4, 0, 0]} maxBarSize={24} activeBar={{ fill: COR.serieHover }} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Barras horizontais em HTML puro (rótulo + valor na ponta), boas para rankings. */
export function BarrasRanking({ itens, valor, rotulo, formatar, extra }) {
  const max = Math.max(1, ...itens.map(valor))
  return (
    <ul className="space-y-3">
      {itens.map((it, i) => (
        <li key={i} className="group" title={`${rotulo(it)}: ${formatar(valor(it))}`}>
          <div className="flex justify-between text-sm mb-1.5 gap-3">
            <span className="text-cream-100 truncate">{rotulo(it)}</span>
            <span className="text-cream-300 tabular-nums whitespace-nowrap">
              {formatar(valor(it))}
              {extra && <span className="text-cream-500 ml-2">{extra(it)}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-ink-700 overflow-hidden">
            <div className="h-full rounded-r-full transition-all group-hover:brightness-125" style={{ width: `${(valor(it) / max) * 100}%`, background: COR.serie }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Mapa de calor dia da semana x hora (sequencial em uma cor). */
export function MapaCalor({ heat, dias, horas, nomesDias }) {
  const max = Math.max(1, ...Object.values(heat))
  const [foco, setFoco] = useState(null)
  return (
    <div>
      <div className="overflow-x-auto scrollbar-thin">
        <div className="inline-grid gap-[2px] min-w-full" style={{ gridTemplateColumns: `40px repeat(${horas.length}, minmax(22px, 1fr))` }}>
          <div />
          {horas.map((h) => <div key={h} className="text-[10px] text-cream-500 text-center pb-1">{h}h</div>)}
          {dias.map((d) => (
            <FragmentoLinha key={d} d={d} nome={nomesDias[d]} horas={horas} heat={heat} max={max} setFoco={setFoco} />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
        <div className="text-xs text-cream-300 h-4">
          {foco ? `${nomesDias[foco.d]} às ${foco.h}h: ${foco.v} atendimento${foco.v === 1 ? '' : 's'}` : 'Passe o mouse sobre um quadro'}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-cream-500">
          menos
          {[0.1, 0.3, 0.55, 0.8, 1].map((o) => <span key={o} className="h-3 w-4 rounded-sm" style={{ background: COR.serie, opacity: o }} />)}
          mais
        </div>
      </div>
    </div>
  )
}

function FragmentoLinha({ d, nome, horas, heat, max, setFoco }) {
  return (
    <>
      <div className="text-[11px] text-cream-500 flex items-center">{nome}</div>
      {horas.map((h) => {
        const v = heat[`${d}-${h}`] || 0
        return (
          <div
            key={h}
            onMouseEnter={() => setFoco({ d, h, v })}
            onMouseLeave={() => setFoco(null)}
            className="h-7 rounded-[3px] hover:ring-2 hover:ring-cream-50/60"
            style={{ background: v ? COR.serie : '#211d17', opacity: v ? 0.12 + 0.88 * (v / max) : 1 }}
          />
        )
      })}
    </>
  )
}
