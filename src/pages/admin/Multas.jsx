import { useState } from 'react'
import { Receipt, CheckCircle2, HandCoins, Ban, Zap, Plus } from 'lucide-react'
import { useStore, descricaoMulta } from '../../store/Store'
import ModalDebito from '../../components/admin/ModalDebito'
import { Cabecalho, Kpi, Abas, Status, Botao, Vazio, Avatar } from '../../components/admin/ui'
import { WhatsApp } from '../../components/ui/Icones'
import Modal from '../../components/ui/Modal'
import { brl, dataCurta, toISO } from '../../lib/format'

export default function Multas() {
  const { db, pagarMulta, perdoarMulta, avisar } = useStore()
  const [aba, setAba] = useState('aberta')
  const [confirmar, setConfirmar] = useState(null) // { tipo, multa }
  const [debito, setDebito] = useState(false)

  const hoje = new Date()
  const iniMes = toISO(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  const por = (s) => db.multas.filter((m) => m.status === s)
  const lista = (aba === 'todas' ? db.multas : por(aba)).slice().sort((a, b) => b.dataFalta.localeCompare(a.dataFalta))
  const soma = (arr) => arr.reduce((s, m) => s + m.valor, 0)
  const recebidoMes = soma(db.multas.filter((m) => m.status === 'paga' && m.pagaEm >= iniMes))
  const pagas = por('paga')
  const pctPix = pagas.length ? pagas.filter((m) => m.via === 'pix').length / pagas.length : 0

  const telDe = (id) => (db.clientes.find((c) => c.id === id)?.telefone || '').replace(/\D/g, '')
  const msgCobranca = (m) =>
    encodeURIComponent(
      `Olá, ${m.clienteNome.split(' ')[0]}! Tudo bem? Consta uma pendência de ${brl(m.valor)}: ${descricaoMulta(m)}. ` +
        `Você pode pagar pelo Pix direto no site (botão "Meus horários") e o agendamento é liberado na hora.`
    )

  return (
    <>
      <Cabecalho titulo="Multas e débitos" sub={`Faltas geram multa de ${db.config.multaPct}%. Débitos são valores lançados por você (ex.: corte não pago).`}>
        <Botao variante="pri" onClick={() => setDebito(true)}><Plus size={16} /> Lançar débito</Botao>
      </Cabecalho>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Kpi icone={Receipt} rotulo="Em aberto" valor={brl(soma(por('aberta')))} detalhe={`${por('aberta').length} pendência(s)`} tom="alerta" />
        <Kpi icone={HandCoins} rotulo="Recebido no mês" valor={brl(recebidoMes)} tom="bom" />
        <Kpi icone={CheckCircle2} rotulo="Recebido (total)" valor={brl(soma(pagas))} detalhe={`${Math.round(pctPix * 100)}% pagas via Pix no site`} />
        <Kpi icone={Ban} rotulo="Perdoadas" valor={brl(soma(por('perdoada')))} detalhe={`${por('perdoada').length} multa(s)`} />
      </div>

      <div className="card p-4 mb-5 flex gap-3 items-start border-brass-500/30">
        <Zap size={18} className="text-brass-400 shrink-0 mt-0.5" />
        <p className="text-sm text-cream-300">
          Quando o cliente paga pelo Pix no site, a pendência é baixada <strong className="text-cream-50">automaticamente</strong>, o acesso dele é liberado e você recebe uma notificação.
          Use "Marcar como paga" só para pagamentos feitos fora do site (dinheiro, Pix direto).
        </p>
      </div>

      <div className="mb-4">
        <Abas valor={aba} onChange={setAba} abas={[['aberta', 'Em aberto', por('aberta').length], ['paga', 'Pagas', pagas.length], ['perdoada', 'Perdoadas', por('perdoada').length], ['todas', 'Todas', db.multas.length]]} />
      </div>

      <div className="card divide-y divide-ink-600">
        {lista.length === 0 ? (
          <Vazio texto="Nada por aqui." />
        ) : (
          lista.map((m) => {
            const tel = telDe(m.clienteId)
            return (
              <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar nome={m.clienteNome} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-cream-50">{m.clienteNome}</span>
                      <Status s={m.status} />
                      {m.tipo === 'debito' && <span className="text-[11px] px-2 py-0.5 rounded-full border border-brass-500/40 text-brass-300">Débito</span>}
                    </div>
                    <div className="text-xs text-cream-500 mt-0.5">
                      {descricaoMulta(m)}
                      {m.status === 'paga' && ` · paga em ${dataCurta(m.pagaEm)} ${m.via === 'pix' ? 'via Pix (automático)' : '(manual)'}`}
                      {m.status === 'perdoada' && ` · perdoada em ${dataCurta(m.pagaEm)}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-between sm:justify-end pl-12 sm:pl-0">
                  <span className="text-lg font-semibold text-cream-50 tabular-nums sm:mr-3">{brl(m.valor)}</span>
                  {m.status === 'aberta' && (
                    <div className="flex gap-1">
                      {tel && (
                        <a href={`https://wa.me/55${tel}?text=${msgCobranca(m)}`} target="_blank" rel="noreferrer" title="Cobrar no WhatsApp"
                          className="p-2 rounded-lg text-[#25D366] hover:bg-ink-700"><WhatsApp size={18} /></a>
                      )}
                      <Botao variante="fantasma" className="!px-2.5" onClick={() => setConfirmar({ tipo: 'perdoar', m })}>Perdoar</Botao>
                      <Botao variante="ok" className="!px-2.5" onClick={() => setConfirmar({ tipo: 'pagar', m })}>Marcar paga</Botao>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <Modal
        aberto={!!confirmar}
        onFechar={() => setConfirmar(null)}
        titulo={confirmar?.tipo === 'pagar' ? 'Confirmar pagamento' : 'Perdoar pendência?'}
        rodape={
          <>
            <Botao onClick={() => setConfirmar(null)}>Voltar</Botao>
            <Botao
              variante={confirmar?.tipo === 'pagar' ? 'ok' : 'pri'}
              onClick={() => {
                if (confirmar.tipo === 'pagar') { pagarMulta(confirmar.m.id, 'manual'); avisar('Pendência baixada. Cliente liberado.') }
                else { perdoarMulta(confirmar.m.id); avisar('Pendência perdoada. Cliente liberado.') }
                setConfirmar(null)
              }}
            >
              Confirmar
            </Botao>
          </>
        }
      >
        {confirmar && (
          <p className="text-sm text-cream-300">
            {confirmar.tipo === 'pagar'
              ? `Confirma que ${confirmar.m.clienteNome} pagou ${brl(confirmar.m.valor)} fora do site?`
              : `${confirmar.m.clienteNome} ficará isento de ${brl(confirmar.m.valor)}.`}{' '}
            O cliente volta a poder agendar.
          </p>
        )}
      </Modal>
      {debito && <ModalDebito onFechar={() => setDebito(false)} />}
    </>
  )
}
