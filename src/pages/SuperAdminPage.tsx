import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useSamples } from '@/hooks/useSamples'
import { supabase } from '@/lib/supabase'
import { logActivity, detectChanges, formatChanges } from '@/lib/activityLog'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StatusBadge from '@/components/StatusBadge'
import TrackingTimeline from '@/components/TrackingTimeline'
import SampleIDTag from '@/components/SampleIDTag'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Pencil, X, FileText, FolderOpen, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import type { Sample, SampleType } from '@/types'

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
          <Input placeholder="e.g. Blue Dart, DTDC..." value={courier} onChange={(e) => setCourier(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Courier tracking number</Label>
          <Input placeholder="Enter tracking number" value={awb} onChange={(e) => setAwb(e.target.value)} className="mt-1" />
        </div>
      </div>
      <Button variant="secondary" className="font-bold" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save & Update Status →'}
      </Button>
    </div>
  )
}

function parseDescription(desc: string): { rows: string[]; attachment: string | null } {
  if (!desc) return { rows: [], attachment: null }
  const lines = desc.split('\n').filter(Boolean)
  const rows: string[] = []
  let attachment: string | null = null
  for (const line of lines) {
    if (line.startsWith('ATTACHMENT:')) {
      attachment = line.replace('ATTACHMENT:', '').trim()
    } else {
      rows.push(line)
    }
  }
  return { rows, attachment }
}

export default function ParcelDetailPage() {
  const { id } = useParams()
  const user = useAuthStore((s) => s.user)
  const { fetchSampleById, samples } = useSamples()
  const [sample, setSample] = useState<Sample | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTag, setShowTag] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editForm, setEditForm] = useState({
    sample_type: '',
    test_required: '',
    project_name: '',
    site_location: '',
    num_parcels: '',
    weight_kg: '',
    remarks: '',
  })

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const load = async () => {
      try {
        const data = await fetchSampleById(id)
        if (!cancelled) {
          setSample(data)
          setEditForm({
            sample_type: data.sample_type || '',
            test_required: data.test_required || '',
            project_name: data.project_name || '',
            site_location: data.site_location || '',
            num_parcels: String(data.num_parcels || 1),
            weight_kg: String(data.weight_kg || 0),
            remarks: data.remarks || '',
          })
        }
      } catch {
        if (!cancelled) setSample(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, fetchSampleById])

  const canEdit = sample && (sample.status === 'booked' || sample.status === 'picked_up')

  const handleSaveEdit = async () => {
    if (!id || !sample || !user) return
    setSaving(true)

    const changes = detectChanges(
      {
        sample_type: sample.sample_type || '',
        test_required: sample.test_required || '',
        project_name: sample.project_name || '',
        site_location: sample.site_location || '',
        num_parcels: String(sample.num_parcels),
        weight_kg: String(sample.weight_kg),
        remarks: sample.remarks || '',
      },
      {
        sample_type: editForm.sample_type,
        test_required: editForm.test_required,
        project_name: editForm.project_name,
        site_location: editForm.site_location,
        num_parcels: editForm.num_parcels,
        weight_kg: editForm.weight_kg,
        remarks: editForm.remarks,
      },
      {
        sample_type: 'Sample type',
        test_required: 'Test required',
        project_name: 'Project name',
        site_location: 'Site location',
        num_parcels: 'No. of parcels',
        weight_kg: 'Weight (kg)',
        remarks: 'Remarks',
      }
    )

    if (changes.length === 0) {
      toast.info('No changes made')
      setEditing(false)
      setSaving(false)
      return
    }

    try {
      const { error } = await supabase
        .from('samples')
        .update({
          sample_type: editForm.sample_type as SampleType,
          test_required: editForm.test_required,
          project_name: editForm.project_name,
          site_location: editForm.site_location,
          num_parcels: parseInt(editForm.num_parcels) || 1,
          weight_kg: parseFloat(editForm.weight_kg) || 0,
          remarks: editForm.remarks,
        })
        .eq('id', id)

      if (error) throw error

      await logActivity({
        actor_id: user.id,
        actor_name: user.full_name,
        actor_role: user.role,
        action: 'edited sample details',
        target_id: id,
        target_name: sample.sample_id,
        sample_id: sample.sample_id,
        page: 'Parcel Detail',
        details: formatChanges(changes),
        old_value: changes.map(c => `${c.field}: ${c.old_value}`).join(' | '),
        new_value: changes.map(c => `${c.field}: ${c.new_value}`).join(' | '),
      })

      const updated = await fetchSampleById(id)
      setSample(updated)
      setEditing(false)
      toast.success(`${changes.length} change${changes.length > 1 ? 's' : ''} saved successfully`)
    } catch {
      toast.error('Update failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-16 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!sample) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-black text-primary mb-4">Parcel not found</h1>
          <Button variant="secondary" className="font-bold" asChild>
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  const relatedParcels = samples.filter(
    s => s.id !== sample.id && s.project_name && s.project_name === sample.project_name
  )
  const relatedBySite = samples.filter(
    s => s.id !== sample.id &&
      !relatedParcels.find(r => r.id === s.id) &&
      s.site_location && s.site_location === sample.site_location
  )

  const { rows: descRows, attachment } = parseDescription(sample.sample_description || '')

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <Link to="/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        {/* Header */}
        <div className="bg-primary rounded-xl p-6 mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs text-primary-foreground/50 uppercase tracking-widest font-bold mb-1">Sample ID</p>
            <div className="text-4xl font-black text-secondary font-mono tracking-wider">{sample.sample_id}</div>
            {sample.project_name && (
              <p className="text-primary-foreground/60 text-sm mt-2 flex items-center gap-1">
                <FolderOpen className="h-3.5 w-3.5" />{sample.project_name}
              </p>
            )}
            {sample.site_location && (
              <p className="text-primary-foreground/60 text-xs mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />{sample.site_location}
              </p>
            )}
          </div>
          <StatusBadge status={sample.status} />
        </div>

        {/* Details */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-primary">Sample details</h2>
            {canEdit && !editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1 text-xs">
                <Pencil className="h-3.5 w-3.5" />
                Edit details
              </Button>
            )}
            {editing && (
              <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* View mode */}
          {!editing && (
            <div className="text-sm divide-y">
              {[
                { label: 'Sample type', value: sample.sample_type || '—' },
                { label: 'Test required', value: sample.test_required || '—' },
                { label: 'Project name', value: sample.project_name || '—' },
                { label: 'Site location', value: sample.site_location || '—' },
                { label: 'No. of parcels', value: String(sample.num_parcels) },
                { label: 'Total weight', value: `${sample.weight_kg} kg` },
                { label: 'Courier', value: sample.courier_name || '—' },
                { label: 'Courier tracking number', value: sample.awb_number || 'Not assigned' },
                { label: 'Date of sending', value: sample.pickup_date || '—' },
                {
                  label: 'Submitted on',
                  value: new Date(sample.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  }),
                },
                ...(sample.received_at ? [{
                  label: 'Received on',
                  value: new Date(sample.received_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  }),
                }] : []),
                ...(sample.condition ? [{ label: 'Condition on receipt', value: sample.condition }] : []),
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-2.5 gap-4">
                  <span className="text-muted-foreground flex-shrink-0">{item.label}</span>
                  <span className="font-semibold capitalize text-right break-all text-primary">{item.value}</span>
                </div>
              ))}

              {(descRows.length > 0 || attachment) && (
                <div className="py-2.5">
                  <p className="text-muted-foreground mb-2">Sample description</p>
                  {descRows.length > 0 && (
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                      {descRows.map((line, i) => (
                        <p key={i} className="text-sm font-medium text-primary">{line}</p>
                      ))}
                    </div>
                  )}
                  {attachment && (
                    <a href={attachment} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 mt-2 text-sm text-blue-600 hover:underline font-medium">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      View attached document
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Edit mode */}
          {editing && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 font-medium">
                You are editing this sample. All changes will be logged for audit purposes.
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Sample type</Label>
                  <select
                    value={editForm.sample_type}
                    onChange={(e) => setEditForm(f => ({ ...f, sample_type: e.target.value }))}
                    className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select type</option>
                    <option value="soil">Soil</option>
                    <option value="rock">Rock</option>
                    <option value="water">Water</option>
                    <option value="concrete">Concrete</option>
                    <option value="aggregate">Aggregate</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Label>Test required</Label>
                  <Input value={editForm.test_required} onChange={(e) => setEditForm(f => ({ ...f, test_required: e.target.value }))} placeholder="e.g. SPT, CBR..." className="mt-1" />
                </div>

                <div>
                  <Label>Project name</Label>
                  <Input value={editForm.project_name} onChange={(e) => setEditForm(f => ({ ...f, project_name: e.target.value }))} className="mt-1" />
                </div>

                <div>
                  <Label>Site location</Label>
                  <Input value={editForm.site_location} onChange={(e) => setEditForm(f => ({ ...f, site_location: e.target.value }))} className="mt-1" />
                </div>

                <div>
                  <Label>Number of parcels</Label>
                  <Input type="number" min="1" value={editForm.num_parcels} onChange={(e) => setEditForm(f => ({ ...f, num_parcels: e.target.value }))} className="mt-1" />
                </div>

                <div>
                  <Label>Total weight (kg)</Label>
                  <Input type="number" step="0.1" min="0" value={editForm.weight_kg} onChange={(e) => setEditForm(f => ({ ...f, weight_kg: e.target.value }))} className="mt-1" />
                </div>

                <div className="sm:col-span-2">
                  <Label>Remarks</Label>
                  <Input value={editForm.remarks} onChange={(e) => setEditForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Any special handling notes" className="mt-1" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="font-bold" onClick={handleSaveEdit} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>

        {/* Update courier details */}
        {sample.status === 'booked' && (
          <div className="bg-card border rounded-xl p-6 mb-6">
            <h2 className="font-bold text-primary mb-2">Update courier details</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Once you have handed over the parcel to the courier and received a tracking number — update it here.
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
            Tracking timeline is not enabled for your account. Contact our team to request access.
          </div>
        )}

        {/* Other parcels from same project */}
        {relatedParcels.length > 0 && (
          <div className="bg-card border rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-primary">Other parcels from this project ({relatedParcels.length})</h2>
            </div>
            <div className="space-y-2">
              {relatedParcels.map((s) => (
                <Link key={s.id} to={`/parcel/${s.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-primary text-sm">{s.sample_id}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Other parcels from same site */}
        {relatedBySite.length > 0 && (
          <div className="bg-card border rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-primary">Other parcels from this site ({relatedBySite.length})</h2>
            </div>
            <div className="space-y-2">
              {relatedBySite.map((s) => (
                <Link key={s.id} to={`/parcel/${s.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-primary text-sm">{s.sample_id}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-primary">{s.project_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Print label */}
        <div className="text-center">
          <Button variant="outline" onClick={() => setShowTag(!showTag)} className="mb-4">
            {showTag ? 'Hide' : 'Show'} printable label
          </Button>
          {showTag && <SampleIDTag sample={sample} />}
        </div>
      </div>
      <Footer />
    </div>
  )
}