import { useRef, useEffect } from 'react'
import { X, Copy, Download, Share2, Smartphone, AtSign, AlertTriangle, Lock, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { QRCodeCanvas } from 'qrcode.react'
import {
  buildUpiLink,
  formatUpiAmount,
  getUpiAmountWarnings,
  isUpiSupportedCurrency,
  whatsappShareText,
} from '@/lib/upi'
import { savePayment, generateId } from '@/lib/storage'
import { toast } from '@/components/common/Toast'
import type { Debt, Group, Member } from '@/types'

interface UpiQrModalProps {
  debt: Debt
  group: Group
  members: Member[]
  onClose: () => void
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export function UpiQrModal({ debt, group, members, onClose }: UpiQrModalProps) {
  const qrRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

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
    savePayment({
      id:             generateId(),
      groupId:        group.id,
      fromMemberId:   debt.from,
      toMemberId:     debt.to,
      amount:         debt.amount,
      date:           now.toISOString().split('T')[0],
      createdAt:      now.toISOString(),
    })
    toast.success(`₹${formatUpiAmount(debt.amount)} marked as paid — ${fromMember!.name} → ${toMember!.name}`)
    onClose()
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const showActions = isInr && !!toMember.upiId

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile, centered card on desktop */}
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 48 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[92dvh] md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[360px] md:max-h-[90vh] bg-white dark:bg-[#1e1e1a] border-2 border-[#0a0a0a] dark:border-[#f0ede5] rounded-t-2xl md:rounded-2xl shadow-[4px_4px_0_#0a0a0a] dark:shadow-[4px_4px_0_#b9f542] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-2.5 pb-0.5 shrink-0 md:hidden">
          <div className="w-10 h-1 rounded-full bg-[#0a0a0a]/20 dark:bg-[#f0ede5]/20" />
        </div>

        {/* Header — fixed, never scrolls */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b-2 border-[#0a0a0a] dark:border-[#f0ede5]">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880]">
              Pay via UPI
            </p>
            <h2 className="text-[15px] font-black uppercase tracking-[0.04em] text-[#0a0a0a] dark:text-[#f0ede5] leading-tight">
              {toMember.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded text-[#4a4940] dark:text-[#a09880] hover:text-[#0a0a0a] dark:hover:text-[#f0ede5] hover:bg-[#f0ede5] dark:hover:bg-[#1a1a17] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body — all content + actions scroll together */}
        <div className="flex-1 overflow-y-auto">
          {/* Content */}
          <div className="p-4 flex flex-col gap-3">
            {!isInr ? (
              /* Non-INR state */
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#f0ede5] dark:bg-[#1a1a17] border-2 border-[#0a0a0a]/20 dark:border-[#f0ede5]/20">
                  <Lock className="w-5 h-5 text-[#4a4940] dark:text-[#a09880]" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#0a0a0a] dark:text-[#f0ede5]">
                    UPI is only available for INR groups
                  </p>
                  <p className="text-[11px] font-mono text-[#4a4940] dark:text-[#a09880] mt-1">
                    This group uses {group.currency}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* QR code */}
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white p-3 rounded-xl border-2 border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] dark:shadow-[3px_3px_0_#b9f542]">
                    <QRCodeCanvas
                      ref={qrRef}
                      value={upiLink}
                      size={184}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#0a0a0a"
                      includeMargin={false}
                    />
                  </div>

                  {/* Amount + direction */}
                  <div className="text-center">
                    <p className="text-[30px] font-black font-mono text-[#0a0a0a] dark:text-[#f0ede5] leading-none tracking-tight">
                      ₹{formatUpiAmount(debt.amount)}
                    </p>
                    <p className="text-[11px] font-mono text-[#4a4940] dark:text-[#a09880] mt-1.5">
                      {fromMember.name} → {toMember.name}
                    </p>
                    <p className="text-[10px] font-mono text-[#4a4940]/50 dark:text-[#a09880]/50 mt-1">
                      Open PhonePe, GPay or Paytm · Scan QR
                    </p>
                  </div>
                </div>

                {/* UPI ID pill */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f0ede5] dark:bg-[#1a1a17] border border-[#0a0a0a]/10 dark:border-[#f0ede5]/10">
                  <AtSign className="w-3.5 h-3.5 text-[#88bc20] dark:text-[#b9f542] shrink-0" />
                  <span className="flex-1 text-[12px] font-mono text-[#0a0a0a] dark:text-[#f0ede5] truncate">
                    {toMember.upiId}
                  </span>
                  <button
                    onClick={handleCopyUpiId}
                    className="p-1 rounded text-[#4a4940] dark:text-[#a09880] hover:text-[#0a0a0a] dark:hover:text-[#f0ede5] transition-colors shrink-0"
                    title="Copy UPI ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Warning banners */}
                {warnings.map((w) => (
                  <div key={w} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b] shrink-0 mt-0.5" />
                    <p className="text-[11px] font-mono text-[#92640a] dark:text-[#fbbf24]">{w}</p>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Action buttons */}
          {showActions && (
            <div className="px-4 pb-2 flex flex-col gap-2">
              {/* Primary: Share QR */}
              <button
                onClick={handleShare}
                className="w-full h-10 flex items-center justify-center gap-2 rounded border-2 border-[#0a0a0a] bg-[#b9f542] text-[#0a0a0a] text-[13px] font-bold uppercase tracking-wider shadow-[2px_2px_0_#0a0a0a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                <Share2 className="w-4 h-4" />
                Share QR
              </button>

              {/* Copy + Download */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyLink}
                  className="h-9 flex items-center justify-center gap-1.5 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] bg-white dark:bg-[#1a1a17] text-[#0a0a0a] dark:text-[#f0ede5] text-[11px] font-bold uppercase tracking-wider shadow-[2px_2px_0_#0a0a0a] dark:shadow-[2px_2px_0_#f0ede5] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Link
                </button>
                <button
                  onClick={handleDownload}
                  className="h-9 flex items-center justify-center gap-1.5 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] bg-white dark:bg-[#1a1a17] text-[#0a0a0a] dark:text-[#f0ede5] text-[11px] font-bold uppercase tracking-wider shadow-[2px_2px_0_#0a0a0a] dark:shadow-[2px_2px_0_#f0ede5] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>

              {/* Open in app + WhatsApp */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleOpenInApp}
                  className="h-9 flex items-center justify-center gap-1.5 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] bg-white dark:bg-[#1a1a17] text-[#0a0a0a] dark:text-[#f0ede5] text-[11px] font-bold uppercase tracking-wider shadow-[2px_2px_0_#0a0a0a] dark:shadow-[2px_2px_0_#f0ede5] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Open App
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="h-9 flex items-center justify-center gap-1.5 rounded border-2 border-[#22c55e]/40 bg-[#22c55e]/10 text-[#16a34a] dark:text-[#22c55e] text-[11px] font-bold uppercase tracking-wider hover:bg-[#22c55e]/20 transition-colors"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  WhatsApp
                </button>
              </div>
            </div>
          )}

          {/* Mark as Paid — closes the loop after showing QR */}
          {showActions && (
            <div className="px-4 pt-1 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
              <div className="border-t border-[#0a0a0a]/10 dark:border-[#f0ede5]/10 pt-3">
                <button
                  onClick={handleRecordPayment}
                  className="w-full h-10 flex items-center justify-center gap-2 rounded border-2 border-dashed border-[#22c55e]/50 text-[#16a34a] dark:text-[#22c55e] text-[12px] font-bold uppercase tracking-wider hover:bg-[#22c55e]/10 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Paid
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}
