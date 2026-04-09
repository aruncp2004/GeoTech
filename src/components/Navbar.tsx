import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Menu, Package, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem('geotech-auth')
    } catch {
      // ignore
    }
    logout()
    window.location.replace('/login')
  }

  const dashboardPath = user?.role === 'admin' ? '/admin' : '/dashboard'

  return (
    <nav className="sticky top-0 z-50 border-b-4 border-secondary bg-primary text-primary-foreground">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to={isAuthenticated ? dashboardPath : '/login'} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-lg font-bold leading-none">
              Geo<span className="text-secondary">Tech</span> Labs
            </div>
            <div className="mt-0.5 text-xs leading-none text-primary-foreground/50">by Velciti</div>
          </div>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-primary-foreground/70">{user?.full_name}</span>
              <Button
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate(dashboardPath)}
              >
                Dashboard
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="font-bold"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen((open) => !open)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="flex flex-col gap-2 border-t border-primary-foreground/10 bg-primary px-6 py-4 md:hidden">
          {isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                className="justify-start text-primary-foreground"
                onClick={() => {
                  navigate(dashboardPath)
                  setMobileOpen(false)
                }}
              >
                Dashboard
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="font-bold"
                onClick={async () => {
                  setMobileOpen(false)
                  await handleLogout()
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button variant="ghost" className="justify-start text-primary-foreground" asChild>
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                Login
              </Link>
            </Button>
          )}
        </div>
      )}
    </nav>
  )
}