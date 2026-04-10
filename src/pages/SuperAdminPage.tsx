import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Plus, X, Shield } from 'lucide-react'
import { toast } from 'sonner'
import type { UserProfile } from '@/types'

export default function SuperAdminPage() {
  const [admins, setAdmins] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    designation: 'Admin',
  })

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAdmins(data as UserProfile[])
    }
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabaseAdmin) {
      toast.error('Service key not configured')
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
          company: 'Velciti Consulting Engineers',
          designation: form.designation,
          phone: form.phone,
          address: 'Head Office',
          pincode: '600042',
          role: 'admin',
        },
      })
      if (error) throw error

      // Set role to admin explicitly
      const { data: newUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', form.email)
        .single()

      if (newUser) {
        await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', newUser.id)
      }

      toast.success(`Admin account created for ${form.full_name}`)
      setShowForm(false)
      setForm({ full_name: '', email: '', phone: '', password: '', designation: 'Admin' })
      fetchAdmins()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create admin'
      toast.error(message)
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !current })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update status')
      return
    }

    setAdmins((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: !current } : a))
    )
    const admin = admins.find((a) => a.id === id)
    toast.success(`${admin?.full_name} ${!current ? 'activated' : 'deactivated'}`)
  }

  const changeRole = async (id: string, newRole: 'admin' | 'super_admin') => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update role')
      return
    }

    setAdmins((prev) =>
      prev.map((a) => (a.id === id ? { ...a, role: newRole } : a))
    )
    toast.success('Role updated successfully')
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

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-primary">Super Admin Panel</h1>
              <p className="text-muted-foreground text-sm">Manage admin accounts and roles</p>
            </div>
          </div>
          <Button
            className="bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <><X className="h-4 w-4 mr-1" /> Cancel</>
            ) : (
              <><Plus className="h-4 w-4 mr-1" /> Add admin</>
            )}
          </Button>
        </div>

        {/* Warning banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 text-sm text-yellow-900">
          ⚠️ You are in the Super Admin panel. Changes made here affect system-wide access and roles.
        </div>

        {/* Create admin form */}
        {showForm && (
          <div className="bg-card border rounded-xl p-6 mb-8">
            <h2 className="font-bold text-primary mb-5">Create new admin account</h2>
            <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Full name</Label>
                <Input
                  placeholder="Admin name"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>Designation</Label>
                <Input
                  placeholder="e.g. Lab Manager"
                  value={form.designation}
                  onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>Email address</Label>
                <Input
                  type="email"
                  placeholder="admin@velciti.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>Phone number</Label>
                <Input
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>Temporary password</Label>
                <Input
                  type="password"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
              <div className="sm:col-span-2 flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create admin account'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Admins table */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && (
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-bold text-primary">Name</th>
                    <th className="text-left p-4 font-bold text-primary hidden sm:table-cell">Email</th>
                    <th className="text-left p-4 font-bold text-primary hidden md:table-cell">Phone</th>
                    <th className="text-left p-4 font-bold text-primary">Role</th>
                    <th className="text-left p-4 font-bold text-primary">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b hover:bg-muted/20">
                      <td className="p-4 font-medium">
                        <div>{admin.full_name}</div>
                        <div className="text-xs text-muted-foreground">{admin.designation}</div>
                      </td>
                      <td className="p-4 hidden sm:table-cell text-muted-foreground">{admin.email}</td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground">{admin.phone}</td>
                      <td className="p-4">
                        <select
                          value={admin.role}
                          onChange={(e) => changeRole(admin.id, e.target.value as 'admin' | 'super_admin')}
                          className="text-xs border rounded px-2 py-1 bg-background"
                        >
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <Switch
                          checked={admin.is_active}
                          onCheckedChange={() => toggleActive(admin.id, admin.is_active)}
                        />
                      </td>
                    </tr>
                  ))}
                  {admins.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-muted-foreground">
                        No admin accounts found.
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