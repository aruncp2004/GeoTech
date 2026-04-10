import { supabase } from '@/lib/supabase'

export async function generateSampleId(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('samples')
      .select('sample_id')
      .like('sample_id', 'VCE-GEO-%')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      return 'VCE-GEO-0001'
    }

    const lastId = data.sample_id
    const lastNum = parseInt(lastId.replace('VCE-GEO-', '')) || 0
    const nextNum = lastNum + 1
    return `VCE-GEO-${String(nextNum).padStart(4, '0')}`
  } catch {
    return 'VCE-GEO-0001'
  }
}