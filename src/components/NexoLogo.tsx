import { useId } from 'react'

export type NexoState = 'reposo' | 'pensando' | 'trabajando' | 'atencion' | 'desconectado'

const LABELS: Record<NexoState, string> = {
  reposo: 'Nexo en reposo',
  pensando: 'Nexo está pensando',
  trabajando: 'Tus agentes están trabajando',
  atencion: 'Nexo tiene algo para ti',
  desconectado: 'Nexo está desconectado',
}

/**
 * El logo de Nexo, vivo: cada pieza se anima según lo que está pasando.
 * - reposo: el núcleo respira · pensando: los arcos emiten como una señal
 * - trabajando: las figuras (los agentes) se encienden por turnos
 * - atención: el núcleo se tiñe de bermellón · desconectado: gris y quieto
 * Las animaciones están en styles.css y respetan "reducir movimiento".
 */
export function NexoLogo({
  state,
  size = 48,
  decorative = false,
}: {
  state: NexoState
  size?: number
  decorative?: boolean
}) {
  const hatch = useId().replace(/:/g, '')
  return (
    <svg
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      data-estado={state}
      className="logo-nexo shrink-0"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : LABELS[state]}
    >
      <defs>
        <pattern
          id={hatch}
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="20" height="6" fill="var(--color-tinta)" />
        </pattern>
      </defs>
      <rect x="120" y="120" width="840" height="840" rx="150" fill={`url(#${hatch})`} />
      <rect
        x="64"
        y="64"
        width="840"
        height="840"
        rx="150"
        fill="var(--color-papel-claro)"
        stroke="var(--color-tinta)"
        strokeWidth="34"
      />
      <g fill="none" stroke="var(--color-cobalto)" strokeWidth="26" strokeLinecap="round">
        <path className="logo-onda" d="M77 500 A410 410 0 0 1 897 500" />
        <path className="logo-onda logo-onda-2" d="M77 500 A410 410 0 0 1 897 500" />
      </g>
      <circle
        className="logo-ping"
        cx="487"
        cy="500"
        r="150"
        fill="none"
        stroke="var(--color-bermellon)"
        strokeWidth="24"
      />
      <g fill="none" stroke="var(--color-tinta)" strokeWidth="34">
        <path className="logo-arco logo-arco-externo" d="M157 500 A330 330 0 0 1 817 500" />
        <path className="logo-arco logo-arco-interno" d="M247 500 A240 240 0 0 1 727 500" />
      </g>
      <g className="logo-nucleo">
        <polygon
          points="605.1,561.8 548.8,618.1 469.2,618.1 412.9,561.8 412.9,482.2 469.2,425.9 548.8,425.9 605.1,482.2"
          fill={`url(#${hatch})`}
        />
        <polygon
          className="logo-nucleo-relleno"
          points="583.1,539.8 526.8,596.1 447.2,596.1 390.9,539.8 390.9,460.2 447.2,403.9 526.8,403.9 583.1,460.2"
          stroke="var(--color-tinta)"
          strokeWidth="26"
          strokeLinejoin="round"
        />
      </g>
      <g
        fill="none"
        stroke="var(--color-tinta)"
        strokeWidth="26"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <rect className="logo-agente" x="182" y="560" width="72" height="72" rx="14" />
        <path className="logo-agente" d="M318 684 L362 728 L318 772 L274 728 Z" />
        <circle className="logo-agente" cx="487" cy="790" r="16" fill="var(--color-tinta)" />
        <path className="logo-agente" d="M626 742 L694 742" />
        <circle className="logo-agente" cx="760" cy="596" r="38" />
      </g>
    </svg>
  )
}
