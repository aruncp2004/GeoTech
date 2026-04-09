import { supabase } from '@/lib/supabase'
import type { Courier } from '@/types'

export async function getCouriersFromDB(): Promise<Courier[]> {
  const { data, error } = await supabase
    .from('couriers')
    .select('*')
    .eq('enabled', true)
    .order('name')

  if (error || !data) return []
  return data as Courier[]
}

export function getCouriersForPincode(_pincode: string): Courier[] {
  return []
}

export function getAllCouriers(): Courier[] {
  return []
}