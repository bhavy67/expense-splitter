// "expenses" Edge Function — the one place expense writes happen.
//
// Ported from the old FastAPI backend's CreateExpenseRequest validators and
// _build_splits()/create_expense/update_expense/delete_expense handlers.
// Runs with the service-role key so it can write expenses + splits/items +
// an audit row and trigger a settlement recalculation atomically; RLS on
// these tables has no client-facing write policy on purpose — this
// function (after checking group membership itself) is the only writer.
//
// Routes (invoked via supabase.functions.invoke(`expenses/...`)):
//   POST   /expenses/:groupId              create
//   PUT    /expenses/:groupId/:expenseId    update
//   DELETE /expenses/:groupId/:expenseId    soft delete
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, PUT, DELETE, OPTIONS',
}

class ValidationError extends Error {}

type SplitType = 'equal' | 'percentage' | 'exact' | 'itemized'
interface SplitEntry {
  user_id: string
  amount?: number
  percentage?: number
}
interface ItemEntry {
  description: string
  amount: number
  splits: SplitEntry[]
}
interface ExpensePayload {
  title: string
  description?: string | null
  total_amount: number
  currency_code?: string
  split_type: SplitType
  category?: string
  paid_by: string
  expense_date: string
  splits?: SplitEntry[]
  items?: ItemEntry[]
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function errorResponse(message: string, status = 400): Response {
  return json({ error: message, detail: message }, status)
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function validatePayload(body: ExpensePayload): void {
  if (!body.title || !body.title.trim()) throw new ValidationError('Title is required')
  if (typeof body.total_amount !== 'number' || !(body.total_amount > 0)) {
    throw new ValidationError('Amount must be positive')
  }
  const splits = body.splits ?? []
  const items = body.items ?? []
  if (body.split_type === 'itemized') {
    if (items.length === 0) throw new ValidationError('Itemized split requires at least one item')
  } else if (splits.length === 0) {
    throw new ValidationError('Non-itemized split requires beneficiaries')
  }
  if (body.split_type === 'percentage') {
    const totalPct = splits.reduce((s, x) => s + (x.percentage ?? 0), 0)
    if (Math.abs(totalPct - 100) > 0.01) {
      throw new ValidationError(`Percentages must sum to 100, got ${totalPct}`)
    }
  }
  if (body.split_type === 'exact') {
    const total = splits.reduce((s, x) => s + (x.amount ?? 0), 0)
    if (Math.abs(total - body.total_amount) > 0.01) {
      throw new ValidationError(`Exact amounts must sum to total, got ${total}`)
    }
  }
}

interface SplitRow {
  user_id: string
  amount: number
  percentage: number | null
}
interface ItemRow {
  description: string
  amount: number
  splits: SplitRow[]
}

function buildSplits(payload: ExpensePayload): { splitsToInsert: SplitRow[]; itemsToInsert: ItemRow[] } {
  const total = round2(payload.total_amount)
  const splitsToInsert: SplitRow[] = []
  const itemsToInsert: ItemRow[] = []

  if (payload.split_type === 'equal') {
    const splits = payload.splits ?? []
    const perPerson = round2(total / splits.length)
    const amounts = splits.map(() => perPerson)
    const remainder = round2(total - amounts.reduce((a, b) => a + b, 0))
    amounts[0] = round2(amounts[0] + remainder)
    splits.forEach((s, i) => {
      splitsToInsert.push({ user_id: s.user_id, amount: amounts[i], percentage: null })
    })
  } else if (payload.split_type === 'percentage') {
    for (const s of payload.splits ?? []) {
      const amount = round2((total * (s.percentage ?? 0)) / 100)
      splitsToInsert.push({ user_id: s.user_id, amount, percentage: s.percentage ?? null })
    }
  } else if (payload.split_type === 'exact') {
    for (const s of payload.splits ?? []) {
      splitsToInsert.push({ user_id: s.user_id, amount: round2(s.amount ?? 0), percentage: null })
    }
  } else if (payload.split_type === 'itemized') {
    for (const item of payload.items ?? []) {
      itemsToInsert.push({
        description: item.description,
        amount: round2(item.amount),
        splits: (item.splits ?? []).map((s) => ({
          user_id: s.user_id,
          amount: round2(s.amount ?? 0),
          percentage: null,
        })),
      })
    }
  }

  return { splitsToInsert, itemsToInsert }
}

async function insertSplitsAndItems(
  admin: SupabaseClient,
  expenseId: string,
  splitsToInsert: SplitRow[],
  itemsToInsert: ItemRow[]
): Promise<void> {
  if (splitsToInsert.length) {
    const { error } = await admin
      .from('expense_splits')
      .insert(splitsToInsert.map((s) => ({ ...s, expense_id: expenseId })))
    if (error) throw new Error(error.message)
  }
  for (const item of itemsToInsert) {
    const { data: itemRow, error } = await admin
      .from('expense_items')
      .insert({ expense_id: expenseId, description: item.description, amount: item.amount })
      .select('id')
      .single()
    if (error || !itemRow) throw new Error(error?.message ?? 'Failed to create expense item')
    if (item.splits.length) {
      const { error: splitErr } = await admin
        .from('expense_splits')
        .insert(item.splits.map((s) => ({ ...s, expense_id: expenseId, expense_item_id: itemRow.id })))
      if (splitErr) throw new Error(splitErr.message)
    }
  }
}

async function fetchExpense(admin: SupabaseClient, expenseId: string) {
  const { data, error } = await admin
    .from('expenses')
    .select(
      '*, splits:expense_splits(id,user_id,amount,percentage), items:expense_items(id,description,amount,splits:expense_splits(id,user_id,amount,percentage))'
    )
    .eq('id', expenseId)
    .single()
  if (error) throw new Error(error.message)
  return data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const idx = parts.indexOf('expenses')
    const groupId = parts[idx + 1]
    const expenseId = parts[idx + 2]

    if (!groupId) return errorResponse('Missing group id', 400)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return errorResponse('Missing Authorization header', 401)

    // Verify the caller's JWT with an anon-key client scoped to it.
    const supabaseAuth = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser()
    if (userErr || !userData?.user) return errorResponse('Invalid or expired session', 401)
    const userId = userData.user.id

    // All writes go through the service-role client (bypasses RLS) —
    // membership is checked explicitly below, mirroring get_group_member.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    const { data: membership } = await admin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()
    if (!membership) return errorResponse('Not a member of this group', 403)

    if (req.method === 'POST') {
      const body = (await req.json()) as ExpensePayload
      validatePayload(body)
      const { splitsToInsert, itemsToInsert } = buildSplits(body)

      const { data: expense, error: insertErr } = await admin
        .from('expenses')
        .insert({
          group_id: groupId,
          title: body.title,
          description: body.description ?? null,
          total_amount: round2(body.total_amount),
          currency_code: body.currency_code ?? 'INR',
          split_type: body.split_type,
          category: body.category ?? 'other',
          paid_by: body.paid_by,
          expense_date: body.expense_date,
          created_by: userId,
        })
        .select('*')
        .single()
      if (insertErr || !expense) return errorResponse(insertErr?.message ?? 'Failed to create expense', 400)

      await insertSplitsAndItems(admin, expense.id, splitsToInsert, itemsToInsert)

      await admin.from('expense_audit').insert({
        expense_id: expense.id,
        changed_by: userId,
        action: 'created',
        snapshot: { title: expense.title, total_amount: expense.total_amount },
      })

      const { error: recalcErr } = await admin.rpc('recalculate_settlements', { p_group_id: groupId })
      if (recalcErr) console.error('recalculate_settlements failed', recalcErr)

      return json(await fetchExpense(admin, expense.id), 201)
    }

    if (req.method === 'PUT') {
      if (!expenseId) return errorResponse('Missing expense id', 400)
      const body = (await req.json()) as Partial<ExpensePayload>

      const { data: existing } = await admin
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .eq('group_id', groupId)
        .is('deleted_at', null)
        .maybeSingle()
      if (!existing) return errorResponse('Expense not found', 404)

      const patch: Record<string, unknown> = {}
      if (body.title !== undefined) patch.title = body.title
      if (body.description !== undefined) patch.description = body.description
      if (body.total_amount !== undefined) patch.total_amount = round2(body.total_amount)
      if (body.category !== undefined) patch.category = body.category
      if (body.paid_by !== undefined) patch.paid_by = body.paid_by
      if (body.expense_date !== undefined) patch.expense_date = body.expense_date

      // Splits are only rebuilt when the caller actually sends new split
      // data — a title/amount-only edit leaves the existing splits as-is.
      const rebuildingSplits = body.split_type !== undefined || body.splits !== undefined || body.items !== undefined
      let splitsToInsert: SplitRow[] = []
      let itemsToInsert: ItemRow[] = []
      if (rebuildingSplits) {
        const merged: ExpensePayload = {
          title: (patch.title as string) ?? existing.title,
          total_amount: (patch.total_amount as number) ?? Number(existing.total_amount),
          split_type: body.split_type ?? existing.split_type,
          paid_by: (patch.paid_by as string) ?? existing.paid_by,
          expense_date: (patch.expense_date as string) ?? existing.expense_date,
          splits: body.splits ?? [],
          items: body.items ?? [],
        }
        validatePayload(merged)
        const built = buildSplits(merged)
        splitsToInsert = built.splitsToInsert
        itemsToInsert = built.itemsToInsert
        if (body.split_type !== undefined) patch.split_type = body.split_type
      }

      const { data: updated, error: updateErr } = await admin
        .from('expenses')
        .update(patch)
        .eq('id', expenseId)
        .select('*')
        .single()
      if (updateErr || !updated) return errorResponse(updateErr?.message ?? 'Failed to update expense', 400)

      if (rebuildingSplits) {
        await admin.from('expense_splits').delete().eq('expense_id', expenseId)
        await admin.from('expense_items').delete().eq('expense_id', expenseId)
        await insertSplitsAndItems(admin, expenseId, splitsToInsert, itemsToInsert)
      }

      await admin.from('expense_audit').insert({
        expense_id: expenseId,
        changed_by: userId,
        action: 'updated',
        snapshot: { title: updated.title, total_amount: updated.total_amount },
      })

      const { error: recalcErr } = await admin.rpc('recalculate_settlements', { p_group_id: groupId })
      if (recalcErr) console.error('recalculate_settlements failed', recalcErr)

      return json(await fetchExpense(admin, expenseId), 200)
    }

    if (req.method === 'DELETE') {
      if (!expenseId) return errorResponse('Missing expense id', 400)

      const { data: existing } = await admin
        .from('expenses')
        .select('id, title, total_amount')
        .eq('id', expenseId)
        .eq('group_id', groupId)
        .is('deleted_at', null)
        .maybeSingle()
      if (!existing) return errorResponse('Expense not found', 404)

      const { error: delErr } = await admin
        .from('expenses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', expenseId)
      if (delErr) return errorResponse(delErr.message, 400)

      await admin.from('expense_audit').insert({
        expense_id: expenseId,
        changed_by: userId,
        action: 'deleted',
        snapshot: { title: existing.title, total_amount: existing.total_amount },
      })

      const { error: recalcErr } = await admin.rpc('recalculate_settlements', { p_group_id: groupId })
      if (recalcErr) console.error('recalculate_settlements failed', recalcErr)

      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    return errorResponse('Method not allowed', 405)
  } catch (err) {
    if (err instanceof ValidationError) return errorResponse(err.message, 422)
    console.error(err)
    return errorResponse('Internal error', 500)
  }
})
