import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useSamples } from '@/hooks/useSamples'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StatusBadge from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Plus, Package } from 'lucide-react'

export default function CustomerDashboard() {
  const user = useAuthStore((s) => s.user)
  const { samples, isLoading } = useSamples()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-primary">My Parcels</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Welcome, {user?.full_name} · {user?.company}
            </p>
          </div>
          <Button
            variant="secondary" className="font-bold"
            asChild
          >
            <Link to="/submit-sample">
              <Plus className="h-4 w-4 mr-1" />
              New sample
            </Link>
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-muted animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && samples.length === 0 && (
          <div className="bg-card border rounded-xl p-16 text-center">
            <div className="w-14 h-14 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Package className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-primary mb-2">
              No parcels yet
            </h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
              Submit your first sample to get started. Each parcel gets a
              unique Sample ID for lab identification.
            </p>
            <Button
              variant="secondary" className="font-bold"
              asChild
            >
              <Link to="/submit-sample">Submit your first sample</Link>
            </Button>
          </div>
        )}

        {/* Parcel list */}
        {!isLoading && samples.length > 0 && (
          <div className="grid gap-3">
            {samples.map((sample) => (
              <Link
                key={sample.id}
                to={`/parcel/${sample.id}`}
                className="bg-card border rounded-xl p-5 hover:border-secondary hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-black text-primary text-lg tracking-wide font-mono">
                      {sample.sample_id}
                    </span>
                    <StatusBadge status={sample.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sample.courier_name} ·{' '}
                    <span className="capitalize">{sample.sample_type}</span> ·{' '}
                    {sample.num_parcels} parcel
                    {sample.num_parcels > 1 ? 's' : ''} · {sample.weight_kg} kg
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(sample.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}