import { toISO, fromISO, addDays } from './format'

/** Todas as datas ISO entre ini e fim (inclusive). */
export function diasEntre(ini, fim) {
  const out = []
  for (let d = fromISO(ini); toISO(d) <= fim; d = addDays(d, 1)) out.push(toISO(d))
  return out
}

/** Métricas de um período [ini, fim] (datas ISO). */
export function calcularStats(db, ini, fim) {
  const ags = db.agendamentos.filter((a) => a.status !== 'bloqueio' && a.data >= ini && a.data <= fim)
  const concluidos = ags.filter((a) => a.status === 'concluido')
  const faltas = ags.filter((a) => a.status === 'falta')
  const cancelados = ags.filter((a) => a.status === 'cancelado')
  const agendados = ags.filter((a) => a.status === 'agendado')

  const soma = (arr) => arr.reduce((s, a) => s + (a.total || 0), 0)
  const faturamento = soma(concluidos)
  const previsto = faturamento + soma(agendados)

  const multasPeriodo = db.multas.filter((m) => m.dataFalta >= ini && m.dataFalta <= fim)
  const multasRecebidas = db.multas.filter((m) => m.status === 'paga' && m.pagaEm >= ini && m.pagaEm <= fim)
  const multasAbertas = db.multas.filter((m) => m.status === 'aberta')

  // Primeiro atendimento de cada cliente (para novos x recorrentes)
  const primeiraVisita = {}
  for (const a of db.agendamentos) {
    if (a.status !== 'concluido' || !a.clienteId) continue
    if (!primeiraVisita[a.clienteId] || a.data < primeiraVisita[a.clienteId]) primeiraVisita[a.clienteId] = a.data
  }
  const atendidos = new Set(concluidos.map((a) => a.clienteId))
  const novos = [...atendidos].filter((id) => primeiraVisita[id] >= ini).length

  // Séries
  const porDia = diasEntre(ini, fim).map((iso) => {
    const doDia = concluidos.filter((a) => a.data === iso)
    return { data: iso, faturamento: soma(doDia), atendimentos: doDia.length }
  })

  const precoAtual = Object.fromEntries(db.servicos.map((s) => [s.id, s]))
  const servMap = {}
  for (const a of concluidos) {
    const ids = a.servicoIds || []
    const somaCatalogo = ids.reduce((s, id) => s + (precoAtual[id]?.preco ?? 0), 0)
    for (const id of ids) {
      const s = precoAtual[id]
      const nome = s?.nome || id
      servMap[nome] ??= { nome, qtd: 0, receita: 0 }
      servMap[nome].qtd++
      // distribui o total proporcional ao preço de tabela (lida com valores ajustados)
      const peso = somaCatalogo ? (s?.preco ?? 0) / somaCatalogo : 1 / ids.length
      servMap[nome].receita += a.total * peso
    }
  }
  const porServico = Object.values(servMap).sort((a, b) => b.qtd - a.qtd)

  const porDiaSemana = [2, 3, 4, 5, 6, 0, 1].map((d) => {
    const doDia = concluidos.filter((a) => fromISO(a.data).getDay() === d)
    return { dia: d, atendimentos: doDia.length, faturamento: soma(doDia) }
  })

  // Heatmap: dia da semana x hora cheia
  const heat = {}
  for (const a of concluidos) {
    const d = fromISO(a.data).getDay()
    const h = Number(a.hora.slice(0, 2))
    heat[`${d}-${h}`] = (heat[`${d}-${h}`] || 0) + 1
  }

  // Ranking de clientes
  const cliMap = {}
  for (const a of ags) {
    if (!a.clienteId) continue
    cliMap[a.clienteId] ??= { id: a.clienteId, nome: a.clienteNome, gasto: 0, visitas: 0, faltas: 0 }
    if (a.status === 'concluido') {
      cliMap[a.clienteId].gasto += a.total
      cliMap[a.clienteId].visitas++
    }
    if (a.status === 'falta') cliMap[a.clienteId].faltas++
  }
  const clientesRank = Object.values(cliMap)

  const finalizados = concluidos.length + faltas.length
  return {
    ags,
    concluidos,
    faltas,
    cancelados,
    agendados,
    faturamento,
    previsto,
    ticket: concluidos.length ? faturamento / concluidos.length : 0,
    taxaFalta: finalizados ? faltas.length / finalizados : 0,
    taxaCancel: ags.length ? cancelados.length / ags.length : 0,
    multasGeradas: multasPeriodo.reduce((s, m) => s + m.valor, 0),
    multasGeradasQtd: multasPeriodo.length,
    multasRecebidas: multasRecebidas.reduce((s, m) => s + m.valor, 0),
    multasAbertasValor: multasAbertas.reduce((s, m) => s + m.valor, 0),
    multasAbertasQtd: multasAbertas.length,
    perdaFaltas: soma(faltas),
    atendidos: atendidos.size,
    novos,
    recorrentes: atendidos.size - novos,
    porDia,
    porServico,
    porDiaSemana,
    heat,
    topGasto: [...clientesRank].sort((a, b) => b.gasto - a.gasto).slice(0, 5),
    topFaltas: clientesRank.filter((c) => c.faltas > 0).sort((a, b) => b.faltas - a.faltas).slice(0, 5),
  }
}

/** Variação percentual entre dois valores (null se não dá pra comparar). */
export const variacao = (atual, anterior) => (anterior ? (atual - anterior) / anterior : null)

/** Resumo por cliente (para a página de clientes). */
export function resumoClientes(db) {
  return db.clientes.map((c) => {
    const ags = db.agendamentos.filter((a) => a.clienteId === c.id)
    const concl = ags.filter((a) => a.status === 'concluido')
    const ultima = concl.map((a) => a.data).sort().pop() || null
    const proximo = ags.filter((a) => a.status === 'agendado' && a.data >= toISO(new Date())).map((a) => a.data + ' ' + a.hora).sort()[0] || null
    const multasAbertas = db.multas.filter((m) => m.clienteId === c.id && m.status === 'aberta')
    return {
      ...c,
      visitas: concl.length,
      gasto: concl.reduce((s, a) => s + a.total, 0),
      faltas: ags.filter((a) => a.status === 'falta').length,
      cancelamentos: ags.filter((a) => a.status === 'cancelado').length,
      ultima,
      proximo,
      devendo: multasAbertas.reduce((s, m) => s + m.valor, 0),
    }
  })
}
