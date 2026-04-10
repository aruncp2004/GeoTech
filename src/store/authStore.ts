import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types'

interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: UserProfile) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  updateUser: (user: UserProfile) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user) => set({ user, isAuthenticated: true, isLoading: false }),

  logout: () => {
    try {
      localStorage.removeItem('geotech-auth')
    } catch {
      // ignore
    }
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  setLoading: (loading) => set({ isLoading: loading }),
  updateUser: (user) => set({ user }),
}))

async function fetchAndLogin(userId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      useAuthStore.getState().logout()
      return
    }

    // Block inactive users
    if (!data.is_active) {
      useAuthStore.getState().logout()
      await supabase.auth.signOut()
      return
    }

    useAuthStore.getState().login(data as UserProfile)
  } catch {
    useAuthStore.getState().logout()
  }
}

export function initAuth(): void {
  const STORAGE_KEY = 'geotech-auth'
  let hasStoredSession = false
  try {
    hasStoredSession = !!localStorage.getItem(STORAGE_KEY)
  } catch {
    // localStorage unavailable
  }

  if (!hasStoredSession) {
    useAuthStore.getState().logout()
    listenForAuthChanges()
    return
  }

  let settled = false
  const settle = () => { settled = true }

  const timeout = setTimeout(() => {
    if (!settled) {
      settle()
      useAuthStore.getState().logout()
    }
  }, 5000)

  supabase.auth
    .getSession()
    .then(async ({ data: { session } }) => {
      clearTimeout(timeout)
      if (settled) return
      settle()
      if (session?.user) {
        await fetchAndLogin(session.user.id)
      } else {
        useAuthStore.getState().logout()
      }
    })
    .catch(() => {
      clearTimeout(timeout)
      if (!settled) {
        settle()
        useAuthStore.getState().logout()
      }
    })

  listenForAuthChanges()
}

function listenForAuthChanges(): void {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION') return
    if (session?.user) {
      fetchAndLogin(session.user.id)
    } else {
      useAuthStore.getState().logout()
    }
  })
}