import { CheckCircle2, XCircle, Clock3, Ban, Lock, Inbox } from 'lucide-react'

export function Cabecalho({ titulo, sub, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-cream-50 tracking-tight">{titulo}</h1>
        {sub && <p className="text-sm text-cream-500 mt-1">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

/** Variação vs período anterior. `menorMelhor` inverte a cor (ex.: faltas). */
export function Delta({ v, menorMelhor = false }) {
  if (v == null || !isFinite(v)) return <span className="text-cream-700">sem comparação</span>
  const bom = menorMelhor ? v <= 0 : v >= 0
  const seta = v > 0 ? '↑' : v < 0 ? '↓' : '→'
  return (
    <span className={bom ? 'text-emerald-400' : 'text-red-400'}>
      {seta} {Math.abs(Math.round(v * 100))}% <span className="text-cream-700">vs. anterior</span>
    </span>
  )
}

export function Kpi({ icone: Icone, rotulo, valor, detalhe, tom = 'neutro' }) {
  const tons = {
    neutro: 'text-brass-400 bg-brass-500/10',
    bom: 'text-emerald-400 bg-emerald-500/10',
    alerta: 'text-orange-400 bg-orange-500/10',
    critico: 'text-red-400 bg-red-500/10',
  }
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs sm:text-sm text-cream-500">{rotulo}</span>
        {Icone && <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${tons[tom]}`}><Icone size={16} /></span>}
      </div>
      <div className="text-xl sm:text-2xl font-semibold text-cream-50 tracking-tight tabular-nums">{valor}</div>
      {detalhe && <div className="text-xs text-cream-500 mt-1">{detalhe}</div>}
    </div>
  )
}

export const STATUS = {
  agendado: { txt: 'Agendado', icone: Clock3, cls: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
  concluido: { txt: 'Concluído', icone: CheckCircle2, cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
  cancelado: { txt: 'Cancelado', icone: Ban, cls: 'text-cream-500 bg-ink-700 border-ink-500' },
  falta: { txt: 'Falta', icone: XCircle, cls: 'text-red-300 bg-red-500/10 border-red-500/30' },
  bloqueio: { txt: 'Bloqueado', icone: Lock, cls: 'text-cream-300 bg-ink-600 border-ink-500' },
  aberta: { txt: 'Em aberto', icone: Clock3, cls: 'text-orange-300 bg-orange-500/10 border-orange-500/30' },
  paga: { txt: 'Paga', icone: CheckCircle2, cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
  perdoada: { txt: 'Perdoada', icone: Ban, cls: 'text-cream-300 bg-ink-700 border-ink-500' },
}

export function Status({ s }) {
  const st = STATUS[s] || STATUS.agendado
  const Icone = st.icone
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${st.cls}`}>
      <Icone size={12} /> {st.txt}
    </span>
  )
}

export function Vazio({ texto, icone: Icone = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icone size={28} className="text-cream-700 mb-3" />
      <p className="text-sm text-cream-500">{texto}</p>
    </div>
  )
}

export function Abas({ abas, valor, onChange }) {
  return (
    <div className="inline-flex bg-ink-850 border border-ink-600 rounded-lg p-1 gap-1 overflow-x-auto max-w-full scrollbar-thin">
      {abas.map(([id, nome, n]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors cursor-pointer ${valor === id ? 'bg-ink-600 text-cream-50' : 'text-cream-500 hover:text-cream-100'}`}
        >
          {nome}
          {n != null && <span className="ml-1.5 text-xs text-cream-500">{n}</span>}
        </button>
      ))}
    </div>
  )
}

export const Botao = ({ variante = 'sec', className = '', ...p }) => {
  const v = {
    pri: 'bg-brass-500 text-ink-950 hover:bg-brass-400 font-semibold',
    sec: 'bg-ink-700 border border-ink-500 text-cream-100 hover:bg-ink-600',
    perigo: 'bg-red-600 text-white hover:bg-red-500 font-semibold',
    ok: 'bg-emerald-600 text-white hover:bg-emerald-500 font-semibold',
    fantasma: 'text-cream-300 hover:bg-ink-700 hover:text-cream-50',
  }
  return (
    <button
      {...p}
      className={`inline-flex items-center justify-center gap-2 text-sm px-3.5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${v[variante]} ${className}`}
    />
  )
}

export function Avatar({ nome, className = '' }) {
  const ini = (nome || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  return (
    <span className={`h-9 w-9 shrink-0 rounded-full bg-ink-600 text-cream-100 text-xs font-semibold flex items-center justify-center ${className}`}>{ini}</span>
  )
}

export function Toggle({ ligado, onChange, rotulo }) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        onClick={() => onChange(!ligado)}
        className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${ligado ? 'bg-brass-500' : 'bg-ink-500'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${ligado ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
      {rotulo && <span className="text-sm text-cream-100">{rotulo}</span>}
    </label>
  )
}
