import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, ShieldCheck, Loader2, Trash2, AlertTriangle, CheckCircle2, UserPlus, Crown, QrCode } from 'lucide-react'
import Modal from '../ui/Modal'
import { useStore, multasAbertasDe, descricaoMulta } from '../../store/Store'
import { brl, dataCurta, dataLonga, iniciais } from '../../lib/format'
import { minutosAte } from '../../lib/schedule'
import { gerarPix } from '../../lib/pix'

// ---------------------------------------------------------------------------
// Login: no protótipo simula o seletor de contas do Google.
// Na fase 2 vira signInWithPopup(auth, new GoogleAuthProvider()).
// ---------------------------------------------------------------------------
export function LoginModal({ aberto, onFechar }) {
  const { db, entrarComoCliente, entrarComoNovoCliente, entrarComoAdmin } = useStore()
  const [novo, setNovo] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const contas = ['demo', 'devedor'].map((id) => db.clientes.find((c) => c.id === id)).filter(Boolean)

  const fechar = () => { setNovo(false); onFechar() }
  const Conta = ({ onClick, avatar, titulo, sub, destaque }) => (
    <button onClick={() => { onClick(); fechar() }} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-ink-700 text-left cursor-pointer">
      <span className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${destaque || 'bg-ink-600 text-cream-100'}`}>{avatar}</span>
      <span className="min-w-0">
        <span className="block text-cream-50 text-sm font-medium truncate">{titulo}</span>
        <span className="block text-cream-500 text-xs truncate">{sub}</span>
      </span>
    </button>
  )

  return (
    <Modal aberto={aberto} onFechar={fechar} titulo="Entrar com Google">
      <div className="mb-4 text-xs bg-brass-500/10 border border-brass-500/30 text-brass-300 rounded-md px-3 py-2">
        Protótipo: o login real com Google entra na fase 2. Escolha uma conta de teste.
      </div>
      {!novo ? (
        <div className="space-y-1">
          {contas.map((c) => (
            <Conta key={c.id} onClick={() => entrarComoCliente(c.id)} avatar={iniciais(c.nome)} titulo={c.nome}
              sub={c.id === 'devedor' ? `${c.email} · tem pendência em aberto` : c.email} />
          ))}
          <Conta onClick={entrarComoAdmin} avatar={<Crown size={16} />} titulo="Arian (administrador)" sub="Acesso ao painel" destaque="bg-brass-500 text-ink-950" />
          <button onClick={() => setNovo(true)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-ink-700 text-left text-cream-300 text-sm cursor-pointer">
            <span className="h-10 w-10 rounded-full border border-dashed border-ink-500 flex items-center justify-center"><UserPlus size={16} /></span>
            Usar outra conta
          </button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); if (nome && email) { entrarComoNovoCliente(nome, email); fechar() } }}
        >
          <div><label className="label">Nome</label><input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required /></div>
          <div><label className="label">E-mail Google</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setNovo(false)} className="btn-ghost !py-2">Voltar</button>
            <button className="btn-brass !py-2">Entrar</button>
          </div>
        </form>
      )}
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Pagamento das pendências (multas e débitos) via Pix, todas de uma vez
// ---------------------------------------------------------------------------
export function PagarMultaModal({ pendencias, onFechar }) {
  const { db, pagarMulta } = useStore()
  const [copiado, setCopiado] = useState(false)
  const [pago, setPago] = useState(false)
  if (!pendencias?.length) return null
  const total = pendencias.reduce((s, m) => s + m.valor, 0)

  const { config } = db
  const codigo = gerarPix({
    chave: config.pixChave,
    nome: config.pixNome,
    cidade: config.pixCidade,
    valor: total,
    txid: `PEND${pendencias[0].id}`,
  })

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* navegador sem permissão de clipboard */
    }
  }

  const fechar = () => { setPago(false); onFechar() }

  return (
    <Modal aberto onFechar={fechar} titulo={pago ? 'Pagamento confirmado' : 'Pagar com Pix'}>
      {pago ? (
        <div className="text-center py-4 animate-fade-up">
          <CheckCircle2 size={56} className="text-emerald-400 mx-auto mb-4" />
          <p className="text-cream-50 text-lg font-semibold mb-2">Tudo certo! Acesso liberado.</p>
          <p className="text-sm text-cream-300 mb-6">O barbeiro foi avisado do pagamento. Você já pode agendar normalmente.</p>
          <a href="#agendar" onClick={fechar} className="btn-brass">Agendar agora</a>
        </div>
      ) : (
        <div className="text-center">
          <ul className="text-sm text-cream-300 mb-1 space-y-0.5">{pendencias.map((m) => <li key={m.id}>{descricaoMulta(m)}</li>)}</ul>
          <p className="font-display text-4xl font-extrabold text-cream-50 mb-5">{brl(total)}</p>
          <div className="bg-white p-4 rounded-lg inline-block mb-4">
            <QRCodeSVG value={codigo} size={200} level="M" />
          </div>
          <p className="text-xs text-cream-500 mb-2">Abra o app do seu banco, escolha Pix → Ler QR Code, ou use o copia e cola:</p>
          {/* Texto (e não <input>) para o iPhone não dar zoom ao tocar */}
          <div className="flex gap-2 mb-5 min-w-0">
            <div className="flex-1 min-w-0 bg-ink-900 border border-ink-500 rounded-md px-3 py-2.5 text-xs font-mono text-cream-300 truncate select-all text-left">
              {codigo}
            </div>
            <button onClick={copiar} className="btn-brass !px-3 !py-2 shrink-0 !text-xs !tracking-wider" title="Copiar">
              {copiado ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar</>}
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-cream-300 mb-5">
            <Loader2 size={16} className="animate-spin text-brass-400" /> Aguardando pagamento...
          </div>
          <div className="border-t border-ink-600 pt-4">
            <button onClick={() => { pagarMulta(pendencias.map((m) => m.id), 'pix'); setPago(true) }} className="text-xs text-brass-400 hover:text-brass-300 underline underline-offset-4 cursor-pointer">
              [Protótipo] Simular confirmação do pagamento
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Meus horários (área do cliente)
// ---------------------------------------------------------------------------
const STATUS_INFO = {
  agendado: ['Agendado', 'text-brass-300 border-brass-500/40 bg-brass-500/10'],
  concluido: ['Concluído', 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'],
  cancelado: ['Cancelado', 'text-cream-500 border-ink-500 bg-ink-700'],
  falta: ['Falta', 'text-red-300 border-red-500/40 bg-red-500/10'],
}

export function MinhaContaModal({ aberto, onFechar, onPagarMulta }) {
  const { db, usuario, cancelarAgendamento, avisar } = useStore()
  const [confirmar, setConfirmar] = useState(null)
  if (!aberto || usuario?.tipo !== 'cliente') return null

  const meus = db.agendamentos.filter((a) => a.clienteId === usuario.id)
  const futuros = meus.filter((a) => a.status === 'agendado' && minutosAte(a) > -60).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))
  const historico = meus.filter((a) => !futuros.includes(a)).sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora)).slice(0, 8)
  const multas = multasAbertasDe(db, usuario.id)
  const limite = db.config.antecedenciaCancelHoras * 60

  return (
    <Modal aberto onFechar={onFechar} titulo="Meus horários" largura="max-w-lg">
      {multas.length > 0 && (
        <div className="mb-6 border border-red-500/40 bg-red-500/10 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="text-red-400 shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-sm text-cream-50 font-medium">Pendência em aberto: {brl(multas.reduce((s, m) => s + m.valor, 0))}</p>
            <p className="text-xs text-cream-300 mt-0.5">{multas.map(descricaoMulta).join(" · ")}. Pague para voltar a agendar.</p>
            <button onClick={() => { onFechar(); onPagarMulta(multas) }} className="btn-brass !py-1.5 !px-3 !text-xs mt-3"><QrCode size={14} /> Pagar com Pix</button>
          </div>
        </div>
      )}

      <h4 className="font-label uppercase tracking-[0.2em] text-xs text-brass-400 mb-3">Próximos</h4>
      {futuros.length === 0 ? (
        <p className="text-sm text-cream-500 mb-6">Você não tem horários marcados.</p>
      ) : (
        <ul className="space-y-2 mb-6">
          {futuros.map((a) => {
            const podeCancelar = minutosAte(a) > limite
            return (
              <li key={a.id} className="bg-ink-900 border border-ink-600 rounded-lg p-4 flex items-center gap-4">
                <div className="text-center w-14 shrink-0">
                  <div className="font-display text-2xl font-bold text-cream-50 leading-none">{a.data.slice(8)}</div>
                  <div className="font-label text-xs uppercase text-cream-500">{dataCurta(a.data).split(' ')[1]}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-cream-50 font-medium truncate">{a.servicoNomes}</div>
                  <div className="text-xs text-cream-500">{a.hora} · {brl(a.total)}</div>
                </div>
                {podeCancelar ? (
                  <button onClick={() => setConfirmar(a)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer" title="Cancelar"><Trash2 size={18} /></button>
                ) : (
                  <span className="text-[10px] font-label uppercase tracking-wider text-orange-400 text-right leading-tight" title={`Menos de ${db.config.antecedenciaCancelHoras}h para o horário. Fale com o barbeiro.`}>
                    Não<br />cancelável
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <h4 className="font-label uppercase tracking-[0.2em] text-xs text-brass-400 mb-3">Histórico</h4>
      {historico.length === 0 ? (
        <p className="text-sm text-cream-500">Nenhum atendimento ainda.</p>
      ) : (
        <ul className="divide-y divide-ink-600">
          {historico.map((a) => {
            const [txt, cls] = STATUS_INFO[a.status] || STATUS_INFO.agendado
            return (
              <li key={a.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="text-cream-100 truncate">{a.servicoNomes}</div>
                  <div className="text-xs text-cream-500">{dataCurta(a.data)} · {a.hora}</div>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded border ${cls}`}>{txt}</span>
              </li>
            )
          })}
        </ul>
      )}

      <p className="flex items-center gap-2 text-[11px] text-cream-700 mt-6">
        <ShieldCheck size={14} /> Cancelamento grátis até {db.config.antecedenciaCancelHoras}h antes. Faltas geram multa de {db.config.multaPct}%.
      </p>

      <Modal
        aberto={!!confirmar}
        onFechar={() => setConfirmar(null)}
        titulo="Cancelar horário?"
        rodape={
          <>
            <button onClick={() => setConfirmar(null)} className="btn-ghost !py-2">Voltar</button>
            <button
              onClick={() => { cancelarAgendamento(confirmar.id, true); setConfirmar(null); avisar('Horário cancelado.') }}
              className="btn !py-2 bg-red-600 text-white hover:bg-red-500"
            >
              Sim, cancelar
            </button>
          </>
        }
      >
        {confirmar && (
          <p className="text-cream-300 text-sm">
            {confirmar.servicoNomes} em {dataLonga(confirmar.data)} às {confirmar.hora}. O horário ficará livre para outros clientes.
          </p>
        )}
      </Modal>
    </Modal>
  )
}
