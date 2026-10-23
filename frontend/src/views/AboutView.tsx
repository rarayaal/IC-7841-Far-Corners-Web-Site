import React from 'react';
import { Language, PageView } from '../types';
import { projectsData } from '../data/mockData';
import { Globe, Heart, Users, Lightbulb, Feather } from 'lucide-react';
import { useInstitutionalContent } from '../hooks/useInstitutionalContent';
import { ContentParagraphs } from '../components/ContentParagraphs';

interface AboutViewProps {
  language: Language;
  setCurrentPage: (page: PageView) => void;
  onOpenDonate: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({
  language,
  setCurrentPage,
  onOpenDonate,
}) => {
  const { items: historyItems } = useInstitutionalContent('history', language);
  const { items: impactItems } = useInstitutionalContent('impact', language);
  const { items: futureItems } = useInstitutionalContent('future', language);

  const history = historyItems[0];
  const futureVision = futureItems[0];

  // Las rutas internas del botón (/donate) usan la navegación del sitio; el resto son enlaces.
  const openCta = (target: string) => {
    const page = target.replace(/^\//, '') as PageView;
    if (target.startsWith('/') && ['home', 'about', 'shows', 'participate', 'donate', 'contact'].includes(page)) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.open(target, '_blank', 'noopener,noreferrer');
    }
  };

  const brandValues = [
    { title: 'Comunidad', desc: 'Creamos experiencias escénicas que fortalecen el tejido comunitario y celebran la diversidad.', color: '#008047', icon: Users },
    { title: 'Creatividad', desc: 'Fomentamos la imaginación y el talento artístico a través del teatro musical bilingüe.', color: '#4A90D6', icon: Lightbulb },
    { title: 'Inclusión', desc: 'Brindamos acceso 100% becado para jóvenes locales sin distinción de origen o recursos.', color: '#77C65E', icon: Heart },
    { title: 'Expresión', desc: 'Abrimos espacios seguros de desarrollo personal, voz propia y confianza escénica.', color: '#DCEB4F', icon: Feather },
    { title: 'Impacto', desc: 'Generamos cambio social duradero en Costa Rica, China y Mozambique a través del arte.', color: '#002244', icon: Globe },
  ];

  const boardMembers = [
    { name: 'Ing. Alicia Salazar, MSc', role: 'Directora de Proyecto & Asesora', bio: 'Profesora en el ITCR, líder en gestión de software y mentora académica.' },
    { name: 'Marcelo Gómez Cordero', role: 'Dirección General de Producción', bio: 'Coordinación estratégica y supervisión técnica del programa.' },
    { name: 'Ana Isabel Hernández Muñoz', role: 'Dirección de Medios y Redes', bio: 'Gestión de comunicaciones, boletín Mailchimp y difusión comunitaria.' },
    { name: 'Daniel Zeas Brown', role: 'Coordinación de Elenco & Logística', bio: 'Gestión de boletería y coordinación de participantes internacionales.' },
    { name: 'Otto Segura Ruiz', role: 'Dirección Técnica & Escenografía', bio: 'Supervisión de montaje de infraestructura escénica y multimedia.' },
    { name: 'Rafael Araya Álvarez', role: 'Desarrollo de Sistemas & Plataforma', bio: 'Arquitectura de software y soluciones digitales integradas.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 animate-fadeIn">
      {/* Header Banner */}
      <div className="text-center max-w-4xl mx-auto space-y-4">
        <span className="inline-block px-4 py-1.5 rounded-full bg-[#77C65E]/20 text-[#DCEB4F] text-xs font-bold uppercase tracking-wider border border-[#77C65E]/40">
          Nuestra Esencia & Historia
        </span>
        <h1 className="font-serif text-4xl sm:text-6xl font-bold text-white tracking-tight">
          {language === 'es' ? 'Historia, Valores e Impacto' : 'Our Story & Global Impact'}
        </h1>
        <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
          Far Corners es un teatro comunitario que cree en el poder del arte para transformar, inspirar y unir personas. Creamos experiencias escénicas que fortalecen la comunidad, celebran la diversidad y abren espacios de expresión para todos.
        </p>
      </div>

      {/* Main Story */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <div className="border-l-4 border-[#77C65E] pl-4">
            <h2 className="font-serif text-2xl font-bold text-white">
              {history?.title ?? (language === 'es' ? 'Origen e Historia del Teatro' : 'History & Origins')}
            </h2>
            <p className="text-xs text-[#DCEB4F] font-mono mt-0.5">
              {history?.subtitle ?? 'Monteverde, Costa Rica • 2013 - 2026'}
            </p>
          </div>

          {history ? (
            <ContentParagraphs text={history.content} />
          ) : (
            <>
              <p className="text-slate-300 text-sm leading-relaxed">
                El Teatro Comunitario Far Corners nació como una iniciativa sin fines de lucro en la zona alta de Monteverde, Puntarenas. El objetivo inicial fue crear un espacio inclusivo donde la juventud costarricense compartiera escena con estudiantes universitarios e instruidos pasantes internacionales de música, teatro y danza.
              </p>

              <p className="text-slate-300 text-sm leading-relaxed">
                Con el paso de los años, el modelo de campamentos bilingües de verano se expandió con programas educativos itinerantes en zonas rurales de China y talleres de integración de artes tradicionales en Mozambique.
              </p>
            </>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-[#002244] p-4 rounded-xl border border-[#1e4066]">
              <span className="font-mono text-2xl font-bold text-[#77C65E] block">100%</span>
              <span className="text-xs text-slate-300">Becas gratuitas para participantes locales</span>
            </div>
            <div className="bg-[#002244] p-4 rounded-xl border border-[#1e4066]">
              <span className="font-mono text-2xl font-bold text-[#4A90D6] block">+150</span>
              <span className="text-xs text-slate-300">Pasantes internacionales capacitados</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#77C65E]/50 shadow-2xl group">
            <img
              src="/recursos/IMG_2904.PNG"
              alt="Ensayo Far Corners"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </div>

      {/* Brand Essence Values Grid */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-white">
            Nuestra Esencia & Valores de Marca
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Valores institucionales definidos en la Guía de Marca oficial de Far Corners.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {brandValues.map((val, idx) => {
            const IconComp = val.icon;
            return (
              <div key={idx} className="bg-[#002244] p-5 rounded-2xl border border-[#1e4066] hover:border-[#77C65E] transition-all space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#77C65E]">
                  <IconComp className="w-5 h-5 text-[#DCEB4F]" />
                </div>
                <h3 className="font-serif text-base font-bold text-white">{val.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{val.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Outreach */}
      <div className="bg-[#002244] rounded-3xl p-8 border border-[#1e4066] space-y-8">
        <div className="border-b border-white/10 pb-4">
          <span className="text-xs font-bold text-[#DCEB4F] uppercase tracking-wider block">
            {language === 'es' ? 'Impacto Geográfico' : 'Geographic Reach'}
          </span>
          <h2 className="font-serif text-2xl font-bold text-white">Costa Rica, China y Mozambique</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {impactItems.length > 0
            ? impactItems.map(item => (
                <div key={item.id} className="bg-[#00162e] p-5 rounded-2xl border border-[#1e4066] space-y-3">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-serif text-lg font-bold text-white">{item.title}</span>
                    {item.subtitle && <span className="text-xs font-mono text-[#77C65E]">{item.subtitle}</span>}
                  </div>
                  <ContentParagraphs text={item.content} className="text-xs text-slate-300 leading-relaxed" />
                </div>
              ))
            : projectsData.map(p => (
                <div key={p.id} className="bg-[#00162e] p-5 rounded-2xl border border-[#1e4066] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-serif text-lg font-bold text-white">{p.country}</span>
                    <span className="text-xs font-mono text-[#77C65E]">{p.year}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{language === 'es' ? p.summary : p.summaryEn}</p>
                  <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400">
                    <span className="text-white font-bold">{p.participants}+</span> participantes registrados
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* Future Vision */}
      {futureVision && (
        <div className="bg-[#002244] rounded-3xl p-6 sm:p-8 border border-[#77C65E]/40 space-y-4 text-center max-w-4xl mx-auto">
          <span className="text-xs font-bold text-[#DCEB4F] uppercase tracking-wider block">
            {language === 'es' ? 'Visión de futuro' : 'Vision for the future'}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">{futureVision.title}</h2>
          {futureVision.subtitle && <p className="text-sm text-[#77C65E] font-bold">{futureVision.subtitle}</p>}
          <div className="space-y-3 text-left">
            <ContentParagraphs text={futureVision.content} />
          </div>
          {futureVision.cta_label && futureVision.cta_target && (
            <button
              type="button"
              onClick={() => openCta(futureVision.cta_target!)}
              className="px-6 py-3 rounded-xl bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white text-sm font-extrabold transition-colors"
            >
              {futureVision.cta_label}
            </button>
          )}
        </div>
      )}

      {/* Board of Directors */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#77C65E] uppercase tracking-wider block mb-1">
            Liderazgo & Equipo Académico
          </span>
          <h2 className="font-serif text-3xl font-bold text-white">
            Junta Directiva y Equipo de Producción
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boardMembers.map((m, idx) => (
            <div key={idx} className="bg-[#002244] p-5 rounded-2xl border border-[#1e4066] hover:border-[#4A90D6]/60 transition-all space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#77C65E]/20 text-[#77C65E] flex items-center justify-center font-serif font-bold text-sm border border-[#77C65E]/40">
                {m.name.charAt(0)}
              </div>
              <h3 className="font-serif text-base font-bold text-white">{m.name}</h3>
              <p className="text-xs text-[#DCEB4F] font-bold">{m.role}</p>
              <p className="text-xs text-slate-300 leading-relaxed">{m.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
