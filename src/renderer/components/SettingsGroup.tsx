import type { ReactNode } from 'react'

/** Titled card of label/value rows, used by tournament settings (view + edit) and the wizard. */
export function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="bg-muted px-4 py-2.5 text-[13px] font-semibold">{title}</div>
      {children}
    </div>
  )
}

export function SettingsRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t px-4 py-2.5 text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
