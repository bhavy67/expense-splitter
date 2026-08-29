import { useRef, useState, useEffect } from 'react'
import { Send } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { useComments, useAddComment } from '@/hooks/useExpenses'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

interface Props {
  expenseId: string
}

export function ExpenseComments({ expenseId }: Props) {
  const currentUser = useAuthStore((s) => s.user)
  const { data: comments = [], isLoading } = useComments(expenseId)
  const addComment = useAddComment(expenseId)

  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  // scroll to bottom when new comments arrive
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [comments.length])

  function submit() {
    const trimmed = text.trim()
    if (!trimmed || addComment.isPending) return
    addComment.mutate(trimmed, { onSuccess: () => setText('') })
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
        <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
          Comments
          {comments.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-400 dark:text-zinc-500">
              {comments.length}
            </span>
          )}
        </p>
      </div>

      {/* Comment list */}
      {isLoading ? (
        <div className="px-4 py-4 flex flex-col gap-3 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-3 w-24 bg-gray-100 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-40 bg-gray-100 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-gray-400 dark:text-zinc-500">No comments yet. Add context or a note.</p>
        </div>
      ) : (
        <div ref={listRef} className="px-4 py-3 flex flex-col gap-4 max-h-72 overflow-y-auto">
          {comments.map((c) => {
            const isMe = c.user_id === currentUser?.id
            return (
              <div key={c.id} className={cn('flex gap-2.5', isMe && 'flex-row-reverse')}>
                <Avatar name={c.user?.name ?? '?'} src={c.user?.avatar_url} size="sm" />
                <div className={cn('flex flex-col gap-0.5 max-w-[75%]', isMe && 'items-end')}>
                  <div className={cn(
                    'flex items-baseline gap-2',
                    isMe && 'flex-row-reverse'
                  )}>
                    <span className="text-xs font-semibold text-gray-700 dark:text-zinc-200">
                      {isMe ? 'You' : c.user?.name ?? '?'}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">{timeAgo(c.created_at)}</span>
                  </div>
                  <div className={cn(
                    'px-3 py-2 rounded-2xl text-sm leading-relaxed',
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 rounded-tl-sm'
                  )}>
                    {c.content}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-3 border-t border-gray-100 dark:border-zinc-800 flex items-end gap-2">
        <Avatar name={currentUser?.name ?? '?'} src={currentUser?.avatar_url} size="sm" />
        <div className="flex-1 flex items-end gap-2 bg-gray-50 dark:bg-zinc-800 rounded-2xl px-3 py-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Add a comment…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none leading-relaxed max-h-28 overflow-y-auto"
            style={{ scrollbarWidth: 'none' }}
          />
          <button
            onClick={submit}
            disabled={!text.trim() || addComment.isPending}
            className="w-7 h-7 rounded-full bg-indigo-600 disabled:opacity-40 flex items-center justify-center shrink-0 transition-opacity"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
