interface ContentParagraphsProps {
  text: string;
  className?: string;
}

/** Muestra texto plano de la API separando párrafos por líneas en blanco (sin HTML). */
export const ContentParagraphs: React.FC<ContentParagraphsProps> = ({
  text,
  className = 'text-slate-300 text-sm leading-relaxed',
}) => (
  <>
    {text
      .split(/\n\s*\n/)
      .map((parrafo) => parrafo.trim())
      .filter(Boolean)
      .map((parrafo, indice) => (
        <p key={indice} className={`${className} whitespace-pre-line`}>
          {parrafo}
        </p>
      ))}
  </>
);
