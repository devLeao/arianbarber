import { useState } from 'react'
import { Search } from 'lucide-react'
import Modal from '../ui/Modal'
import { Botao, Toggle } from './ui'
import { useStore } from '../../store/Store'
import { brl } from '../../lib/format'

/** Lança um débito manual na conta do cliente (ex.: corte não pago). */
export default function ModalDebito({ cliente: clienteFixo, onFechar }) {
  const { db, lancarDebito, avisar } = useStore()
  const [cliente, setCliente] = useState(clienteFixo || null)
  const [busca, setBusca] = useState('')
  const [sel, setSel] = useState(['corte'])
  const [valor, setValor] = useState('30')
  const [descricao, setDescricao] = useState('')
  const [bloqueia, setBloqueia] = useState(true)

  const servicos = db.servicos.filter((s) => s.ativo && s.preco != null)
  const sugestoes = busca.length >= 2 ? db.clientes.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase())).slice(0, 5) : []
  const nomesSel = sel.map((id) => servicos.find((s) => s.id === id)?.nome).filter(Boolean).join(' + ')

  const toggle = (id) => {
    const novo = sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]
    setSel(novo)
    setValor(String(novo.reduce((s, x) => s + (servicos.find((v) => v.id === x)?.preco ?? 0), 0)))
  }

  const salvar = () => {
    const v = Number(valor)
    if (!cliente) return avisar('Escolha o cliente.', 'erro')
    if (!(v > 0)) return avisar('Informe um valor.', 'erro')
    lancarDebito({
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      valor: v,
      descricao: descricao.trim() || `${nomesSel || 'Serviço'} não pago`,
      bloqueia,
    })
    avisar(`Débito de ${brl(v)} lançado para ${cliente.nome}.`)
    onFechar()
  }

  return (
    <Modal aberto onFechar={onFechar} titulo="Lançar débito" largura="max-w-lg"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao variante="pri" onClick={salvar}>Lançar débito</Botao></>}>
      <div className="space-y-5">
        <div className="relative">
          <label className="label">Cliente</label>
          {cliente ? (
            <div className="input flex items-center justify-between">
              <span>{cliente.nome}</span>
              {!clienteFixo && <button onClick={() => { setCliente(null); setBusca('') }} className="text-xs text-brass-400 cursor-pointer">trocar</button>}
            </div>
          ) : (
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-500" />
                <input className="input !pl-9" placeholder="Buscar cliente" value={busca} onChange={(e) => setBusca(e.target.value)} autoFocus />
              </div>
              {sugestoes.length > 0 && (
                <ul className="absolute z-10 left-0 right-0 mt-1 card shadow-xl overflow-hidden">
                  {sugestoes.map((c) => (
                    <li key={c.id}>
                      <button onClick={() => setCliente(c)} className="w-full text-left px-3 py-2 hover:bg-ink-700 text-sm cursor-pointer">
                        {c.nome} <span className="text-cream-500">{c.telefone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div>
          <label className="label">O que ficou devendo</label>
          <div className="flex flex-wrap gap-2">
            {servicos.map((s) => {
              const on = sel.includes(s.id)
              return (
                <button key={s.id} onClick={() => toggle(s.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer ${on ? 'bg-brass-500 text-ink-950 border-brass-500' : 'border-ink-500 text-cream-300 hover:border-cream-500'}`}>
                  {s.nome} <span className="opacity-70">· {brl(s.preco)}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-[140px_1fr] gap-3">
          <div>
            <label className="label">Valor (R$)</label>
            <input className="input tabular-nums" type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
          <div>
            <label className="label">Descrição (o cliente vê)</label>
            <input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder={`${nomesSel || 'Serviço'} não pago`} />
          </div>
        </div>

        <Toggle ligado={bloqueia} onChange={setBloqueia} rotulo="Bloquear novos agendamentos até pagar" />
      </div>
    </Modal>
  )
}
