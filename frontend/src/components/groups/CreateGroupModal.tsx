import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { useCreateGroup } from '@/hooks/useGroups'

const GROUP_TYPES = [
  { value: 'travel',    label: '✈️ Travel' },
  { value: 'roommates', label: '🏠 Roommates' },
  { value: 'friends',   label: '👯 Friends' },
  { value: 'dinner',    label: '🍽️ Dinner' },
  { value: 'other',     label: '👥 Other' },
] as const

const schema = z.object({
  name:          z.string().min(2, 'Name must be at least 2 characters').max(100),
  description:   z.string().max(500).optional(),
  type:          z.enum(['travel', 'roommates', 'friends', 'dinner', 'other']),
  currency_code: z.string(),
})

type FormValues = z.infer<typeof schema>

interface CreateGroupModalProps {
  open: boolean
  onClose: () => void
}

export function CreateGroupModal({ open, onClose }: CreateGroupModalProps) {
  const navigate = useNavigate()
  const createGroup = useCreateGroup()

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'other', currency_code: 'INR' },
  })

  const selectedType = watch('type')

  useEffect(() => { if (!open) reset() }, [open, reset])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const onSubmit = async (data: FormValues) => {
    const group = await createGroup.mutateAsync(data)
    onClose()
    navigate(`/groups/${group.id}`)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              key="modal"
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl dark:shadow-black/50 border border-transparent dark:border-zinc-800"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">New group</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 flex flex-col gap-5">
                {/* Group type picker */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 block mb-2">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {GROUP_TYPES.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setValue('type', value)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                          selectedType === value
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-300 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Group name"
                  placeholder={selectedType === 'travel' ? 'Goa Trip 2025' : selectedType === 'roommates' ? 'Flat 4B' : 'Group name'}
                  error={errors.name?.message}
                  {...register('name')}
                />

                <Input
                  label="Description"
                  placeholder="Optional"
                  error={errors.description?.message}
                  {...register('description')}
                />

                {/* Currency — locked to INR */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 block mb-1.5">Currency</label>
                  <div className="h-10 flex items-center px-3.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-500 dark:text-zinc-400">
                    ₹ Indian Rupee (INR)
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
                  <Button type="submit" className="flex-1" loading={createGroup.isPending}>Create group</Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
