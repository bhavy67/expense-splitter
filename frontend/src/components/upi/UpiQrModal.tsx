import { useRef } from 'react'
import { Copy, Download, Share2, Smartphone, AtSign, TriangleAlert, Lock, CircleCheck, MessageCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Card } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { Sheet } from '@/components/ui/Dialog'
import { QRCodeCanvas } from 'qrcode.react'
import {
  buildUpiLink,
  formatUpiAmount,
  getUpiAmountWarnings,
  isUpiSupportedCurrency,
  whatsappShareText,
} from '@/lib/upi'
import { savePayment, generateId } from '@/lib/storage'
import { today } from '@/lib/utils'
import { toast } from '@/components/common/Toast'
import type { Debt, Group, Member } from '@/types'

interface UpiQrModalProps {
  debt: Debt
  group: Group
  members: Member[]
  onClose: () => void
}

export function UpiQrModal({ debt, group, members, onClose }: UpiQrModalProps) {
  const qrRef = useRef<HTMLCanvasElement>(null)

  const fromMember = members.find((m) => m.id === debt.from)
  const toMember   = members.find((m) => m.id === debt.to)

  if (!fromMember || !toMember) return null

  const isInr    = isUpiSupportedCurrency(group.currency)
  const upiLink  = (toMember.upiId && isInr)
    ? buildUpiLink({ upiId: toMember.upiId, name: toMember.name, amount: debt.amount, note: group.name })
    : ''
  const warnings = isInr ? getUpiAmountWarnings(debt.amount) : []
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  // ── Actions ──────────────────────────────────────────────────────────────────

  async function handleShare() {
    const canvas = qrRef.current
    if (!canvas) { handleDownload(); return }
    try {
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
      )
      const file = new File(
        [blob],
        `pay-${toMember!.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        { type: 'image/png' }
      )
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Pay ${toMember!.name}`,
          text: `Pay ₹${formatUpiAmount(debt.amount)} to ${toMember!.name} for ${group.name}`,
          files: [file],
        })
        toast.success('QR shared successfully')
      } else {
        handleDownload()
        toast.info('QR downloaded — share the image manually')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      handleDownload()
      toast.info('QR downloaded — share the image manually')
    }
  }

  function handleDownload() {
    const canvas = qrRef.current
    if (!canvas) { toast.error('QR generation failed — copy the UPI ID instead'); return }
    const url = canvas.toDataURL('image/png')
    const a   = document.createElement('a')
    a.href     = url
    a.download = `pay-${toMember!.name.toLowerCase().replace(/\s+/g, '-')}.png`
    a.click()
    toast.success('QR image saved')
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(upiLink)
      toast.success('UPI link copied to clipboard')
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = upiLink
        ta.style.cssText = 'position:fixed;opacity:0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        toast.success('UPI link copied to clipboard')
      } catch {
        toast.error("Couldn't copy — copy the UPI ID manually")
      }
    }
  }

  async function handleCopyUpiId() {
    if (!toMember?.upiId) return
    try {
      await navigator.clipboard.writeText(toMember.upiId)
      toast.success('UPI ID copied')
    } catch {
      toast.error("Couldn't copy automatically")
    }
  }

  function handleOpenInApp() {
    if (!isMobile) {
      toast.info('UPI apps only open on mobile — scan the QR or copy the link')
      return
    }
    window.location.href = upiLink
    // No UPI app installed: Chrome silently ignores the link and we keep focus.
    // ponytail: focus heuristic, can misfire on very slow devices; harmless (info toast only).
    setTimeout(() => {
      if (!document.hidden && document.hasFocus()) toast.info('No UPI app opened — scan the QR or copy the UPI ID')
    }, 1500)
  }

  function handleWhatsApp() {
    if (!toMember?.upiId) return
    const text = whatsappShareText({
      fromName:  fromMember!.name,
      toName:    toMember.name,
      amount:    debt.amount,
      upiId:     toMember.upiId,
      groupName: group.name,
    })
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function handleRecordPayment() {
    const now = new Date()
    const saved = savePayment({
      id:             generateId(),
      groupId:        group.id,
      fromMemberId:   debt.from,
      toMemberId:     debt.to,
      amount:         debt.amount,
      date:           today(),
      createdAt:      now.toISOString(),
    })
    if (!saved) return
    toast.success(`₹${formatUpiAmount(debt.amount)} marked as paid — ${fromMember!.name} → ${toMember!.name}`)
    onClose()
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const showActions = isInr && !!toMember.upiId

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Pay ${toMember.name}`}
      description="Pay via UPI"
      footer={showActions && (
        <Button variant="secondary" fullWidth onClick={handleRecordPayment}>
          <CircleCheck className="size-4" />
          Mark as paid
        </Button>
      )}
    >
      {!isInr ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <IconTile icon={Lock} size="lg" />
          <p className="text-title">UPI is only available for INR groups</p>
          <p className="text-body-sm text-fg-muted">This group uses {group.currency}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3">
            {/* Scanners need contrast: the QR is always dark-on-white, in both themes. */}
            <div className="rounded-lg bg-white p-4 shadow-float">
              <QRCodeCanvas
                ref={qrRef}
                value={upiLink}
                size={184}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
                includeMargin={false}
              />
            </div>
            <div className="text-center">
              <p className="text-display tabular-nums">₹{formatUpiAmount(debt.amount)}</p>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-body-sm text-fg-muted">
                {fromMember.name}
                <ArrowRight className="size-3.5" aria-hidden />
                <span className="sr-only">pays</span>
                {toMember.name}
              </p>
              <p className="mt-1 text-caption text-fg-subtle">Scan with PhonePe, GPay or Paytm</p>
            </div>
          </div>

          <Card variant="inset" className="flex items-center gap-2 py-1 pr-1 pl-3">
            <AtSign className="size-4 shrink-0 text-fg-muted" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-mono text-body-sm">{toMember.upiId}</span>
            <IconButton aria-label="Copy UPI ID" onClick={handleCopyUpiId}><Copy /></IconButton>
          </Card>

          {warnings.map((w) => (
            <Card key={w} variant="inset" className="flex items-start gap-2 p-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p className="text-body-sm">{w}</p>
            </Card>
          ))}

          {showActions && (
            <div className="flex flex-col gap-2">
              <Button fullWidth onClick={handleShare}>
                <Share2 className="size-4" />
                Share QR
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" onClick={handleCopyLink}><Copy className="size-4" />Copy link</Button>
                <Button variant="secondary" size="sm" onClick={handleDownload}><Download className="size-4" />Download</Button>
                <Button variant="secondary" size="sm" onClick={handleOpenInApp}><Smartphone className="size-4" />Open app</Button>
                <Button variant="secondary" size="sm" onClick={handleWhatsApp}><MessageCircle className="size-4" />WhatsApp</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Sheet>
  )
}
