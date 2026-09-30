import type { ServiceStatus } from '../hooks/useService'

/** Pantalla mientras el núcleo enciende, o si no responde. */
export function ServiceGate({ status, onRetry }: { status: ServiceStatus; onRetry: () => void }) {
  const unreachable = status === 'unreachable'
  return (
    <div className="flex h-full items-center justify-center p-10">
      <div className="tarjeta flex max-w-lg flex-col gap-4 p-8 shadow-[6px_6px_0_var(--color-tinta)]">
        <h1 className="font-display text-3xl">
          {unreachable ? 'No logré encender el núcleo' : 'Encendiendo el núcleo de Nexo…'}
        </h1>
        <p className="text-tinta-suave leading-relaxed">
          {unreachable
            ? 'El núcleo corre en WSL (Ubuntu) y no respondió. Revisa que WSL funcione y que el comando «nexo» esté instalado; también puedes encenderlo a mano con «nexo servicio».'
            : 'El núcleo corre en WSL. La primera vez del día puede tardar unos segundos mientras Ubuntu despierta.'}
        </p>
        {unreachable && (
          <button type="button" className="boton self-start" onClick={onRetry}>
            Intentar de nuevo
          </button>
        )}
      </div>
    </div>
  )
}
