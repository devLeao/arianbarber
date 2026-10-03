import { useState } from 'react'
import { Save, RotateCcw, QrCode, ShieldCheck } from 'lucide-react'
import { useStore } from '../../store/Store'
import { Cabecalho, Botao } from '../../components/admin/ui'
import Modal from '../../components/ui/Modal'
import { DIAS_CURTOS } from '../../lib/format'
import { gerarSlots } from '../../lib/schedule'
import { CONFIG_PADRAO } from '../../data/seed'

export default function Configuracoes() {
  const { db, salvarConfig, resetar, avisar } = useStore()
  const [f, setF] = useState({ ...db.config })
  const [confirmarReset, setConfirmarReset] = useState(false)
  const set = (k, num = false) => (e) => setF({ ...f, [k]: num ? Number(e.target.value) : e.target.value })
  const toggleDia = (d) => setF({ ...f, diasAbertos: f.diasAbertos.includes(d) ? f.diasAbertos.filter((x) => x !== d) : [...f.diasAbertos, d].sort() })
  const alterado = JSON.stringify(f) !== JSON.stringify(db.config)

  return (
    <>
      <Cabecalho titulo="Configurações" sub="Regras da agenda, multa e dados da barbearia">
        <Botao variante="pri" disabled={!alterado} onClick={() => { salvarConfig(f); avisar('Configurações salvas.') }}><Save size={16} /> Salvar alterações</Botao>
      </Cabecalho>

      <div className="grid lg:grid-cols-2 gap-6">
        <Secao titulo="Funcionamento">
          <label className="label">Dias abertos</label>
          <div className="flex flex-wrap gap-2 mb-5">
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <button key={d} onClick={() => toggleDia(d)} className={`h-10 w-12 rounded-lg text-sm cursor-pointer ${f.diasAbertos.includes(d) ? 'bg-brass-500 text-ink-950 font-semibold' : 'bg-ink-700 text-cream-500 hover:bg-ink-600'}`}>
                {DIAS_CURTOS[d]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Abre às"><input type="time" className="input [color-scheme:dark]" value={f.abre} onChange={set('abre')} /></Campo>
            <Campo rotulo="Fecha às"><input type="time" className="input [color-scheme:dark]" value={f.fecha} onChange={set('fecha')} /></Campo>
            <Campo rotulo="Almoço de"><input type="time" className="input [color-scheme:dark]" value={f.almocoInicio} onChange={set('almocoInicio')} /></Campo>
            <Campo rotulo="Almoço até"><input type="time" className="input [color-scheme:dark]" value={f.almocoFim} onChange={set('almocoFim')} /></Campo>
            <Campo rotulo="Intervalo entre horários (min)"><input type="number" min="10" step="5" className="input" value={f.slotMin} onChange={set('slotMin', true)} /></Campo>
            <Campo rotulo="Agenda aberta para (dias)"><input type="number" min="1" className="input" value={f.diasAgendaAberta} onChange={set('diasAgendaAberta', true)} /></Campo>
          </div>
          <p className="text-xs text-cream-500 mt-3">{gerarSlots(f).length} horários por dia: {gerarSlots(f).slice(0, 4).join(', ')}…</p>
        </Secao>

        <Secao titulo="Cancelamento e multa">
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Cliente cancela até (horas antes)"><input type="number" min="0" className="input" value={f.antecedenciaCancelHoras} onChange={set('antecedenciaCancelHoras', true)} /></Campo>
            <Campo rotulo="Multa por falta (%)"><input type="number" min="0" max="100" className="input" value={f.multaPct} onChange={set('multaPct', true)} /></Campo>
          </div>
          <p className="text-xs text-cream-500 mt-3">
            Ex.: Corte + Barba (R$ 55,00) → multa de R$ {((55 * f.multaPct) / 100).toFixed(2).replace('.', ',')}. O cliente fica bloqueado até pagar.
          </p>

          <h4 className="text-sm font-medium text-cream-50 mt-6 mb-3 flex items-center gap-2"><QrCode size={16} className="text-brass-400" /> Recebimento via Pix</h4>
          <div className="grid gap-3">
            <Campo rotulo="Chave Pix"><input className="input" value={f.pixChave} onChange={set('pixChave')} /></Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Nome do recebedor"><input className="input" value={f.pixNome} onChange={set('pixNome')} /></Campo>
              <Campo rotulo="Cidade"><input className="input" value={f.pixCidade} onChange={set('pixCidade')} /></Campo>
            </div>
          </div>
        </Secao>

        <Secao titulo="Dados da barbearia">
          <div className="grid gap-3">
            <Campo rotulo="WhatsApp (com DDI e DDD, só números)"><input className="input" value={f.whatsapp} onChange={set('whatsapp')} /></Campo>
            <Campo rotulo="Instagram (sem @)"><input className="input" value={f.instagram} onChange={set('instagram')} /></Campo>
            <Campo rotulo="Endereço"><input className="input" value={f.endereco} onChange={set('endereco')} /></Campo>
            <Campo rotulo="Cidade"><input className="input" value={f.cidade} onChange={set('cidade')} /></Campo>
          </div>
        </Secao>

        <Secao titulo="Integrações (próxima fase)">
          <ul className="space-y-4 text-sm">
            <Integracao icone={QrCode} titulo="Pix com confirmação automática" texto="Cobrança gerada pelo Mercado Pago / Asaas. Quando o banco confirma, a multa é baixada e o cliente liberado sozinho." />
            <Integracao icone={ShieldCheck} titulo="Login com Google (Firebase)" texto="Autenticação real e dados salvos na nuvem, acessíveis de qualquer aparelho." />
          </ul>
          <div className="mt-6 pt-5 border-t border-ink-600">
            <Botao variante="fantasma" className="!text-red-400" onClick={() => setConfirmarReset(true)}><RotateCcw size={15} /> Resetar dados de exemplo</Botao>
          </div>
        </Secao>
      </div>

      <Modal aberto={confirmarReset} onFechar={() => setConfirmarReset(false)} titulo="Resetar protótipo?"
        rodape={<><Botao onClick={() => setConfirmarReset(false)}>Voltar</Botao><Botao variante="perigo" onClick={() => { resetar(); setConfirmarReset(false); setF({ ...CONFIG_PADRAO }); avisar('Dados de exemplo recriados.') }}>Resetar</Botao></>}>
        <p className="text-sm text-cream-300">Apaga tudo o que foi feito no protótipo e gera os dados fictícios de novo.</p>
      </Modal>
    </>
  )
}

const Secao = ({ titulo, children }) => (
  <section className="card p-5">
    <h3 className="text-sm font-medium text-cream-50 mb-4">{titulo}</h3>
    {children}
  </section>
)
const Campo = ({ rotulo, children }) => (
  <div>
    <label className="label">{rotulo}</label>
    {children}
  </div>
)
const Integracao = ({ icone: Ic, titulo, texto }) => (
  <li className="flex gap-3">
    <span className="h-8 w-8 rounded-lg bg-ink-700 text-brass-400 flex items-center justify-center shrink-0"><Ic size={16} /></span>
    <div>
      <div className="text-cream-50 flex items-center gap-2">{titulo} <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-600 text-cream-500">fase 2</span></div>
      <div className="text-cream-500 text-xs mt-0.5">{texto}</div>
    </div>
  </li>
)
