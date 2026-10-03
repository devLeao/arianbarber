import { MapPin, Phone, Mail } from 'lucide-react'
import { TituloSecao } from '../ui/Ornamento'
import { WhatsApp, Instagram } from '../ui/Icones'
import Logo from '../ui/Logo'
import { useStore } from '../../store/Store'
import { DIAS } from '../../lib/format'

export function Contato() {
  const { db } = useStore()
  const { config } = db
  const ordem = [2, 3, 4, 5, 6, 0, 1]
  const hojeDia = new Date().getDay()
  const tel = config.whatsapp.replace(/^55(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')

  return (
    <section id="contato" className="py-24 md:py-32 bg-ink-900 grain">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <TituloSecao sobre="Venha nos visitar" titulo="Horários & contato" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="border border-ink-600 p-6 sm:p-8 bg-ink-850">
            <h3 className="font-label uppercase tracking-[0.25em] text-brass-400 text-sm mb-6">Funcionamento</h3>
            <ul>
              {ordem.map((d) => {
                const aberto = config.diasAbertos.includes(d)
                return (
                  <li key={d} className={`flex justify-between py-3 border-b border-dashed border-ink-600 last:border-0 ${d === hojeDia ? 'text-brass-300' : ''}`}>
                    <span className="text-cream-100">{DIAS[d]}{d === hojeDia && <span className="ml-2 text-[10px] font-label uppercase tracking-widest text-brass-400">hoje</span>}</span>
                    <span className={aberto ? 'font-label tracking-wider text-cream-50' : 'font-label tracking-wider text-wine-500'}>
                      {aberto ? `${config.abre} – ${config.fecha}` : 'Fechado'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="flex flex-col gap-6">
            <ul className="space-y-4">
              <Item icone={MapPin} titulo="Endereço" texto={`${config.endereco}, ${config.cidade}`} />
              <Item icone={Phone} titulo="WhatsApp" texto={tel} href={`https://wa.me/${config.whatsapp}`} />
              <Item icone={Mail} titulo="E-mail" texto="contato@arianbarber.com.br" />
            </ul>
            <iframe
              title="Mapa"
              className="w-full flex-1 min-h-56 border border-ink-600 grayscale invert-[0.9] contrast-[0.85]"
              loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(config.cidade)}&output=embed`}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

const Item = ({ icone: Icone, titulo, texto, href }) => (
  <li className="flex gap-4 items-start">
    <span className="h-11 w-11 shrink-0 border border-brass-500/40 flex items-center justify-center text-brass-400"><Icone size={18} /></span>
    <div>
      <div className="font-label uppercase tracking-[0.2em] text-xs text-cream-500">{titulo}</div>
      {href ? <a href={href} target="_blank" rel="noreferrer" className="text-cream-50 hover:text-brass-400">{texto}</a> : <div className="text-cream-50">{texto}</div>}
    </div>
  </li>
)

export function Rodape() {
  const { db } = useStore()
  return (
    <footer className="bg-ink-950 border-t border-ink-700 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo />
        <div className="flex gap-3">
          <a href={`https://www.instagram.com/${db.config.instagram}`} target="_blank" rel="noreferrer" className="h-10 w-10 border border-ink-600 flex items-center justify-center text-cream-300 hover:text-brass-400 hover:border-brass-500" aria-label="Instagram"><Instagram size={18} /></a>
          <a href={`https://wa.me/${db.config.whatsapp}`} target="_blank" rel="noreferrer" className="h-10 w-10 border border-ink-600 flex items-center justify-center text-cream-300 hover:text-brass-400 hover:border-brass-500" aria-label="WhatsApp"><WhatsApp size={18} /></a>
        </div>
        <p className="text-xs text-cream-700 text-center md:text-right">
          © {new Date().getFullYear()} Arian Barber · Todos os direitos reservados
          <br />Desenvolvido por <a href="https://devleao.netlify.app/" target="_blank" rel="noreferrer" className="text-cream-500 hover:text-brass-400">DevLeão</a>
        </p>
      </div>
    </footer>
  )
}
