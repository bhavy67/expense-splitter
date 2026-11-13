import { BookMarked, Camera, ChevronDown, X } from 'lucide-react'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import type { AddExpenseForm } from './useAddExpenseForm'

function ReceiptPicker({ form }: { form: AddExpenseForm }) {
  return (
    <div>
      <p className="mb-1.5 text-caption text-fg-muted">Receipt</p>
      {form.receiptImage ? (
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={form.receiptImage} alt="Receipt" className="size-20 rounded-md border border-border object-cover" />
            <IconButton aria-label="Remove receipt" onClick={() => form.setReceiptImage(undefined)} className="absolute -top-3 -right-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-inverse-bg text-inverse-fg shadow-float [&_svg]:size-3.5"><X /></span>
            </IconButton>
          </div>
          <Button variant="ghost" size="sm" type="button" onClick={() => form.photoRef.current?.click()}>Change photo</Button>
        </div>
      ) : (
        <Button variant="secondary" fullWidth type="button" onClick={() => form.photoRef.current?.click()} className="border-dashed">
          <Camera className="size-4" />
          Attach a receipt photo
        </Button>
      )}
      <input ref={form.photoRef} type="file" accept="image/*" className="hidden" onChange={form.handlePhotoChange} aria-label="Receipt photo" />
    </div>
  )
}

function SaveTemplate({ form }: { form: AddExpenseForm }) {
  if (form.existing) return null
  if (!form.savingTemplate) {
    return (
      <Button
        variant="ghost"
        size="sm"
        type="button"
        className="self-start"
        onClick={() => { form.setTemplateName(form.title || ''); form.setSavingTemplate(true) }}
      >
        <BookMarked className="size-4" />
        Save as template
      </Button>
    )
  }
  return (
    <div className="flex items-end gap-2">
      <Field label="Template name" className="flex-1">
        <Input
          autoFocus
          value={form.templateName}
          onChange={(e) => form.setTemplateName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); form.handleSaveTemplate() }
            if (e.key === 'Escape') form.setSavingTemplate(false)
          }}
        />
      </Field>
      <Button size="md" type="button" onClick={form.handleSaveTemplate}>Save</Button>
      <Button size="md" variant="ghost" type="button" onClick={() => form.setSavingTemplate(false)}>Cancel</Button>
    </div>
  )
}

// Date, notes, receipt and templates stay out of the way so the default form is short.
export function MoreOptions({ form }: { form: AddExpenseForm }) {
  const hasExtras = !!(form.existing || form.notes || form.receiptImage)
  return (
    <details open={hasExtras} className="group rounded-lg border border-border">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-body font-medium [&::-webkit-details-marker]:hidden">
        More details
        <ChevronDown className="size-4 text-fg-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="flex flex-col gap-4 border-t border-border p-4">
        <Field label="Date">
          <Input type="date" value={form.date} onChange={(e) => form.setDate(e.target.value)} />
        </Field>
        <Field label="Notes">
          <Textarea value={form.notes} onChange={(e) => form.setNotes(e.target.value)} rows={2} placeholder="Add a note" className="resize-none" />
        </Field>
        <ReceiptPicker form={form} />
        <SaveTemplate form={form} />
      </div>
    </details>
  )
}
