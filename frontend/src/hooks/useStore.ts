import { useState, useEffect, useCallback } from 'react'
import * as storage from '@/lib/storage'
import type { Group, Expense, Payment } from '@/types'

function useStorageEvent(handler: () => void) {
  useEffect(() => {
    window.addEventListener('splititt:update', handler)
    return () => window.removeEventListener('splititt:update', handler)
  }, [handler])
}

export function useGroups(): Group[] {
  const [groups, setGroups] = useState<Group[]>(() => storage.getGroups())
  const refresh = useCallback(() => setGroups(storage.getGroups()), [])
  useStorageEvent(refresh)
  return groups
}

export function useGroup(id: string): Group | null {
  const [group, setGroup] = useState<Group | null>(() => storage.getGroup(id))
  const refresh = useCallback(() => setGroup(storage.getGroup(id)), [id])
  useStorageEvent(refresh)
  return group
}

export function useExpenses(groupId: string): Expense[] {
  const [expenses, setExpenses] = useState<Expense[]>(() => storage.getExpenses(groupId))
  const refresh = useCallback(() => setExpenses(storage.getExpenses(groupId)), [groupId])
  useStorageEvent(refresh)
  return expenses
}

export function usePayments(groupId: string): Payment[] {
  const [payments, setPayments] = useState<Payment[]>(() => storage.getPayments(groupId))
  const refresh = useCallback(() => setPayments(storage.getPayments(groupId)), [groupId])
  useStorageEvent(refresh)
  return payments
}
