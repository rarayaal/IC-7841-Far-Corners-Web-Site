import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  /** Valor final con su formato, por ejemplo "+5,000", "100%" o "3". */
  value: string;
  className?: string;
  durationMs?: number;
}

const esDigito = (c: string) => c >= '0' && c <= '9';

/** Separa prefijo, número y sufijo ("+5,000" -> "+", "5,000", ""). Sin expresiones regulares con retroceso. */
function partirValor(valor: string): [string, string, string, string] | null {
  const inicio = [...valor].findIndex(esDigito);

  if (inicio < 0) return null;

  let fin = inicio;
  while (fin < valor.length && (esDigito(valor[fin]) || valor[fin] === '.' || valor[fin] === ',')) {
    fin += 1;
  }

  const sufijo = valor.slice(fin);

  if ([...sufijo].some(esDigito)) return null;

  return [valor, valor.slice(0, inicio), valor.slice(inicio, fin), sufijo];
}

/** Cuenta desde 0 hasta el valor cuando entra en pantalla; sin animación si se reduce el movimiento. */
export const CountUp: React.FC<CountUpProps> = ({ value, className, durationMs = 1400 }) => {
  const partes = partirValor(value);
  const objetivo = partes ? Number(partes[2].replace(/,/g, '')) : Number.NaN;
  const [actual, setActual] = useState(Number.isFinite(objetivo) ? 0 : Number.NaN);
  const nodo = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!Number.isFinite(objetivo)) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActual(objetivo);
      return;
    }

    let cuadro = 0;
    const observador = new IntersectionObserver(([entrada]) => {
      if (!entrada.isIntersecting) return;

      observador.disconnect();
      const inicio = performance.now();

      const avanzar = (ahora: number) => {
        const t = Math.min((ahora - inicio) / durationMs, 1);
        const suave = 1 - Math.pow(1 - t, 3);

        setActual(Math.round(objetivo * suave));
        if (t < 1) cuadro = requestAnimationFrame(avanzar);
      };

      cuadro = requestAnimationFrame(avanzar);
    });

    if (nodo.current) observador.observe(nodo.current);

    return () => {
      observador.disconnect();
      cancelAnimationFrame(cuadro);
    };
  }, [objetivo, durationMs]);

  if (!partes) return <span className={className}>{value}</span>;

  return (
    <span ref={nodo} className={className}>
      {/* El valor final se anuncia a los lectores de pantalla; la cifra animada se oculta. */}
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">
        {partes[1]}
        {actual.toLocaleString('en-US')}
        {partes[3]}
      </span>
    </span>
  );
};
