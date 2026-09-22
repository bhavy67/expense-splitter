/**
 * Validates a UPI Virtual Payment Address (VPA).
 * Format: <vpa>@<handle>
 * - vpa: 3–50 chars, alphanumeric + . _ -, no leading/trailing/consecutive dots
 * - handle: 2–20 chars, alphanumeric only
 */
export function isValidUpiId(id: string): boolean {
  if (!id || typeof id !== 'string') return false
  const s = id.trim()
  if (s.length === 0 || s.length > 60) return false
  if (s.includes(' ')) return false

  const atIdx = s.indexOf('@')
  if (atIdx === -1) return false
  // Reject multiple @ symbols
  if (s.indexOf('@', atIdx + 1) !== -1) return false

  const vpa = s.slice(0, atIdx)
  const handle = s.slice(atIdx + 1)

  if (vpa.length < 3 || vpa.length > 50) return false
  if (handle.length < 2 || handle.length > 20) return false
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(vpa)) return false
  if (vpa.includes('..')) return false
  if (/[._-]$/.test(vpa)) return false
  if (!/^[a-zA-Z0-9]+$/.test(handle)) return false

  return true
}

/** UPI only works with Indian Rupee */
export function isUpiSupportedCurrency(currency: string): boolean {
  return currency === 'INR'
}

/** Format amount to exactly 2 decimal places for UPI spec compliance */
export function formatUpiAmount(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2)
}

/** Build a UPI deep link string.
 *  UPI ID (pa) must NOT be percent-encoded — apps expect the raw @ symbol.
 *  Name and note are encoded since they can contain arbitrary characters.
 */
export function buildUpiLink({
  upiId,
  name,
  amount,
  note,
}: {
  upiId: string
  name: string
  amount: number
  note?: string
}): string {
  const parts = [
    `pa=${upiId}`,
    `pn=${encodeURIComponent(name)}`,
    `am=${formatUpiAmount(amount)}`,
    `cu=INR`,
  ]
  if (note) parts.push(`tn=${encodeURIComponent(note)}`)
  return `upi://pay?${parts.join('&')}`
}

/** Returns warning messages for edge-case amounts */
export function getUpiAmountWarnings(amount: number): string[] {
  const warnings: string[] = []
  const rounded = Math.round(amount * 100) / 100
  if (amount <= 0) {
    warnings.push('Amount is zero — nothing to pay')
    return warnings
  }
  if (amount < 1) warnings.push('Minimum UPI transaction is ₹1')
  if (amount > 200000) warnings.push('Exceeds ₹2L daily UPI limit on most banks')
  else if (amount > 100000) warnings.push("May exceed your bank's ₹1L per-transaction limit")
  if (amount !== rounded) warnings.push(`Amount will be rounded to ₹${rounded.toFixed(2)}`)
  return warnings
}

/** Build a shareable WhatsApp message for a debt */
export function whatsappShareText({
  fromName,
  toName,
  amount,
  upiId,
  groupName,
}: {
  fromName: string
  toName: string
  amount: number
  upiId: string
  groupName: string
}): string {
  const upiLink = buildUpiLink({ upiId, name: toName, amount })
  return (
    `Hey ${fromName}, you owe ₹${formatUpiAmount(amount)} to ${toName} for *${groupName}*.\n\n` +
    `Pay via UPI ID: ${upiId}\n\n` +
    `Or tap to pay directly: ${upiLink}`
  )
}
