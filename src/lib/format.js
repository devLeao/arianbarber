export const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export const precoLabel = (servico) => (servico.preco == null ? 'A combinar' : brl(servico.preco))

export const pad = (n) => String(n).padStart(2, '0')

/** Date -> 'YYYY-MM-DD' (horário local) */
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** 'YYYY-MM-DD' -> Date ao meio-dia local (evita problemas de fuso) */
export const fromISO = (s) => new Date(`${s}T12:00:00`)

export const addDays = (d, n) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export const hoje = () => toISO(new Date())

export const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export const dataBR = (iso) => iso.split('-').reverse().join('/')
export const dataCurta = (iso) => {
  const d = fromISO(iso)
  return `${pad(d.getDate())} ${MESES_CURTOS[d.getMonth()]}`
}
export const dataLonga = (iso) => {
  const d = fromISO(iso)
  return `${DIAS[d.getDay()]}, ${pad(d.getDate())} de ${MESES_CURTOS[d.getMonth()]}`
}

export const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
export const fromMin = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`

export const telefoneMask = (v) => {
  let d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length > 2) d = `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length > 10) d = `${d.slice(0, 10)}-${d.slice(10)}`
  return d
}

export const iniciais = (nome = '') =>
  nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('')

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
