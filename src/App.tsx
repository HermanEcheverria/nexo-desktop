import { invoke, isTauri } from '@tauri-apps/api/core'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification'
import { useEffect, useRef, useState } from 'react'

import { CommandBar } from './components/CommandBar'
import { ServiceGate } from './components/ServiceGate'
import { Sidebar, type View } from './components/Sidebar'
import { useJournal } from './hooks/useJournal'
import { useService } from './hooks/useService'
import { api } from './lib/api'
import { bytes } from './lib/format'
import { usePendingActions } from './hooks/queries'
import { AgentsView } from './views/AgentsView'
import { ApprovalsView } from './views/ApprovalsView'
import { JournalView } from './views/JournalView'
import { ReportView } from './views/ReportView'

/** Al iniciar sesión en Windows: los agentes revisan la PC y llega una notificación con el resumen. */
async function morningRun() {
  if (!isTauri() || !(await invoke<boolean>('launched_at_login'))) return
  await api.refreshAll()
  const report = await api.report()
  const warnings = report.items.filter((i) => i.level === 'warning').length
  let allowed = await isPermissionGranted()
  if (!allowed) allowed = (await requestPermission()) === 'granted'
  if (!allowed) return
  sendNotification({
    title: 'Tu parte del día está listo',
    body: [
      warnings
        ? `${warnings} ${warnings === 1 ? 'cosa requiere' : 'cosas requieren'} tu atención`
        : 'Nada urgente',
      report.reclaimableBytes ? `podrías liberar ${bytes(report.reclaimableBytes)}` : null,
      report.pendingActions ? `${report.pendingActions} por aprobar` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  })
}

const VIEWS: View[] = ['parte', 'aprobaciones', 'agentes', 'bitacora']

/** La vista activa vive en la dirección (#agentes), así se puede abrir directo. */
function initialView(): View {
  const hash = window.location.hash.slice(1) as View
  return VIEWS.includes(hash) ? hash : 'parte'
}

export default function App() {
  const [view, setView] = useState<View>(initialView)
  const { status, retry } = useService()
  const ready = status === 'ready'
  const { events, live } = useJournal(ready)
  const ranMorning = useRef(false)
  const { data: pending = [] } = usePendingActions(ready)

  const go = (next: View) => {
    setView(next)
    window.history.replaceState(null, '', `#${next}`)
  }

  useEffect(() => {
    if (!ready || ranMorning.current) return
    ranMorning.current = true
    morningRun().catch((error) => console.error('Revisión de inicio de sesión', error))
  }, [ready])

  return (
    <div className="flex h-full">
      <Sidebar
        view={view}
        onChange={go}
        status={status}
        live={live}
        onWorkstation={() => void (isTauri() && invoke('open_workstation'))}
        pending={ready ? pending.length : 0}
      />
      <main className="min-w-0 flex-1 overflow-y-auto">
        {ready && <CommandBar onNavigate={go} />}
        {!ready ? (
          <ServiceGate status={status} onRetry={retry} />
        ) : view === 'parte' ? (
          <ReportView onApprovals={() => go('aprobaciones')} />
        ) : view === 'aprobaciones' ? (
          <ApprovalsView />
        ) : view === 'agentes' ? (
          <AgentsView />
        ) : (
          <JournalView events={events} live={live} />
        )}
      </main>
    </div>
  )
}
