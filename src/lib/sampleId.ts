import { supabase } from '@/lib/supabase'

const FALLBACK_PREFIX = 'VCE-GEO'
const MAX_RETRIES = 3

function generateFallbackId(): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${FALLBACK_PREFIX}-F${timestamp}${random}`
}

export async function generateSampleId(): Promise<string> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await supabase.rpc('generate_next_sample_id')

      if (error) {
        console.error(`[generateSampleId] Attempt ${attempt} failed:`, error)
        continue
      }

      if (!data || typeof data !== 'string') {
        console.error(`[generateSampleId] Invalid response on attempt ${attempt}`)
        continue
      }

      if (!/^VCE-GEO-\d{4,}$/.test(data)) {
        console.error(`[generateSampleId] Unexpected ID format on attempt ${attempt}:`, data)
        continue
      }

      console.log(`[generateSampleId] Generated ID: ${data} (attempt ${attempt})`)
      return data

    } catch (err) {
      console.error(`[generateSampleId] Unexpected error on attempt ${attempt}:`, err)
    }
  }

  const fallback = generateFallbackId()
  console.warn(`[generateSampleId] All retries failed. Using fallback: ${fallback}`)
  return fallback
}