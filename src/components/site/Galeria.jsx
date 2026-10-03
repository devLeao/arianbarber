import { TituloSecao } from '../ui/Ornamento'
import { Instagram } from '../ui/Icones'
import { useStore } from '../../store/Store'

const FOTOS = ['/img/galeria1.jpg', '/img/platinado.jpg', '/img/freestyle.jpg', '/img/colorido.jpg', '/img/luzes.jpg', '/img/tintura.jpg']

export default function Galeria() {
  const { db } = useStore()
  const insta = `https://www.instagram.com/${db.config.instagram}`
  return (
    <section id="galeria" className="py-24 md:py-32 bg-ink-850 border-y border-ink-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <TituloSecao sobre={`@${db.config.instagram}`} titulo="Nosso trabalho" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
          {FOTOS.map((src) => (
            <a key={src} href={insta} target="_blank" rel="noreferrer" className="relative overflow-hidden group">
              <img src={src} alt="Corte realizado na barbearia" loading="lazy" className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-ink-950/0 group-hover:bg-ink-950/50 transition-colors flex items-center justify-center">
                <Instagram size={32} className="text-cream-50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))}
        </div>
        <div className="text-center mt-10">
          <a href={insta} target="_blank" rel="noreferrer" className="btn-ghost"><Instagram size={16} /> Ver Instagram completo</a>
        </div>
      </div>
    </section>
  )
}
