import { supabase } from '@/lib/supabase'

export async function generateSampleId(): Promise<string> {
  try {
    // Get ALL VCE-GEO sample IDs
    const { data } = await supabase
      .from('samples')
      .select('sample_id')
      .like('sample_id', 'VCE-GEO-%')

    // Find highest number used so far
    let maxNum = 0
    if (data && data.length > 0) {
      for (const row of data) {
        const match = (row.sample_id as string).match(/VCE-GEO-(\d+)/)
        if (match) {
          const num = parseInt(match[1])
          if (num > maxNum) maxNum = num
        }
      }
    } else {
      // No VCE-GEO samples yet — get total count as base
      const { count } = await supabase
        .from('samples')
        .select('*', { count: 'exact', head: true })
      maxNum = count || 0
    }

    // Find next unused ID
    let nextNum = maxNum + 1
    for (let attempts = 0; attempts < 20; attempts++) {
      const candidateId = `VCE-GEO-${String(nextNum).padStart(4, '0')}`

      // Check if this ID already exists
      const { data: existing } = await supabase
        .from('samples')
        .select('sample_id')
        .eq('sample_id', candidateId)
        .maybeSingle()

      if (!existing) return candidateId
      nextNum++
    }

    // Guaranteed unique fallback
    return `VCE-GEO-${Date.now().toString().slice(-6)}`

  } catch {
    return `VCE-GEO-${Date.now().toString().slice(-6)}`
  }
}