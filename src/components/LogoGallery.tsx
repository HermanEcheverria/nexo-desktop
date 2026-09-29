import { NexoLogo, type NexoState } from './NexoLogo'

const STATES: NexoState[] = ['reposo', 'pensando', 'trabajando', 'atencion', 'desconectado']

/** Solo en desarrollo (#logos): los cinco estados del logo lado a lado, para diseñarlos. */
export function LogoGallery() {
  return (
    <div className="grid h-full grid-cols-5 place-items-center gap-6 p-10">
      {STATES.map((state) => (
        <figure key={state} className="flex flex-col items-center gap-4">
          <NexoLogo state={state} size={180} />
          <figcaption className="font-mono text-sm">{state}</figcaption>
        </figure>
      ))}
    </div>
  )
}
