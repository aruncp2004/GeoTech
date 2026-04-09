import { create } from 'zustand'
import type { Sample } from '@/types'

interface SampleState {
  samples: Sample[]
  selectedSample: Sample | null
  isLoading: boolean
  setSamples: (samples: Sample[]) => void
  setSelectedSample: (sample: Sample | null) => void
  addSample: (sample: Sample) => void
  updateSample: (id: string, updates: Partial<Sample>) => void
  setLoading: (loading: boolean) => void
}

export const useSampleStore = create<SampleState>((set) => ({
  samples: [],
  selectedSample: null,
  isLoading: false,

  setSamples: (samples) =>
    set({ samples }),

  setSelectedSample: (sample) =>
    set({ selectedSample: sample }),

  addSample: (sample) =>
    set((state) => ({
      samples: [sample, ...state.samples],
    })),

  updateSample: (id, updates) =>
    set((state) => ({
      samples: state.samples.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
      selectedSample:
        state.selectedSample?.id === id
          ? { ...state.selectedSample, ...updates }
          : state.selectedSample,
    })),

  setLoading: (loading) =>
    set({ isLoading: loading }),
}))