import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/types";

// ─── Store ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: UserProfile) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (user: UserProfile) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  logout: () => {
    try {
      localStorage.removeItem("geotech-auth");
    } catch {
      console.log();
      
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  setLoading: (loading) => set({ isLoading: loading }),
  updateUser: (user) => set({ user }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchAndLogin(userId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      useAuthStore.getState().logout();
    } else {
      useAuthStore.getState().login(data as UserProfile);
    }
  } catch {
    useAuthStore.getState().logout();
  }
}

// ─── Auth initializer (called once in main.tsx, outside React) ────────────────

export function initAuth(): void {
  // Fast path: no session in localStorage → resolve immediately, skip network
  const STORAGE_KEY = "geotech-auth";
  let hasStoredSession = false;
  try {
    hasStoredSession = !!localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable (privacy mode, SSR) — treat as no session
  }

  if (!hasStoredSession) {
    useAuthStore.getState().logout(); // sets isLoading: false immediately
    listenForAuthChanges();
    return;
  }

  // Slow path: stored session found — verify it (may need token refresh over network)
  let settled = false;
  const settle = () => {
    settled = true;
  };

  // Hard timeout: never leave the app stuck in a loading state
  const timeout = setTimeout(() => {
    if (!settled) {
      settle();
      useAuthStore.getState().logout();
    }
  }, 5000);

  supabase.auth
    .getSession()
    .then(async ({ data: { session } }) => {
      clearTimeout(timeout);
      if (settled) return;
      settle();

      if (session?.user) {
        await fetchAndLogin(session.user.id);
      } else {
        useAuthStore.getState().logout();
      }
    })
    .catch(() => {
      clearTimeout(timeout);
      if (!settled) {
        settle();
        useAuthStore.getState().logout();
      }
    });

  listenForAuthChanges();
}

// Live auth changes after init (sign-in, sign-out, token refresh)
function listenForAuthChanges(): void {
  supabase.auth.onAuthStateChange((event, session) => {
    // INITIAL_SESSION is handled by initAuth — ignore it here
    if (event === "INITIAL_SESSION") return;

    if (session?.user) {
      fetchAndLogin(session.user.id);
    } else {
      useAuthStore.getState().logout();
    }
  });
}
