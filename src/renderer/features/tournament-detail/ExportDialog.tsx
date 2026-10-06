import { useState } from 'react'
import { Check, Copy, Download } from 'lucide-react'
import type { Tournament } from '@shared/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { buildCsv, buildShareText, exportFileName } from '@/domain/export'
import { computeRanking } from '@/domain/ranking'
import { notify } from '@/lib/notify'
import { useAppStore } from '@/stores/app-store'

interface Props {
  tournament: Tournament
  open: boolean
  onClose: () => void
}

export function ExportDialog({ open, ...rest }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && rest.onClose()}>
      <DialogContent className="sm:max-w-lg">{open && <ExportBody {...rest} />}</DialogContent>
    </Dialog>
  )
}

function ExportBody({ tournament, onClose }: Omit<Props, 'open'>) {
  const finished = useAppStore((s) => s.finished)
  const roster = useAppStore((s) => s.rosters[tournament.id] ?? [])
  const [copied, setCopied] = useState(false)
  const text = buildShareText(tournament.name, computeRanking(finished))

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    notify.success('Classement copié', 'Collez-le dans votre conversation.')
  }

  const download = () => {
    const csv = buildCsv({ tournament, roster, finished })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = exportFileName(tournament.name)
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Exporter les résultats</DialogTitle>
        <DialogDescription>{tournament.name}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <div className="text-[13px] font-semibold">Texte à partager (top 10)</div>
        <textarea
          readOnly
          aria-label="Texte du classement"
          value={text}
          rows={Math.min(14, text.split('\n').length + 1)}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full resize-none rounded-md border bg-muted/40 p-3 font-mono text-[13px] leading-relaxed"
        />
        <Button variant="outline" onClick={copy} className="self-start">
          {copied ? <Check /> : <Copy />} {copied ? 'Copié' : 'Copier le texte'}
        </Button>
      </div>
      <div className="rounded-lg border p-3 text-[13px] text-muted-foreground">
        Le fichier CSV contient le classement, l'historique des matchs et la liste des joueurs.
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
        <Button onClick={download}>
          <Download /> Télécharger le CSV
        </Button>
      </DialogFooter>
    </>
  )
}
