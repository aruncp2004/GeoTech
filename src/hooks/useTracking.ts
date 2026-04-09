import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Sample } from '@/types'

export function useTracking(sampleId: string | undefined) {
  const [sample, setSample] = useState<Sample | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!sampleId) return

    const fetchSample = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('samples')
        .select('*')
        .eq('id', sampleId)
        .single()

      if (!error && data) {
        setSample(data as Sample)
      }
      setIsLoading(false)
    }

    fetchSample()

    const channel = supabase
      .channel(`sample-${sampleId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'samples',
          filter: `id=eq.${sampleId}`,
        },
        (payload) => {
          setSample(payload.new as Sample)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sampleId])

  return { sample, isLoading }
}