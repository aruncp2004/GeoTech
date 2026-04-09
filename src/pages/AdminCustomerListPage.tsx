import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UserProfile } from '@/types'

export default function AdminCustomerListPage() {
  const [supervisors, setSupervisors] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const canCreateSupervisors = Boolean(supabaseAdmin)
  const [form, setForm] = useState({
    full_name: '',
    company: 'Velciti Consulting Engineers',
    designation: '',
    email: '',
    phone: '',
    address: '',
    pincode: '',
    password: '',
  })

  useEffect(() => {
    fetchSupervisors()
  }, [])

  const fetchSupervisors = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSupervisors(data as UserProfile[])
    }
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supabaseAdmin) {
      toast.error(
        'Supervisor creation is not configured. Add the service key or move this flow to a secure backend.'
      )
      return
    }

    setCreating(true)
    try {
      const { error } = await supabaseAdmin.auth.admin.createUser({
        email: form.email,
        password: form.password,
        email_confirm: true,
        user_metadata: {
          full_name: form.full_name,
          company: form.company,
          designation: form.designation,
          phone: form.phone,
          address: form.address,
          pincode: form.pincode,
        },
      })

      if (error) throw error

      toast.success(`Account created for ${form.full_name}`)
      setShowForm(false)
      setForm({
        full_name: '',
        company: 'Velciti Consulting Engineers',
        designation: '',
        email: '',
        phone: '',
        address: '',
        pincode: '',
        password: '',
      })
      fetchSupervisors()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create account'
      toast.error(message)
    } finally {
      setCreating(false)
    }
  }

  const toggleAccess = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ tracking_access: !current })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update access')
      return
    }

    setSupervisors((prev) =>
      prev.map((supervisor) =>
        supervisor.id === id
          ? { ...supervisor, tracking_access: !current }
          : supervisor
      )
    )

    const supervisor = supervisors.find((item) => item.id === id)
    toast.success(
      `Tracking access ${!current ? 'granted to' : 'revoked from'} ${supervisor?.full_name}`
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <Link
          to="/admin"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-black text-primary">
            Field supervisors
          </h1>
          <Button
            variant="secondary" className="font-bold"
            onClick={() => setShowForm(!showForm)}
            disabled={!canCreateSupervisors}
          >
            {showForm ? (
              <>
                <X className="h-4 w-4 mr-1" /> Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" /> Add supervisor
              </>
            )}
          </Button>
        </div>
        <p className="text-muted-foreground text-sm mb-8">
          Manage field supervisor accounts and tracking access
        </p>

        {!canCreateSupervisors && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 mb-8 text-sm">
            Supervisor creation is disabled in this environment because the
            service key is not configured. For production, move this flow to a
            secure Edge Function or backend endpoint.
          </div>
        )}

        {showForm && (
          <div className="bg-card border rounded-xl p-6 mb-8">
            <h2 className="font-bold text-primary mb-5">
              Create new supervisor account
            </h2>
            <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  placeholder="Rajesh Kumar"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      full_name: e.target.value,
                    }))
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  placeholder="Field Supervisor"
                  value={form.designation}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      designation: e.target.value,
                    }))
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="rajesh@velciti.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      email: e.target.value,
                    }))
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      phone: e.target.value,
                    }))
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">Site / office address</Label>
                <Input
                  id="address"
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      address: e.target.value,
                    }))
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  placeholder="600042"
                  value={form.pincode}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      pincode: e.target.value,
                    }))
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Temporary password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      password: e.target.value,
                    }))
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div className="sm:col-span-2 flex gap-3 pt-2">
                <Button
                  type="submit"
                  variant="secondary" className="font-bold"
                  disabled={creating || !canCreateSupervisors}
                >
                  {creating ? 'Creating account...' : 'Create account'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="h-14 bg-muted rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && (
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-bold text-primary">
                      Name
                    </th>
                    <th className="text-left p-4 font-bold text-primary hidden sm:table-cell">
                      Designation
                    </th>
                    <th className="text-left p-4 font-bold text-primary hidden md:table-cell">
                      Email
                    </th>
                    <th className="text-left p-4 font-bold text-primary hidden md:table-cell">
                      Phone
                    </th>
                    <th className="text-left p-4 font-bold text-primary hidden lg:table-cell">
                      Pincode
                    </th>
                    <th className="text-left p-4 font-bold text-primary">
                      Tracking access
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {supervisors.map((supervisor) => (
                    <tr
                      key={supervisor.id}
                      className="border-b hover:bg-muted/20"
                    >
                      <td className="p-4 font-medium">
                        {supervisor.full_name}
                      </td>
                      <td className="p-4 hidden sm:table-cell text-muted-foreground">
                        {supervisor.designation}
                      </td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground">
                        {supervisor.email}
                      </td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground">
                        {supervisor.phone}
                      </td>
                      <td className="p-4 hidden lg:table-cell text-muted-foreground">
                        {supervisor.pincode}
                      </td>
                      <td className="p-4">
                        <Switch
                          checked={supervisor.tracking_access}
                          onCheckedChange={() =>
                            toggleAccess(
                              supervisor.id,
                              supervisor.tracking_access
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                  {supervisors.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-12 text-center text-muted-foreground"
                      >
                        No supervisors added yet. Click "Add supervisor" to
                        create the first account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
