import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { gerarSeed } from '../data/seed'
import { uid, toISO, brl, dataBR } from '../lib/format'

// ---------------------------------------------------------------------------
// Store do protótipo: simula o backend (Firebase) salvando no localStorage.
// Na fase 2, cada ação abaixo vira uma escrita no Firestore / Cloud Function,
// mantendo a mesma interface para os componentes.
// ---------------------------------------------------------------------------

const CHAVE = 'arian-barber-prototipo-v1'
const StoreContext = createContext(null)

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE))
    if (salvo?.versao === 3) return salvo
  } catch {
    /* sem storage disponível: usa seed */
  }
  return gerarSeed()
}

export function StoreProvider({ children }) {
  const [db, setDb] = useState(carregar)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(db))
    } catch {
      /* ignora */
    }
  }, [db])

  const avisar = useCallback((msg, tipo = 'ok') => {
    setToast({ msg, tipo, id: uid() })
    setTimeout(() => setToast((t) => (t?.msg === msg ? null : t)), 3500)
  }, [])

  const notificar = (d, n) => ({
    ...d,
    notificacoes: [{ id: uid(), criadoEm: new Date().toISOString(), lida: false, ...n }, ...d.notificacoes],
  })

  const atualizarAg = (d, id, patch) => ({
    ...d,
    agendamentos: d.agendamentos.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  })

  const acoes = useMemo(
    () => ({
      // ---------- Sessão (simula login com Google) ----------
      entrarComoCliente: (clienteId) => setDb((d) => ({ ...d, sessao: { tipo: 'cliente', clienteId } })),
      entrarComoNovoCliente: (nome, email) =>
        setDb((d) => {
          const existente = d.clientes.find((c) => c.email === email)
          if (existente) return { ...d, sessao: { tipo: 'cliente', clienteId: existente.id } }
          const c = { id: uid(), nome, email, telefone: '', criadoEm: toISO(new Date()) }
          return { ...d, clientes: [...d.clientes, c], sessao: { tipo: 'cliente', clienteId: c.id } }
        }),
      entrarComoAdmin: () => setDb((d) => ({ ...d, sessao: { tipo: 'admin' } })),
      sair: () => setDb((d) => ({ ...d, sessao: null })),

      // ---------- Agendamentos ----------
      criarAgendamento: (ag) =>
        setDb((d) => {
          const novo = { id: uid(), criadoEm: toISO(new Date()), status: 'agendado', ...ag }
          let clientes = d.clientes
          if (ag.clienteId && ag.clienteTelefone)
            clientes = clientes.map((c) => (c.id === ag.clienteId ? { ...c, telefone: ag.clienteTelefone } : c))
          const prox = { ...d, clientes, agendamentos: [...d.agendamentos, novo] }
          return notificar(prox, {
            tipo: 'agendamento',
            titulo: 'Novo agendamento',
            texto: `${ag.clienteNome} · ${ag.servicoNomes} · ${dataBR(ag.data)} às ${ag.hora}`,
          })
        }),
      cancelarAgendamento: (id, porCliente = false) =>
        setDb((d) => {
          const ag = d.agendamentos.find((a) => a.id === id)
          if (ag?.status === 'bloqueio') return { ...d, agendamentos: d.agendamentos.filter((a) => a.id !== id) }
          const prox = atualizarAg(d, id, { status: 'cancelado', canceladoPor: porCliente ? 'cliente' : 'admin' })
          return porCliente
            ? notificar(prox, {
                tipo: 'cancelamento',
                titulo: 'Agendamento cancelado pelo cliente',
                texto: `${ag.clienteNome} · ${dataBR(ag.data)} às ${ag.hora}`,
              })
            : prox
        }),
      concluirAgendamento: (id) => setDb((d) => atualizarAg(d, id, { status: 'concluido' })),
      reabrirAgendamento: (id) => setDb((d) => atualizarAg(d, id, { status: 'agendado' })),
      editarServicosAgendamento: (id, servicoIds) =>
        setDb((d) => {
          const itens = servicoIds.map((s) => d.servicos.find((x) => x.id === s)).filter(Boolean)
          return atualizarAg(d, id, {
            servicoIds,
            servicoNomes: itens.map((s) => s.nome).join(' + '),
            total: itens.reduce((s, i) => s + (i.preco ?? 0), 0),
            duracao: itens.reduce((s, i) => s + i.duracao, 0),
          })
        }),
      ajustarValor: (id, total) => setDb((d) => atualizarAg(d, id, { total })),
      // Falta (não veio ou cancelou fora do prazo): o horário fica livre para
      // outros clientes, mas a multa é gerada do mesmo jeito.
      marcarFalta: (id, motivo = 'nao_compareceu') =>
        setDb((d) => {
          const ag = d.agendamentos.find((a) => a.id === id)
          const valor = Math.round(ag.total * d.config.multaPct) / 100
          const prox = atualizarAg(d, id, { status: 'falta', motivoFalta: motivo })
          return {
            ...prox,
            multas: [
              ...prox.multas,
              {
                id: uid(),
                clienteId: ag.clienteId,
                clienteNome: ag.clienteNome,
                agendamentoId: ag.id,
                tipo: 'falta',
                dataFalta: ag.data,
                descricao: `${motivo === 'cancelou_tarde' ? 'Cancelamento fora do prazo' : 'Falta'} em ${dataBR(ag.data)} (${ag.servicoNomes})`,
                valor,
                status: 'aberta',
                bloqueia: true,
                criadaEm: toISO(new Date()),
                pagaEm: null,
                via: null,
              },
            ],
          }
        }),
      // Débito lançado manualmente (ex.: corte fiado / não pago)
      lancarDebito: ({ clienteId, clienteNome, valor, descricao, bloqueia = true }) =>
        setDb((d) => ({
          ...d,
          multas: [
            ...d.multas,
            {
              id: uid(),
              clienteId,
              clienteNome,
              agendamentoId: null,
              tipo: 'debito',
              dataFalta: toISO(new Date()),
              descricao,
              valor,
              status: 'aberta',
              bloqueia,
              criadaEm: toISO(new Date()),
              pagaEm: null,
              via: null,
            },
          ],
        })),
      bloquearHorario: (data, hora, duracao, motivo) =>
        setDb((d) => ({
          ...d,
          agendamentos: [
            ...d.agendamentos,
            { id: uid(), data, hora, duracao, status: 'bloqueio', motivo: motivo || 'Horário fechado', servicoNomes: motivo || 'Horário fechado', total: 0, clienteNome: 'Bloqueio' },
          ],
        })),
      bloquearDia: (data, motivo) =>
        setDb((d) => ({
          ...d,
          agendamentos: [
            ...d.agendamentos,
            { id: uid(), data, hora: '00:00', duracao: 1440, diaInteiro: true, status: 'bloqueio', motivo: motivo || 'Dia fechado', servicoNomes: motivo || 'Dia fechado', total: 0, clienteNome: 'Bloqueio' },
          ],
        })),
      desbloquearDia: (data) =>
        setDb((d) => ({ ...d, agendamentos: d.agendamentos.filter((a) => !(a.data === data && a.status === 'bloqueio')) })),

      // ---------- Multas ----------
      // Aceita um id ou uma lista de ids (cliente paga todas as pendências de uma vez)
      pagarMulta: (ids, via) =>
        setDb((d) => {
          const lista = [].concat(ids)
          const pagas = d.multas.filter((x) => lista.includes(x.id))
          const prox = {
            ...d,
            multas: d.multas.map((x) => (lista.includes(x.id) ? { ...x, status: 'paga', pagaEm: toISO(new Date()), via } : x)),
          }
          return notificar(prox, {
            tipo: 'multa_paga',
            titulo: via === 'pix' ? 'Pendência paga via Pix' : 'Pendência marcada como paga',
            texto: `${pagas[0].clienteNome} pagou ${brl(pagas.reduce((s, m) => s + m.valor, 0))}. Acesso ao agendamento liberado.`,
          })
        }),
      perdoarMulta: (id) =>
        setDb((d) => ({ ...d, multas: d.multas.map((x) => (x.id === id ? { ...x, status: 'perdoada', pagaEm: toISO(new Date()) } : x)) })),

      // ---------- Catálogo ----------
      salvarServico: (s) =>
        setDb((d) => {
          const existe = d.servicos.some((x) => x.id === s.id)
          return {
            ...d,
            servicos: existe ? d.servicos.map((x) => (x.id === s.id ? s : x)) : [...d.servicos, { ...s, id: uid(), ordem: d.servicos.length }],
          }
        }),
      removerServico: (id) => setDb((d) => ({ ...d, servicos: d.servicos.filter((x) => x.id !== id) })),
      salvarProduto: (p) =>
        setDb((d) => {
          const existe = d.produtos.some((x) => x.id === p.id)
          return {
            ...d,
            produtos: existe ? d.produtos.map((x) => (x.id === p.id ? p : x)) : [...d.produtos, { ...p, id: uid(), ordem: d.produtos.length }],
          }
        }),
      removerProduto: (id) => setDb((d) => ({ ...d, produtos: d.produtos.filter((x) => x.id !== id) })),

      // ---------- Clientes ----------
      salvarCliente: (c) => setDb((d) => ({ ...d, clientes: d.clientes.map((x) => (x.id === c.id ? { ...x, ...c } : x)) })),
      criarCliente: (c) => {
        const novo = { id: uid(), email: '', criadoEm: toISO(new Date()), ...c }
        setDb((d) => ({ ...d, clientes: [...d.clientes, novo] }))
        return novo
      },

      // ---------- Config / notificações ----------
      salvarConfig: (config) => setDb((d) => ({ ...d, config })),
      lerNotificacoes: () => setDb((d) => ({ ...d, notificacoes: d.notificacoes.map((n) => ({ ...n, lida: true })) })),
      resetar: () => setDb({ ...gerarSeed(), sessao: { tipo: 'admin' } }),
    }),
    []
  )

  // Derivados úteis
  const usuario = useMemo(() => {
    if (!db.sessao) return null
    if (db.sessao.tipo === 'admin') return { tipo: 'admin', nome: 'Arian', email: 'admin@arianbarber.com.br' }
    const c = db.clientes.find((x) => x.id === db.sessao.clienteId)
    return c ? { tipo: 'cliente', ...c } : null
  }, [db.sessao, db.clientes])

  const valor = useMemo(() => ({ db, usuario, avisar, toast, ...acoes }), [db, usuario, avisar, toast, acoes])
  return <StoreContext.Provider value={valor}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)

/** Pendências em aberto que bloqueiam o cliente de agendar. */
export const multasAbertasDe = (db, clienteId) =>
  db.multas.filter((m) => m.clienteId === clienteId && m.status === 'aberta' && m.bloqueia !== false)

/** Texto amigável de uma pendência (multa por falta ou débito manual). */
export const descricaoMulta = (m) => m.descricao || `Falta em ${dataBR(m.dataFalta)}`
