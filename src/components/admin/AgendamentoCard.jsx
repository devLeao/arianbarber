import { useState } from 'react'
import { Check, Pencil, UserX, Trash2, Unlock, RotateCcw, AlertTriangle } from 'lucide-react'
import Modal from '../ui/Modal'
import { WhatsApp } from '../ui/Icones'
import { Status, Botao } from './ui'
import { useStore } from '../../store/Store'
import { brl, fromMin, toMin, dataLonga, precoLabel } from '../../lib/format'

export function AgendamentoCard({ ag, onAcao, compacto = false }) {
  const fim = fromMin(toMin(ag.hora) + ag.duracao)
  const bloqueio = ag.status === 'bloqueio'
  const tel = (ag.clienteTelefone || '').replace(/\D/g, '')
  const podeDesfazer = (ag.status === 'concluido' || ag.status === 'cancelado') && !compacto
  const temAcoes = bloqueio || ag.status === 'agendado'
  const borda = {
    agendado: 'border-l-sky-400',
    concluido: 'border-l-emerald-400',
    falta: 'border-l-red-400',
    cancelado: 'border-l-ink-500',
    bloqueio: 'border-l-ink-500',
  }[ag.status]

  return (
    <div className={`relative card border-l-4 ${borda} p-3 sm:p-4 ${podeDesfazer ? 'pr-12 sm:pr-4' : ''} flex flex-col sm:flex-row sm:items-center gap-3 ${ag.status === 'cancelado' ? 'opacity-60' : ''} ${bloqueio ? 'bg-[repeating-linear-gradient(135deg,transparent,transparent_8px,rgba(255,255,255,0.02)_8px,rgba(255,255,255,0.02)_16px)]' : ''}`}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-14 shrink-0 tabular-nums">
          <div className="text-cream-50 font-semibold">{ag.diaInteiro ? 'Dia' : ag.hora}</div>
          <div className="text-xs text-cream-500">{ag.diaInteiro ? 'inteiro' : fim}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-cream-50 font-medium truncate">{bloqueio ? ag.motivo || 'Horário bloqueado' : ag.clienteNome}</span>
            <Status s={ag.status} />
          </div>
          {!bloqueio && (
            <div className="text-sm text-cream-500 mt-0.5 flex flex-wrap gap-x-3">
              <span>{ag.servicoNomes}</span>
              <span className="text-cream-300 tabular-nums">{brl(ag.total)}</span>
              {!compacto && ag.clienteTelefone && <span className="tabular-nums">{ag.clienteTelefone}</span>}
            </div>
          )}
        </div>
      </div>

      <div className={`${temAcoes ? 'flex' : 'hidden'} items-center gap-1 sm:justify-end -ml-1 sm:ml-0 pl-14 sm:pl-0`}>
        {bloqueio && (
          <Botao variante="fantasma" onClick={() => onAcao('liberar', ag)} className="!px-2.5 !py-1.5"><Unlock size={16} /> Liberar</Botao>
        )}
        {ag.status === 'agendado' && (
          <>
            {tel && (
              <a href={`https://wa.me/55${tel}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-[#25D366] hover:bg-ink-700" title="WhatsApp">
                <WhatsApp size={18} />
              </a>
            )}
            <IconeAcao titulo="Atendido" cor="text-emerald-400" onClick={() => onAcao('concluir', ag)}><Check size={18} /></IconeAcao>
            <IconeAcao titulo="Editar serviços" cor="text-sky-300" onClick={() => onAcao('editar', ag)}><Pencil size={16} /></IconeAcao>
            <IconeAcao titulo="Não compareceu" cor="text-orange-400" onClick={() => onAcao('falta', ag)}><UserX size={18} /></IconeAcao>
            <IconeAcao titulo="Cancelar" cor="text-red-400" onClick={() => onAcao('cancelar', ag)}><Trash2 size={17} /></IconeAcao>
          </>
        )}
      </div>
      {/* "Desfazer" fica no canto, sem ocupar uma linha inteira no celular */}
      {podeDesfazer && (
        <div className="absolute top-2 right-2 sm:static">
          <IconeAcao titulo="Desfazer (voltar para agendado)" cor="text-cream-500" onClick={() => onAcao('reabrir', ag)}><RotateCcw size={16} /></IconeAcao>
        </div>
      )}
    </div>
  )
}

const IconeAcao = ({ titulo, cor, onClick, children }) => (
  <button onClick={onClick} title={titulo} aria-label={titulo} className={`p-2 rounded-lg ${cor} hover:bg-ink-700 cursor-pointer`}>
    {children}
  </button>
)

/** Modais de confirmação das ações sobre um agendamento. */
export function ModaisAgendamento({ acao, onFechar }) {
  const { db, concluirAgendamento, ajustarValor, marcarFalta, cancelarAgendamento, editarServicosAgendamento, avisar } = useStore()
  const [valor, setValor] = useState('')
  const [sel, setSel] = useState([])
  const [ultimo, setUltimo] = useState(null)

  const ag = acao?.ag
  // sincroniza o estado do formulário quando abre outra ação
  if (acao && ultimo !== acao) {
    setUltimo(acao)
    setValor(ag ? String(ag.total) : '')
    setSel(ag?.servicoIds || [])
  }
  if (!acao || !ag) return null

  const tipo = acao.tipo
  const fazer = (fn, msg) => { fn(); avisar(msg); onFechar() }

  if (tipo === 'concluir')
    return (
      <Modal aberto onFechar={onFechar} titulo="Confirmar atendimento"
        rodape={<><Botao onClick={onFechar}>Voltar</Botao><Botao variante="ok" onClick={() => fazer(() => { if (Number(valor) !== ag.total) ajustarValor(ag.id, Number(valor)); concluirAgendamento(ag.id) }, 'Atendimento concluído.')}><Check size={16} /> Concluir</Botao></>}>
        <p className="text-sm text-cream-300 mb-4"><strong className="text-cream-50">{ag.clienteNome}</strong> compareceu e realizou {ag.servicoNomes}?</p>
        <label className="label">Valor recebido (R$)</label>
        <input className="input tabular-nums" type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} />
        <p className="text-xs text-cream-500 mt-2">Ajuste se cobrou diferente (ex.: freestyle "a combinar", desconto).</p>
      </Modal>
    )

  if (tipo === 'falta') {
    const multa = Math.round(ag.total * db.config.multaPct) / 100
    return (
      <Modal aberto onFechar={onFechar} titulo="Marcar falta?"
        rodape={<><Botao onClick={onFechar}>Voltar</Botao><Botao variante="perigo" onClick={() => fazer(() => marcarFalta(ag.id), 'Falta registrada e multa gerada.')}><UserX size={16} /> Confirmar falta</Botao></>}>
        <div className="flex gap-3 items-start">
          <AlertTriangle className="text-orange-400 shrink-0" size={22} />
          <div className="text-sm text-cream-300 space-y-2">
            <p><strong className="text-cream-50">{ag.clienteNome}</strong> não compareceu em {dataLonga(ag.data)} às {ag.hora}.</p>
            <p>Será gerada uma multa de <strong className="text-cream-50">{brl(multa)}</strong> ({db.config.multaPct}% de {brl(ag.total)}). O cliente só volta a agendar depois de pagar.</p>
            <p>O horário fica livre para encaixar outro cliente.</p>
          </div>
        </div>
      </Modal>
    )
  }

  if (tipo === 'cancelar') {
    const multa = Math.round(ag.total * db.config.multaPct) / 100
    return (
      <Modal aberto onFechar={onFechar} titulo="Cancelar agendamento" largura="max-w-lg">
        <p className="text-sm text-cream-300 mb-5">
          <strong className="text-cream-50">{ag.clienteNome}</strong> · {ag.servicoNomes} em {dataLonga(ag.data)} às {ag.hora}.
          Nos dois casos o horário volta a ficar livre na agenda.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            onClick={() => fazer(() => cancelarAgendamento(ag.id), 'Agendamento cancelado. Horário liberado.')}
            className="text-left rounded-xl border border-ink-500 hover:border-cream-500 p-4 cursor-pointer"
          >
            <div className="text-cream-50 font-medium mb-1">Cancelar sem multa</div>
            <div className="text-xs text-cream-500">Cliente avisou com antecedência ou foi você que desmarcou.</div>
          </button>
          <button
            onClick={() => fazer(() => marcarFalta(ag.id, 'cancelou_tarde'), `Horário liberado e multa de ${brl(multa)} gerada.`)}
            className="text-left rounded-xl border border-orange-500/40 bg-orange-500/5 hover:border-orange-400 p-4 cursor-pointer"
          >
            <div className="text-orange-300 font-medium mb-1">Cancelar com multa de {brl(multa)}</div>
            <div className="text-xs text-cream-500">Avisou em cima da hora ou não vem. Libera o horário e cobra {db.config.multaPct}%.</div>
          </button>
        </div>
      </Modal>
    )
  }

  if (tipo === 'liberar')
    return (
      <Modal aberto onFechar={onFechar} titulo="Liberar horário?"
        rodape={<><Botao onClick={onFechar}>Voltar</Botao><Botao variante="pri" onClick={() => fazer(() => cancelarAgendamento(ag.id), 'Horário liberado.')}>Liberar</Botao></>}>
        <p className="text-sm text-cream-300">O horário das {ag.hora} ficará disponível para os clientes.</p>
      </Modal>
    )

  if (tipo === 'editar') {
    const itens = sel.map((id) => db.servicos.find((s) => s.id === id)).filter(Boolean)
    return (
      <Modal aberto onFechar={onFechar} titulo="Editar serviços"
        rodape={<><Botao onClick={onFechar}>Voltar</Botao><Botao variante="pri" disabled={!sel.length} onClick={() => fazer(() => editarServicosAgendamento(ag.id, sel), 'Serviços atualizados.')}>Salvar</Botao></>}>
        <p className="text-sm text-cream-500 mb-3">{ag.clienteNome} · {ag.hora}</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {db.servicos.map((s) => {
            const on = sel.includes(s.id)
            return (
              <button key={s.id} onClick={() => setSel(on ? sel.filter((x) => x !== s.id) : [...sel, s.id])}
                className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer ${on ? 'bg-brass-500 text-ink-950 border-brass-500' : 'border-ink-500 text-cream-300 hover:border-cream-500'}`}>
                {s.nome} <span className="opacity-70">· {precoLabel(s)}</span>
              </button>
            )
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-ink-900 rounded-lg p-3"><div className="text-xs text-cream-500">Nova duração</div><div className="text-lg font-semibold text-cream-50">{itens.reduce((s, i) => s + i.duracao, 0)} min</div></div>
          <div className="bg-ink-900 rounded-lg p-3"><div className="text-xs text-cream-500">Novo valor</div><div className="text-lg font-semibold text-cream-50">{brl(itens.reduce((s, i) => s + (i.preco ?? 0), 0))}</div></div>
        </div>
      </Modal>
    )
  }
  return null
}

/** Hook: devolve o handler de ações e o elemento dos modais. */
export function useAcoesAgendamento() {
  const { reabrirAgendamento, avisar } = useStore()
  const [acao, setAcao] = useState(null)
  const onAcao = (tipo, ag) => {
    if (tipo === 'reabrir') {
      reabrirAgendamento(ag.id)
      avisar('Agendamento voltou para "agendado".')
      return
    }
    setAcao({ tipo, ag })
  }
  return [onAcao, <ModaisAgendamento acao={acao} onFechar={() => setAcao(null)} />]
}
