import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useSamples } from '@/hooks/useSamples'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StatusBadge from '@/components/StatusBadge'
import TrackingTimeline from '@/components/TrackingTimeline'
import SampleIDTag from '@/components/SampleIDTag'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import type { Sample } from '@/types'

function UpdateCourierForm({
  sampleId,
  currentAwb,
  currentCourier,
}: {
  sampleId: string
  currentAwb?: string
  currentCourier?: string
}) {
  const [courier, setCourier] = useState(currentCourier || '')
  const [awb, setAwb] = useState(currentAwb || '')
  const [saving, setSaving] = useState(false)
  const { updateSample } = useSamples()

  const handleSave = async () => {
    if (!courier) {
      toast.error('Please enter a courier name')
      return
    }
    setSaving(true)
    try {
      await updateSample.mutateAsync({
        id: sampleId,
        updates: {
          courier_name: courier,
          awb_number: awb,
          status: 'picked_up',
        },
      })
      toast.success('Courier details updated — status set to Picked Up')
    } catch {
      toast.error('Update failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Courier name</Label>
          <Input
            placeholder="e.g. Blue Dart, DTDC, Speed Post..."
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Tracking / AWB number</Label>
          <Input
            placeholder="Enter tracking number from courier"
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      <Button
        variant="secondary" className="font-bold"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving…' : 'Save & Update Status →'}
      </Button>
    </div>
  )
}

export default function ParcelDetailPage() {
  const { id } = useParams()
  const user = useAuthStore((s) => s.user)
  const { fetchSampleById } = useSamples()
  const [sample, setSample] = useState<Sample | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTag, setShowTag] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    const load = async () => {
      try {
        const data = await fetchSampleById(id)
        if (!cancelled) setSample(data)
      } catch {
        if (!cancelled) setSample(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id, fetchSampleById])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!sample) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-black text-primary mb-4">
            Parcel not found
          </h1>
          <Button
            variant="secondary" className="font-bold"
            asChild
          >
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <Link
          to="/dashboard"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        {/* Sample ID header */}
        <div className="bg-primary rounded-xl p-6 mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs text-primary-foreground/50 uppercase tracking-widest font-bold mb-1">
              Sample ID
            </p>
            <div className="text-4xl font-black text-secondary font-mono tracking-wider">
              {sample.sample_id}
            </div>
          </div>
          <StatusBadge status={sample.status} />
        </div>

        {/* Details */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <h2 className="font-bold text-primary mb-4">Sample details</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Sample type', value: sample.sample_type },
              { label: 'Test required', value: sample.test_required },
              { label: 'No. of parcels', value: sample.num_parcels },
              { label: 'Weight', value: `${sample.weight_kg} kg` },
              { label: 'Courier', value: sample.courier_name },
              { label: 'AWB number', value: sample.awb_number || 'Not assigned' },
              { label: 'Pickup date', value: sample.pickup_date },
              { label: 'Pickup time', value: sample.pickup_time },
              {
                label: 'Submitted on',
                value: new Date(sample.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }),
              },
              ...(sample.condition
                ? [{ label: 'Condition on receipt', value: sample.condition }]
                : []),
            ].map((item) => (
              <div
                key={item.label}
                className="flex justify-between py-2 border-b last:border-0"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold capitalize text-right">
                  {String(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Update courier details */}
        {sample.status === 'booked' && (
          <div className="bg-card border rounded-xl p-6 mb-6">
            <h2 className="font-bold text-primary mb-2">
              Update courier details
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Once you have handed over the parcel to the courier and received
              a tracking number — update it here.
            </p>
            <UpdateCourierForm
              sampleId={sample.id}
              currentAwb={sample.awb_number}
              currentCourier={sample.courier_name}
            />
          </div>
        )}

        {/* Tracking timeline */}
        {user?.tracking_access ? (
          <div className="bg-card border rounded-xl p-6 mb-6">
            <h2 className="font-bold text-primary mb-6">Tracking timeline</h2>
            <TrackingTimeline currentStatus={sample.status} />
          </div>
        ) : (
          <div className="bg-muted rounded-xl p-6 text-center text-sm text-muted-foreground mb-6">
            Tracking timeline is not enabled for your account. Contact our team
            to request access.
          </div>
        )}

        {/* Print label */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowTag(!showTag)}
            className="mb-4"
          >
            {showTag ? 'Hide' : 'Show'} printable label
          </Button>
          {showTag && <SampleIDTag sample={sample} />}
        </div>
      </div>
      <Footer />
    </div>
  )
}