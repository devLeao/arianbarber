import { useState } from 'react'
import { Plus, Pencil, Trash2, Clock, Package } from 'lucide-react'
import { useStore } from '../../store/Store'
import { Cabecalho, Abas, Botao, Toggle } from '../../components/admin/ui'
import Modal from '../../components/ui/Modal'
import { ICONES_PRODUTO } from '../../components/site/Produtos'
import { brl, precoLabel } from '../../lib/format'

const IMAGENS = ['corte', 'barba', 'freestyle', 'pigmentacao', 'luzes', 'reflexo', 'platinado', 'colorido', 'tintura'].map((n) => `/img/${n}.jpg`)

export default function Catalogo() {
  const { db, salvarServico, salvarProduto } = useStore()
  const [aba, setAba] = useState('servicos')
  const [editando, setEditando] = useState(null)

  const servicos = db.servicos.slice().sort((a, b) => a.ordem - b.ordem)
  const produtos = db.produtos.slice().sort((a, b) => a.ordem - b.ordem)

  const novo = () =>
    setEditando(
      aba === 'servicos'
        ? { nome: '', preco: 0, duracao: 40, desc: '', img: IMAGENS[0], ativo: true }
        : { nome: '', preco: 0, categoria: 'Finalização', estoque: 0, icone: 'package', desc: '', ativo: true }
    )

  return (
    <>
      <Cabecalho titulo="Serviços & produtos" sub="O que aparece no site e na agenda">
        <Botao variante="pri" onClick={novo}><Plus size={16} /> {aba === 'servicos' ? 'Novo serviço' : 'Novo produto'}</Botao>
      </Cabecalho>
      <div className="mb-4">
        <Abas valor={aba} onChange={setAba} abas={[['servicos', 'Serviços', servicos.length], ['produtos', 'Produtos', produtos.length]]} />
      </div>

      {aba === 'servicos' ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {servicos.map((s) => (
            <div key={s.id} className={`card p-3 flex gap-3 ${s.ativo ? '' : 'opacity-50'}`}>
              <img src={s.img} alt="" className="h-20 w-20 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-cream-50 font-medium">{s.nome}</div>
                  <button onClick={() => setEditando(s)} className="p-1.5 -m-1 rounded-md text-cream-500 hover:text-cream-50 hover:bg-ink-700 cursor-pointer" aria-label="Editar"><Pencil size={15} /></button>
                </div>
                <div className="text-sm text-brass-300 tabular-nums">{precoLabel(s)}</div>
                <div className="text-xs text-cream-500 flex items-center gap-1 mt-1"><Clock size={12} /> {s.duracao} min {!s.ativo && '· oculto no site'}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs text-cream-500 border-b border-ink-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">Produto</th>
                <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Categoria</th>
                <th className="text-right font-medium px-4 py-3">Preço</th>
                <th className="text-right font-medium px-4 py-3">Estoque</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600">
              {produtos.map((p) => {
                const Ic = ICONES_PRODUTO[p.icone] || Package
                return (
                  <tr key={p.id} className={p.ativo ? '' : 'opacity-50'}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-9 w-9 rounded-lg bg-ink-700 text-brass-400 flex items-center justify-center shrink-0"><Ic size={16} /></span>
                        <span className="text-cream-50">{p.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-cream-300 hidden sm:table-cell">{p.categoria}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{brl(p.preco)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${p.estoque === 0 ? 'text-red-400' : p.estoque < 5 ? 'text-orange-300' : 'text-cream-300'}`}>
                      {p.estoque === 0 ? 'Esgotado' : p.estoque}
                    </td>
                    <td className="pr-3">
                      <button onClick={() => setEditando(p)} className="p-1.5 rounded-md text-cream-500 hover:text-cream-50 hover:bg-ink-700 cursor-pointer" aria-label="Editar"><Pencil size={15} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <Editor
          tipo={aba}
          item={editando}
          onFechar={() => setEditando(null)}
          onSalvar={(x) => { (aba === 'servicos' ? salvarServico : salvarProduto)(x); setEditando(null) }}
        />
      )}
    </>
  )
}

function Editor({ tipo, item, onFechar, onSalvar }) {
  const { removerServico, removerProduto, avisar } = useStore()
  const [f, setF] = useState({ ...item })
  const [aCombinar, setACombinar] = useState(item.preco == null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const servico = tipo === 'servicos'

  const salvar = () => {
    if (!f.nome.trim()) return avisar('Informe o nome.', 'erro')
    onSalvar({
      ...f,
      preco: aCombinar ? null : Number(f.preco),
      ...(servico ? { duracao: Number(f.duracao) } : { estoque: Number(f.estoque) }),
    })
    avisar('Salvo.')
  }
  const remover = () => {
    ;(servico ? removerServico : removerProduto)(item.id)
    avisar('Removido.')
    onFechar()
  }

  return (
    <Modal aberto onFechar={onFechar} titulo={item.id ? `Editar ${servico ? 'serviço' : 'produto'}` : `Novo ${servico ? 'serviço' : 'produto'}`} largura="max-w-lg"
      rodape={
        <div className="flex justify-between w-full">
          {item.id ? <Botao variante="fantasma" className="!text-red-400" onClick={remover}><Trash2 size={15} /> Excluir</Botao> : <span />}
          <div className="flex gap-2"><Botao onClick={onFechar}>Cancelar</Botao><Botao variante="pri" onClick={salvar}>Salvar</Botao></div>
        </div>
      }>
      <div className="space-y-4">
        <div><label className="label">Nome</label><input className="input" value={f.nome} onChange={set('nome')} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Preço (R$)</label>
            <input className="input tabular-nums" type="number" step="0.01" min="0" value={aCombinar ? '' : f.preco ?? ''} disabled={aCombinar} onChange={set('preco')} />
            {servico && <label className="flex items-center gap-2 text-xs text-cream-300 mt-2 cursor-pointer"><input type="checkbox" checked={aCombinar} onChange={(e) => setACombinar(e.target.checked)} className="accent-brass-500" /> A combinar</label>}
          </div>
          {servico ? (
            <div><label className="label">Duração (min)</label><input className="input" type="number" step="5" min="5" value={f.duracao} onChange={set('duracao')} /></div>
          ) : (
            <div><label className="label">Estoque</label><input className="input" type="number" min="0" value={f.estoque} onChange={set('estoque')} /></div>
          )}
        </div>
        {!servico && (
          <div><label className="label">Categoria</label><input className="input" value={f.categoria} onChange={set('categoria')} list="cats" />
            <datalist id="cats">{['Finalização', 'Barba', 'Cabelo', 'Tratamento', 'Acessórios'].map((c) => <option key={c} value={c} />)}</datalist>
          </div>
        )}
        <div><label className="label">Descrição</label><textarea className="input min-h-20" value={f.desc} onChange={set('desc')} /></div>
        {servico ? (
          <div>
            <label className="label">Foto</label>
            <div className="grid grid-cols-5 gap-2">
              {IMAGENS.map((src) => (
                <button key={src} onClick={() => setF({ ...f, img: src })} className={`rounded-lg overflow-hidden ring-2 cursor-pointer ${f.img === src ? 'ring-brass-500' : 'ring-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={src} alt="" className="aspect-square object-cover w-full" />
                </button>
              ))}
            </div>
            <p className="text-xs text-cream-700 mt-2">Na versão final dá pra enviar foto própria.</p>
          </div>
        ) : (
          <div>
            <label className="label">Ícone (até ter foto real)</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ICONES_PRODUTO).map(([k, Ic]) => (
                <button key={k} onClick={() => setF({ ...f, icone: k })} className={`h-10 w-10 rounded-lg flex items-center justify-center cursor-pointer ${f.icone === k ? 'bg-brass-500 text-ink-950' : 'bg-ink-700 text-cream-300 hover:bg-ink-600'}`}>
                  <Ic size={18} />
                </button>
              ))}
            </div>
          </div>
        )}
        <Toggle ligado={f.ativo} onChange={(v) => setF({ ...f, ativo: v })} rotulo="Visível no site" />
      </div>
    </Modal>
  )
}
