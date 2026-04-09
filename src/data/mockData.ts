// This file is kept for reference only.
// All data is now fetched from Supabase.
// Do not import from this file in production code.

import type { Courier } from '@/types'

export const COURIERS: Courier[] = [
  { id: 'bluedart', name: 'Blue Dart', coverage: 'Pan India' },
  { id: 'delhivery', name: 'Delhivery', coverage: 'Wide pincode reach' },
  { id: 'dtdc', name: 'DTDC', coverage: 'Tier 2 & 3 areas' },
  { id: 'xpressbees', name: 'XpressBees', coverage: 'South India strong' },
  { id: 'ecomexpress', name: 'Ecom Express', coverage: 'Reliable delivery' },
]

export function generateSampleId(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `GEO-${year}-${random}`
}

export function getCouriersForPincode(pincode: string): Courier[] {
  if (!pincode || pincode.length !== 6) return COURIERS
  return COURIERS
}