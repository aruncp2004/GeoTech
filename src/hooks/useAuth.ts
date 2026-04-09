import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { UserProfile } from '@/types'

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, setLoading } =
    useAuthStore()

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !data) {
        logout()
        return
      }

      login(data as UserProfile)
    } catch {
      logout()
    }
  }, [login, logout])

  useEffect(() => {
    let mounted = true
    setLoading(true)

    // Step 1: resolve initial session from localStorage (fast, no network)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        logout()
      }
    }).catch(() => {
      if (mounted) logout()
    })

    // Step 2: listen for live auth changes only (skip INITIAL_SESSION — handled above)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'INITIAL_SESSION') return
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          logout()
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, logout, setLoading])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (
    email: string,
    password: string,
    profile: Omit<UserProfile, 'id' | 'created_at' | 'role' | 'tracking_access'>
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: profile,
      },
    })
    if (error) throw error
    if (!data.user) throw new Error('Signup failed')
  }

 const signOut = async () => {
  try {
    await supabase.auth.signOut()
  } finally {
    logout()
  }
}

  return {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
  }
}