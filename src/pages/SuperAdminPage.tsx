import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Shield, Users, UserCheck, UserX, Plus, X,
  Package, Settings, ChevronRight, ArrowLeft,
  Activity, Lock
} from 'lucide-react'
import { toast } from 'sonner'
import type { UserProfile, Sample } from '@/types'

type Tab = 'overview' | 'admins' | 'supervisors' | 'samples' | 'settings'

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [admins, setAdmins] = useState<UserProfile[]>([])
  const [supervisors, setSupervisors] = useState<UserProfile[]>([])
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    designation: 'Lab Manager',
  })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [adminsRes, supervisorsRes, samplesRes] = await Promise.all([
      supabase.from('profiles').select('*').in('role', ['admin', 'super_admin']).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false }),
      supabase.from('samples').select('*').order('created_at', { ascending: false }),
    ])
    if (adminsRes.data) setAdmins(adminsRes.data as UserProfile[])
    if (supervisorsRes.data) setSupervisors(supervisorsRes.data as UserProfile[])
    if (samplesRes.data) setSamples(samplesRes.data as Sample[])
    setLoading(false)
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
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
        },
      })
      if (error) throw error

      await new Promise(resolve => setTimeout(resolve, 1000))
      await supabase.from('profiles').update({ role: 'admin' }).eq('email', form.email)

      toast.success(`Admin account created for ${form.full_name}`)
      setShowForm(false)
      setForm({ full_name: '', email: '', phone: '', password: '', designation: 'Lab Manager' })
      fetchAll()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create admin')
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (id: string, current: boolean, type: 'admin' | 'supervisor') => {
    const { error } = await supabase.from('profiles').update({ is_active: !current }).eq('id', id)
    if (error) { toast.error('Failed to update'); return }
    if (type === 'admin') {
      setAdmins(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a))
    } else {
      setSupervisors(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s))
    }
    const person = [...admins, ...supervisors].find(p => p.id === id)
    toast.success(`${person?.full_name} ${!current ? 'activated' : 'deactivated'}`)
  }

  const changeRole = async (id: string, newRole: 'admin' | 'super_admin') => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    if (error) { toast.error('Failed to update role'); return }
    setAdmins(prev => prev.map(a => a.id === id ? { ...a, role: newRole } : a))
    toast.success('Role updated successfully')
  }

  const TABS = [
    { id: 'overview' as Tab, label: 'Overview', icon: Activity },
    { id: 'admins' as Tab, label: 'Admins', icon: Shield },
    { id: 'supervisors' as Tab, label: 'Supervisors', icon: Users },
    { id: 'samples' as Tab, label: 'All Samples', icon: Package },
    { id: 'settings' as Tab, label: 'System', icon: Settings },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <Link to="/admin" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        {/* Header */}
        <div className="bg-primary rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-primary-foreground">Super Admin Control Panel</h1>
              <p className="text-primary-foreground/60 text-sm">Full system access — Velciti Consulting Engineers</p>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Total Admins', value: admins.length, icon: Shield },
              { label: 'Total Supervisors', value: supervisors.length, icon: Users },
              { label: 'Total Samples', value: samples.length, icon: Package },
              { label: 'Active Users', value: [...admins, ...supervisors].filter(u => u.is_active).length, icon: UserCheck },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-black text-secondary">{stat.value}</div>
                <div className="text-xs text-primary-foreground/50 font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-900 flex items-center gap-2">
          <Lock className="h-4 w-4 flex-shrink-0" />
          You are in the Super Admin panel. Changes made here affect system-wide access and roles.
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl mb-8 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Sample status breakdown */}
              <div className="bg-card border rounded-xl p-6">
                <h2 className="font-bold text-primary mb-4">Sample Status Breakdown</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Booked', value: samples.filter(s => s.status === 'booked').length, color: 'bg-blue-500' },
                    { label: 'Picked Up', value: samples.filter(s => s.status === 'picked_up').length, color: 'bg-purple-500' },
                    { label: 'In Transit', value: samples.filter(s => s.status === 'in_transit').length, color: 'bg-yellow-500' },
                    { label: 'Received', value: samples.filter(s => s.status === 'received').length, color: 'bg-green-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm flex-1">{item.label}</span>
                      <span className="font-bold text-primary">{item.value}</span>
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full`}
                          style={{ width: `${samples.length ? (item.value / samples.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User status */}
              <div className="bg-card border rounded-xl p-6">
                <h2 className="font-bold text-primary mb-4">User Status</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm">Active Admins</span>
                    </div>
                    <span className="font-bold text-primary">{admins.filter(a => a.is_active).length} / {admins.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm">Active Supervisors</span>
                    </div>
                    <span className="font-bold text-primary">{supervisors.filter(s => s.is_active).length} / {supervisors.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-destructive" />
                      <span className="text-sm">Deactivated Accounts</span>
                    </div>
                    <span className="font-bold text-destructive">
                      {[...admins, ...supervisors].filter(u => !u.is_active).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-bold text-primary mb-4">Quick Actions</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setActiveTab('admins')}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-medium text-sm">Manage Admins</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setActiveTab('supervisors')}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-medium text-sm">Manage Supervisors</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setActiveTab('samples')}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-primary" />
                    <span className="font-medium text-sm">View All Samples</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADMINS TAB */}
        {activeTab === 'admins' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-primary">Admin Accounts</h2>
              <Button
                className="bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? <><X className="h-4 w-4 mr-1" /> Cancel</> : <><Plus className="h-4 w-4 mr-1" /> Add admin</>}
              </Button>
            </div>

            {showForm && (
              <div className="bg-card border rounded-xl p-6 mb-6">
                <h3 className="font-bold text-primary mb-5">Create new admin account</h3>
                <form onSubmit={handleCreateAdmin} className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full name</Label>
                    <Input placeholder="Admin name" value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} className="mt-1" required />
                  </div>
                  <div>
                    <Label>Designation</Label>
                    <Input placeholder="e.g. Lab Manager" value={form.designation} onChange={(e) => setForm(f => ({ ...f, designation: e.target.value }))} className="mt-1" required />
                  </div>
                  <div>
                    <Label>Email address</Label>
                    <Input type="email" placeholder="admin@velciti.com" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" required />
                  </div>
                  <div>
                    <Label>Phone number</Label>
                    <Input placeholder="9876543210" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" required />
                  </div>
                  <div>
                    <Label>Temporary password</Label>
                    <Input type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className="mt-1" required />
                  </div>
                  <div className="sm:col-span-2 flex gap-3 pt-2">
                    <Button type="submit" className="bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90" disabled={creating}>
                      {creating ? 'Creating...' : 'Create admin account'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : (
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
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${admin.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                              {admin.full_name}
                            </div>
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
                            <Switch checked={admin.is_active} onCheckedChange={() => toggleActive(admin.id, admin.is_active, 'admin')} />
                          </td>
                        </tr>
                      ))}
                      {admins.length === 0 && (
                        <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No admin accounts found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUPERVISORS TAB */}
        {activeTab === 'supervisors' && (
          <div>
            <h2 className="text-lg font-black text-primary mb-6">All Supervisors</h2>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : (
              <div className="bg-card rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-bold text-primary">Name</th>
                        <th className="text-left p-4 font-bold text-primary hidden sm:table-cell">Designation</th>
                        <th className="text-left p-4 font-bold text-primary hidden md:table-cell">Email</th>
                        <th className="text-left p-4 font-bold text-primary hidden lg:table-cell">Phone</th>
                        <th className="text-left p-4 font-bold text-primary">Tracking</th>
                        <th className="text-left p-4 font-bold text-primary">Account</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supervisors.map((s) => (
                        <tr key={s.id} className={`border-b hover:bg-muted/20 ${!s.is_active ? 'opacity-50' : ''}`}>
                          <td className="p-4 font-medium">
                            <div className="flex items-center gap-2">
                              {s.is_active ? <UserCheck className="h-4 w-4 text-green-500" /> : <UserX className="h-4 w-4 text-destructive" />}
                              {s.full_name}
                            </div>
                          </td>
                          <td className="p-4 hidden sm:table-cell text-muted-foreground">{s.designation}</td>
                          <td className="p-4 hidden md:table-cell text-muted-foreground">{s.email}</td>
                          <td className="p-4 hidden lg:table-cell text-muted-foreground">{s.phone}</td>
                          <td className="p-4">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.tracking_access ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                              {s.tracking_access ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td className="p-4">
                            <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s.id, s.is_active, 'supervisor')} />
                          </td>
                        </tr>
                      ))}
                      {supervisors.length === 0 && (
                        <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">No supervisors found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SAMPLES TAB */}
        {activeTab === 'samples' && (
          <div>
            <h2 className="text-lg font-black text-primary mb-6">All Samples — System Wide</h2>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : (
              <div className="bg-card rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-bold text-primary">Sample ID</th>
                        <th className="text-left p-4 font-bold text-primary hidden sm:table-cell">Type</th>
                        <th className="text-left p-4 font-bold text-primary hidden md:table-cell">Courier</th>
                        <th className="text-left p-4 font-bold text-primary hidden md:table-cell">AWB</th>
                        <th className="text-left p-4 font-bold text-primary">Status</th>
                        <th className="text-left p-4 font-bold text-primary hidden sm:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {samples.map((s) => (
                        <tr key={s.id} className="border-b hover:bg-muted/20">
                          <td className="p-4 font-mono font-black text-primary text-sm">{s.sample_id}</td>
                          <td className="p-4 hidden sm:table-cell capitalize text-muted-foreground">{s.sample_type}</td>
                          <td className="p-4 hidden md:table-cell text-muted-foreground">{s.courier_name}</td>
                          <td className="p-4 hidden md:table-cell text-muted-foreground">{s.awb_number || '—'}</td>
                          <td className="p-4">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              s.status === 'received' ? 'bg-green-100 text-green-700' :
                              s.status === 'in_transit' ? 'bg-yellow-100 text-yellow-700' :
                              s.status === 'picked_up' ? 'bg-purple-100 text-purple-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {s.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </td>
                          <td className="p-4 hidden sm:table-cell text-muted-foreground text-xs">
                            {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                      {samples.length === 0 && (
                        <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">No samples found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SYSTEM SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-bold text-primary mb-4">System Information</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Organization', value: 'Velciti Consulting Engineers Pvt. Ltd.' },
                  { label: 'Portal', value: 'GeoTech Labs' },
                  { label: 'Domain', value: 'geotech.velciti.com' },
                  { label: 'Database', value: 'Supabase PostgreSQL' },
                  { label: 'Hosting', value: 'Vercel' },
                  { label: 'Total users', value: String(admins.length + supervisors.length) },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-bold text-primary mb-4">Role Permissions</h2>
              <div className="space-y-3 text-sm">
                {[
                  { role: 'Super Admin', color: 'bg-purple-100 text-purple-700', perms: 'Full system access — create admins, manage all users, view all samples, system settings' },
                  { role: 'Admin', color: 'bg-blue-100 text-blue-700', perms: 'Create supervisors, manage samples, update status, view reports, settings' },
                  { role: 'Supervisor', color: 'bg-green-100 text-green-700', perms: 'Submit samples, view own samples, update courier details, add remarks' },
                ].map((item) => (
                  <div key={item.role} className="flex items-start gap-3 p-3 border rounded-lg">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${item.color}`}>{item.role}</span>
                    <span className="text-muted-foreground">{item.perms}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  )
}