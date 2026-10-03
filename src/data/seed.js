import { toISO, addDays, fromISO, uid } from '../lib/format'
import { gerarSlots, slotLivre, intervalosOcupados } from '../lib/schedule'

// ---------------------------------------------------------------------------
// Dados FICTÍCIOS para o protótipo. Na fase 2 tudo isso vem do Firestore.
// ---------------------------------------------------------------------------

export const CONFIG_PADRAO = {
  nomeBarbearia: 'Arian Barber',
  diasAbertos: [2, 3, 4, 5, 6], // terça a sábado
  abre: '09:00',
  fecha: '22:00',
  almocoInicio: '12:00',
  almocoFim: '13:00',
  slotMin: 40,
  antecedenciaCancelHoras: 2,
  multaPct: 50,
  diasAgendaAberta: 21,
  whatsapp: '5531999999999',
  instagram: 'arianbarber',
  endereco: 'Rua Exemplo, 123 - Centro',
  cidade: 'Belo Horizonte - MG',
  pixChave: 'pix@arianbarber.com.br',
  pixNome: 'Arian Barber',
  pixCidade: 'Belo Horizonte',
}

export const SERVICOS = [
  { id: 'corte', nome: 'Corte', preco: 30, duracao: 40, img: '/img/corte.jpg', desc: 'Corte social, degradê ou na tesoura.' },
  { id: 'barba', nome: 'Barba', preco: 25, duracao: 20, img: '/img/barba.jpg', desc: 'Barba modelada com toalha quente.' },
  { id: 'freestyle', nome: 'Freestyle', preco: null, duracao: 50, img: '/img/freestyle.jpg', desc: 'Desenhos e arte no cabelo.' },
  { id: 'pigmentacao', nome: 'Pigmentação', preco: 60, duracao: 50, img: '/img/pigmentacao.jpg', desc: 'Acabamento perfilado.' },
  { id: 'luzes', nome: 'Luzes', preco: 90, duracao: 120, img: '/img/luzes.jpg', desc: 'Iluminação dos fios.' },
  { id: 'reflexo', nome: 'Reflexo', preco: 130, duracao: 120, img: '/img/reflexo.jpg', desc: 'Alinhamento e clareamento.' },
  { id: 'platinado', nome: 'Platinado', preco: 110, duracao: 120, img: '/img/platinado.jpg', desc: 'Nevou, platinado.' },
  { id: 'colorido', nome: 'Colorido', preco: 110, duracao: 60, img: '/img/colorido.jpg', desc: 'Diversas cores.' },
].map((s, i) => ({ ...s, ativo: true, ordem: i }))

export const PRODUTOS = [
  { id: 'minoxidil', nome: 'Minoxidil 5%', preco: 69.9, categoria: 'Tratamento', icone: 'droplet', estoque: 12, desc: 'Estimula o crescimento da barba e do cabelo. Frasco 60 ml.' },
  { id: 'gel', nome: 'Gel Fixador Extra Forte', preco: 24.9, categoria: 'Finalização', icone: 'sparkles', estoque: 20, desc: 'Fixação o dia todo com efeito molhado.' },
  { id: 'pomada', nome: 'Pomada Modeladora Matte', preco: 44.9, categoria: 'Finalização', icone: 'circle', estoque: 15, desc: 'Efeito seco, fixação média. Ideal para texturizado.' },
  { id: 'oleo', nome: 'Óleo para Barba', preco: 39.9, categoria: 'Barba', icone: 'droplets', estoque: 9, desc: 'Hidrata, amacia e perfuma. Aroma amadeirado.' },
  { id: 'balm', nome: 'Balm para Barba', preco: 34.9, categoria: 'Barba', icone: 'leaf', estoque: 7, desc: 'Controla os fios rebeldes e alinha a barba.' },
  { id: 'shampoo', nome: 'Shampoo Anticaspa', preco: 32.0, categoria: 'Cabelo', icone: 'flask', estoque: 10, desc: 'Limpeza profunda com mentol. 250 ml.' },
  { id: 'posbarba', nome: 'Loção Pós-Barba', preco: 29.9, categoria: 'Barba', icone: 'spray', estoque: 0, desc: 'Acalma a pele e evita irritações.' },
  { id: 'pente', nome: 'Pente de Madeira', preco: 19.9, categoria: 'Acessórios', icone: 'comb', estoque: 25, desc: 'Antiestático, feito à mão.' },
].map((p, i) => ({ ...p, ativo: true, ordem: i }))

const NOMES = [
  'Lucas Almeida', 'Gabriel Souza', 'Matheus Oliveira', 'Pedro Henrique', 'Rafael Costa', 'João Vitor',
  'Gustavo Lima', 'Felipe Rocha', 'Bruno Martins', 'Thiago Ribeiro', 'Caio Fernandes', 'Vinícius Alves',
  'Leonardo Dias', 'Henrique Barbosa', 'Diego Carvalho', 'Eduardo Pires', 'Igor Mendes', 'Renan Teixeira',
  'André Moreira', 'Samuel Freitas', 'Daniel Castro', 'Marcelo Nunes', 'Victor Hugo', 'Otávio Ramos',
  'Arthur Correia', 'Enzo Gomes', 'Murilo Santos', 'Davi Araújo',
]

// PRNG determinístico: os dados de exemplo saem sempre iguais
function rng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const COMBOS = [
  [['corte'], 46],
  [['corte', 'barba'], 26],
  [['barba'], 9],
  [['corte', 'pigmentacao'], 6],
  [['freestyle'], 3],
  [['luzes'], 3],
  [['platinado'], 3],
  [['reflexo'], 2],
  [['colorido'], 2],
]

function sortear(r, pesos) {
  const total = pesos.reduce((s, [, p]) => s + p, 0)
  let x = r() * total
  for (const [v, p] of pesos) if ((x -= p) < 0) return v
  return pesos[0][0]
}

export const montarAgendamento = (cliente, servicos, data, hora, status, extra = {}) => {
  const itens = servicos.map((id) => SERVICOS.find((s) => s.id === id))
  return {
    id: uid(),
    clienteId: cliente.id,
    clienteNome: cliente.nome,
    clienteTelefone: cliente.telefone,
    servicoIds: itens.map((s) => s.id),
    servicoNomes: itens.map((s) => s.nome).join(' + '),
    total: itens.reduce((s, i) => s + (i.preco ?? 0), 0) || (itens.some((i) => i.id === 'freestyle') ? 40 : 0),
    duracao: itens.reduce((s, i) => s + i.duracao, 0),
    data,
    hora,
    status,
    criadoEm: data,
    ...extra,
  }
}

export function gerarSeed() {
  const r = rng(20260930)
  const hojeD = new Date()
  const hojeISO = toISO(hojeD)

  const clientes = NOMES.map((nome, i) => ({
    id: `c${i + 1}`,
    nome,
    email: `${nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ /g, '.')}@gmail.com`,
    telefone: `(31) 9${String(8000 + Math.floor(r() * 1999)).padStart(4, '0')}-${String(Math.floor(r() * 9999)).padStart(4, '0')}`,
    criadoEm: toISO(addDays(hojeD, -100 + Math.floor(i * 3.2))),
  }))

  // Clientes do login de demonstração
  const demo = { id: 'demo', nome: 'Cliente Demo', email: 'cliente.demo@gmail.com', telefone: '(31) 98888-7777', criadoEm: toISO(addDays(hojeD, -60)) }
  const devedor = { id: 'devedor', nome: 'Rodrigo Faltoso', email: 'rodrigo.faltoso@gmail.com', telefone: '(31) 97777-6666', criadoEm: toISO(addDays(hojeD, -40)) }
  clientes.push(demo, devedor)

  const config = CONFIG_PADRAO
  const slots = gerarSlots(config)
  const agendamentos = []
  const multas = []

  for (let off = -95; off <= 12; off++) {
    const dia = addDays(hojeD, off)
    const iso = toISO(dia)
    if (!config.diasAbertos.includes(dia.getDay())) continue
    const fimDeSemana = dia.getDay() >= 5
    // ocupação maior em sexta/sábado, menor no futuro distante
    let ocupacao = fimDeSemana ? 0.75 : 0.5
    if (off > 0) ocupacao *= Math.max(0.15, 1 - off / 10)

    for (const hora of slots) {
      if (r() > ocupacao) continue
      const combo = sortear(r, COMBOS)
      const cliente = clientes[Math.floor(r() * NOMES.length)]
      const tmp = montarAgendamento(cliente, combo, iso, hora, 'agendado')
      const ocupados = intervalosOcupados(agendamentos, iso)
      // usa a mesma regra do site, ignorando a checagem de "passado"
      const ini = Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3))
      if (ocupados.some(([a, b]) => ini < b && ini + tmp.duracao > a)) continue
      if (!slotLivre({ ...config }, hora, tmp.duracao, [], '0000-00-00')) continue

      let status = 'agendado'
      const passou = off < 0 || (off === 0 && ini + tmp.duracao < hojeD.getHours() * 60 + hojeD.getMinutes())
      if (passou) {
        const x = r()
        status = x < 0.84 ? 'concluido' : x < 0.93 ? 'cancelado' : 'falta'
      } else if (r() < 0.06) status = 'cancelado'
      tmp.status = status
      tmp.criadoEm = toISO(addDays(dia, -Math.floor(r() * 6)))
      agendamentos.push(tmp)

      if (status === 'falta') {
        const valor = Math.round(tmp.total * config.multaPct) / 100
        const antiga = off < -10
        const perdoada = antiga && r() < 0.15
        multas.push({
          id: uid(),
          clienteId: cliente.id,
          clienteNome: cliente.nome,
          agendamentoId: tmp.id,
          dataFalta: iso,
          valor,
          status: antiga ? (perdoada ? 'perdoada' : 'paga') : 'aberta',
          criadaEm: iso,
          pagaEm: antiga && !perdoada ? toISO(addDays(dia, 1 + Math.floor(r() * 5))) : null,
          via: antiga && !perdoada ? (r() < 0.7 ? 'pix' : 'manual') : null,
        })
      }
    }
  }

  // Histórico do cliente demo: alguns cortes concluídos
  ;[-35, -21, -7].forEach((off) => {
    let d = addDays(hojeD, off)
    while (!config.diasAbertos.includes(d.getDay())) d = addDays(d, 1)
    agendamentos.push(montarAgendamento(demo, ['corte', 'barba'], toISO(d), '20:20', 'concluido'))
  })

  // Rodrigo faltou recentemente -> multa em aberto (bloqueado para agendar)
  let dFalta = addDays(hojeD, -4)
  while (!config.diasAbertos.includes(dFalta.getDay())) dFalta = addDays(dFalta, -1)
  const agFalta = montarAgendamento(devedor, ['corte', 'barba'], toISO(dFalta), '21:00', 'falta')
  agendamentos.push(agFalta)
  multas.push({
    id: uid(), clienteId: devedor.id, clienteNome: devedor.nome, agendamentoId: agFalta.id,
    dataFalta: agFalta.data, valor: (agFalta.total * config.multaPct) / 100, status: 'aberta',
    criadaEm: agFalta.data, pagaEm: null, via: null,
  })

  // Débito manual: corte feito e não pago
  const fiado = clientes.find((c) => c.nome === 'Igor Mendes')
  multas.push({
    id: uid(), clienteId: fiado.id, clienteNome: fiado.nome, agendamentoId: null, tipo: 'debito',
    dataFalta: toISO(addDays(hojeD, -9)), descricao: 'Corte + Barba não pago (ficou de acertar)', valor: 55,
    status: 'aberta', bloqueia: true, criadaEm: toISO(addDays(hojeD, -9)), pagaEm: null, via: null,
  })

  agendamentos.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))

  return {
    versao: 2,
    config,
    servicos: SERVICOS,
    produtos: PRODUTOS,
    clientes,
    agendamentos,
    multas,
    notificacoes: [
      {
        id: uid(),
        tipo: 'info',
        titulo: 'Bem-vindo ao protótipo',
        texto: 'Todos os dados aqui são fictícios. Você pode resetá-los em Configurações.',
        criadoEm: new Date().toISOString(),
        lida: false,
      },
    ],
    sessao: null, // { tipo: 'cliente', clienteId } | { tipo: 'admin' }
    geradoEm: hojeISO,
  }
}

export const ehHoje = (iso) => iso === toISO(new Date())
export const diaSemana = (iso) => fromISO(iso).getDay()
