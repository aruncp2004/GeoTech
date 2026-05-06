import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  logActivity,
  getActionIcon,
  getActionColor,
  getRoleLabel,
  getRoleBadgeColor,
} from "@/lib/activityLog";
import {
  Shield,
  Users,
  UserCheck,
  UserX,
  Plus,
  X,
  Package,
  Settings,
  ChevronRight,
  ArrowLeft,
  Activity,
  Lock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type { UserProfile, Sample } from "@/types";

type Tab =
  | "overview"
  | "admins"
  | "supervisors"
  | "samples"
  | "logs"
  | "settings";

const ADMIN_DESIGNATIONS = [
  "Lab Manager",
  "Operations Manager",
  "Quality Manager",
  "Technical Manager",
  "Project Manager",
  "Senior Engineer",
  "Geotechnical Engineer",
  "Lab In-charge",
];

export default function SuperAdminPage() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [supervisors, setSupervisors] = useState<UserProfile[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isCustomDesignation, setIsCustomDesignation] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    designation: "",
    role: "admin" as "admin" | "super_admin",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [adminsRes, supervisorsRes, samplesRes, logsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .in("role", ["admin", "super_admin"])
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("*")
        .eq("role", "customer")
        .order("created_at", { ascending: false }),
      supabase
        .from("samples")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    if (adminsRes.data) setAdmins(adminsRes.data as UserProfile[]);
    if (supervisorsRes.data)
      setSupervisors(supervisorsRes.data as UserProfile[]);
    if (samplesRes.data) setSamples(samplesRes.data as Sample[]);
    if (logsRes.data) setLogs(logsRes.data);
    setLoading(false);
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setLogs(data);
    setLogsLoading(false);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseAdmin) {
      toast.error("Service key not configured");
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabaseAdmin.auth.admin.createUser({
        email: form.email,
        password: form.password,
        email_confirm: true,
        user_metadata: {
          full_name: form.full_name,
          company: "Velciti Consulting Engineers",
          designation: form.designation,
          phone: form.phone,
          address: "Head Office",
          pincode: "600042",
        },
      });
      if (error) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await supabase
        .from("profiles")
        .update({ role: form.role })
        .eq("email", form.email);
      if (currentUser) {
        await logActivity({
          actor_id: currentUser.id,
          actor_name: currentUser.full_name,
          actor_role: currentUser.role,
          action: `created ${form.role === "super_admin" ? "Super Admin" : "Admin"} account`,
          target_name: form.full_name,
          target_role: form.role,
          details: `Email: ${form.email} | Designation: ${form.designation}`,
          page: "Super Admin — Admins",
        });
      }
      toast.success(
        `${form.role === "super_admin" ? "Super Admin" : "Admin"} account created for ${form.full_name}`,
      );
      setShowForm(false);
      setIsCustomDesignation(false);
      setForm({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        designation: "",
        role: "admin",
      });
      fetchAll();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create account",
      );
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (
    id: string,
    current: boolean,
    type: "admin" | "supervisor",
  ) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !current })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update");
      return;
    }
    const person = [...admins, ...supervisors].find((p) => p.id === id);
    if (type === "admin") {
      setAdmins((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: !current } : a)),
      );
    } else {
      setSupervisors((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s)),
      );
    }
    if (currentUser && person) {
      await logActivity({
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        actor_role: currentUser.role,
        action: !current ? "activated account" : "deactivated account",
        target_id: id,
        target_name: person.full_name,
        target_role: person.role,
        old_value: `is_active: ${current}`,
        new_value: `is_active: ${!current}`,
        page: `Super Admin — ${type === "admin" ? "Admins" : "Supervisors"}`,
        details: `Account ${!current ? "activated" : "deactivated"} by ${currentUser.full_name}`,
      });
    }
    toast.success(
      `${person?.full_name} ${!current ? "activated" : "deactivated"}`,
    );
  };

  const toggleTracking = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ tracking_access: !current })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update tracking access");
      return;
    }
    const person = supervisors.find((s) => s.id === id);
    setSupervisors((prev) =>
      prev.map((s) => (s.id === id ? { ...s, tracking_access: !current } : s)),
    );
    if (currentUser && person) {
      await logActivity({
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        actor_role: currentUser.role,
        action: !current
          ? "enabled tracking access"
          : "disabled tracking access",
        target_id: id,
        target_name: person.full_name,
        target_role: "customer",
        old_value: `tracking_access: ${current}`,
        new_value: `tracking_access: ${!current}`,
        page: "Super Admin — Supervisors",
        details: `Tracking access ${!current ? "enabled" : "disabled"} for ${person.full_name}`,
      });
    }
    toast.success(
      `Tracking ${!current ? "enabled" : "disabled"} for ${person?.full_name}`,
    );
  };

  const changeRole = async (id: string, newRole: "admin" | "super_admin") => {
    const oldAdmin = admins.find((a) => a.id === id);
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update role");
      return;
    }
    setAdmins((prev) =>
      prev.map((a) => (a.id === id ? { ...a, role: newRole } : a)),
    );
    if (currentUser && oldAdmin) {
      await logActivity({
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        actor_role: currentUser.role,
        action: "changed role",
        target_id: id,
        target_name: oldAdmin.full_name,
        target_role: newRole,
        old_value: `role: ${oldAdmin.role}`,
        new_value: `role: ${newRole}`,
        page: "Super Admin — Admins",
        details: `Role changed from ${oldAdmin.role} to ${newRole}`,
      });
    }
    toast.success("Role updated successfully");
  };

  const sendResetEmail = async (email: string, name: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(`Failed to send reset email to ${name}`);
    } else {
      if (currentUser) {
        await logActivity({
          actor_id: currentUser.id,
          actor_name: currentUser.full_name,
          actor_role: currentUser.role,
          action: "sent password reset email",
          target_name: name,
          page: "Super Admin — Admins",
          details: `Reset email sent to ${email}`,
        });
      }
      toast.success(`Password reset email sent to ${name}`);
    }
  };

  const setPasswordDirectly = async (userId: string, name: string) => {
    if (!supabaseAdmin) {
      toast.error("Service key not configured");
      return;
    }
    const newPassword = prompt(
      `Set new password for ${name} (min 8 characters):`,
    );
    if (!newPassword) return;
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) {
      toast.error("Failed to update password");
    } else {
      if (currentUser) {
        await logActivity({
          actor_id: currentUser.id,
          actor_name: currentUser.full_name,
          actor_role: currentUser.role,
          action: "set password directly",
          target_id: userId,
          target_name: name,
          page: "Super Admin — Admins",
          details: "Password was set directly by Super Admin",
        });
      }
      toast.success(`Password updated for ${name}`);
    }
  };

  const TABS = [
    { id: "overview" as Tab, label: "Overview", icon: Activity },
    { id: "admins" as Tab, label: "Admins", icon: Shield },
    { id: "supervisors" as Tab, label: "Supervisors", icon: Users },
    { id: "samples" as Tab, label: "All Samples", icon: Package },
    { id: "logs" as Tab, label: "Activity Logs", icon: RefreshCw },
    { id: "settings" as Tab, label: "System", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <Link
          to="/admin"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        {/* Header */}
        <div className="bg-primary rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-primary-foreground">
                Super Admin Control Panel
              </h1>
              <p className="text-primary-foreground/60 text-sm">
                Full system access — Velciti Consulting Engineers
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Total Admins", value: admins.length },
              { label: "Total Supervisors", value: supervisors.length },
              { label: "Total Samples", value: samples.length },
              {
                label: "Active Users",
                value: [...admins, ...supervisors].filter((u) => u.is_active)
                  .length,
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-black text-secondary">
                  {stat.value}
                </div>
                <div className="text-xs text-primary-foreground/50 font-medium mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6 text-xs text-yellow-800 flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 flex-shrink-0" />
          Super Admin Panel — changes here affect system-wide access and roles
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl mb-8 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "logs") fetchLogs();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border rounded-xl p-6">
                <h2 className="font-bold text-primary mb-4">
                  Sample Status Breakdown
                </h2>
                <div className="space-y-3">
                  {[
                    {
                      label: "Booked",
                      value: samples.filter((s) => s.status === "booked")
                        .length,
                      color: "bg-blue-500",
                    },
                    {
                      label: "Dispatched",
                      value: samples.filter((s) => s.status === "dispatched")
                        .length,
                      color: "bg-purple-500",
                    },
                    {
                      label: "At Courier Hub",
                      value: samples.filter((s) => s.status === "at_courier")
                        .length,
                      color: "bg-yellow-500",
                    },
                    {
                      label: "Received",
                      value: samples.filter((s) => s.status === "received")
                        .length,
                      color: "bg-green-500",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm flex-1">{item.label}</span>
                      <span className="font-bold text-primary">
                        {item.value}
                      </span>
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full`}
                          style={{
                            width: `${samples.length ? (item.value / samples.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border rounded-xl p-6">
                <h2 className="font-bold text-primary mb-4">User Status</h2>
                <div className="space-y-3">
                  {[
                    {
                      icon: Shield,
                      label: "Active Admins",
                      value: `${admins.filter((a) => a.is_active).length} / ${admins.length}`,
                      color: "text-primary",
                    },
                    {
                      icon: Users,
                      label: "Active Supervisors",
                      value: `${supervisors.filter((s) => s.is_active).length} / ${supervisors.length}`,
                      color: "text-primary",
                    },
                    {
                      icon: UserX,
                      label: "Deactivated",
                      value: String(
                        [...admins, ...supervisors].filter((u) => !u.is_active)
                          .length,
                      ),
                      color: "text-destructive",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <span className={`font-bold ${item.color}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {logs.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-bold text-primary mb-2">
                      Recent Activity
                    </p>
                    <div className="space-y-2">
                      {logs.slice(0, 3).map((log) => (
                        <div
                          key={log.id}
                          className="text-xs text-muted-foreground flex items-center gap-2"
                        >
                          <span className="font-mono">
                            {getActionIcon(log.action)}
                          </span>
                          <span>
                            <span className="font-medium text-foreground">
                              {log.actor_name}
                            </span>{" "}
                            {log.action}
                            {log.target_name && (
                              <span className="font-medium text-foreground">
                                {" "}
                                {log.target_name}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("logs");
                        fetchLogs();
                      }}
                      className="text-xs text-primary hover:underline mt-2"
                    >
                      View all logs →
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-bold text-primary mb-4">Quick Actions</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  {
                    label: "Manage Admins",
                    icon: Shield,
                    tab: "admins" as Tab,
                  },
                  {
                    label: "Manage Supervisors",
                    icon: Users,
                    tab: "supervisors" as Tab,
                  },
                  {
                    label: "View All Samples",
                    icon: Package,
                    tab: "samples" as Tab,
                  },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => setActiveTab(action.tab)}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <action.icon className="h-5 w-5 text-primary" />
                      <span className="font-medium text-sm">
                        {action.label}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ADMINS TAB */}
        {activeTab === "admins" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-primary">
                Admin Accounts
              </h2>
              <Button
                className="bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? (
                  <>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Add account
                  </>
                )}
              </Button>
            </div>

            {showForm && (
              <div className="bg-card border rounded-xl p-6 mb-6">
                <h3 className="font-bold text-primary mb-5">
                  Create new admin / super admin account
                </h3>
                <form
                  onSubmit={handleCreateAdmin}
                  className="grid sm:grid-cols-2 gap-4"
                >
                  <div>
                    <Label>Full name</Label>
                    <Input
                      placeholder="Full name"
                      value={form.full_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, full_name: e.target.value }))
                      }
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label>Designation</Label>
                    <select
                      value={isCustomDesignation ? "custom" : form.designation}
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setIsCustomDesignation(true);
                          setForm((f) => ({ ...f, designation: "" }));
                        } else {
                          setIsCustomDesignation(false);
                          setForm((f) => ({
                            ...f,
                            designation: e.target.value,
                          }));
                        }
                      }}
                      className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      required={!isCustomDesignation}
                    >
                      <option value="">Select designation</option>
                      {ADMIN_DESIGNATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                      <option value="custom">Other (type manually)</option>
                    </select>
                    {isCustomDesignation && (
                      <Input
                        placeholder="Type designation manually"
                        value={form.designation}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            designation: e.target.value,
                          }))
                        }
                        className="mt-2"
                        required
                      />
                    )}
                  </div>
                  <div>
                    <Label>Email address</Label>
                    <Input
                      type="email"
                      placeholder="admin@velciti.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label>Phone number</Label>
                    <Input
                      placeholder="9876543210"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
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
                      onChange={(e) =>
                        setForm((f) => ({ ...f, password: e.target.value }))
                      }
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <select
                      value={form.role}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          role: e.target.value as "admin" | "super_admin",
                        }))
                      }
                      className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Super Admin has full system access
                    </p>
                  </div>
                  <div className="sm:col-span-2 flex gap-3 pt-2">
                    <Button
                      type="submit"
                      className="bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90"
                      disabled={creating}
                    >
                      {creating
                        ? "Creating..."
                        : `Create ${form.role === "super_admin" ? "Super Admin" : "Admin"} account`}
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

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-muted rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-bold text-primary">
                          Name
                        </th>
                        <th className="text-left p-4 font-bold text-primary hidden sm:table-cell">
                          Email
                        </th>
                        <th className="text-left p-4 font-bold text-primary hidden md:table-cell">
                          Phone
                        </th>
                        <th className="text-left p-4 font-bold text-primary">
                          Role
                        </th>
                        <th className="text-left p-4 font-bold text-primary">
                          Active
                        </th>
                        <th className="text-left p-4 font-bold text-primary hidden lg:table-cell">
                          Password
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr
                          key={admin.id}
                          className="border-b hover:bg-muted/20"
                        >
                          <td className="p-4 font-medium">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${admin.is_active ? "bg-green-500" : "bg-red-400"}`}
                              />
                              {admin.full_name}
                            </div>
                            <div className="text-xs text-muted-foreground ml-4">
                              {admin.designation}
                            </div>
                          </td>
                          <td className="p-4 hidden sm:table-cell text-muted-foreground">
                            {admin.email}
                          </td>
                          <td className="p-4 hidden md:table-cell text-muted-foreground">
                            {admin.phone}
                          </td>
                          <td className="p-4">
                            <select
                              value={admin.role}
                              onChange={(e) =>
                                changeRole(
                                  admin.id,
                                  e.target.value as "admin" | "super_admin",
                                )
                              }
                              className={`text-xs border rounded px-2 py-1 bg-background font-medium ${
                                admin.role === "super_admin"
                                  ? "border-purple-300 text-purple-700"
                                  : "border-blue-300 text-blue-700"
                              }`}
                            >
                              <option value="admin">Admin</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <Switch
                              checked={admin.is_active}
                              onCheckedChange={() =>
                                toggleActive(admin.id, admin.is_active, "admin")
                              }
                            />
                          </td>
                          <td className="p-4 hidden lg:table-cell">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() =>
                                  sendResetEmail(admin.email, admin.full_name)
                                }
                                className="text-xs text-blue-600 hover:underline text-left whitespace-nowrap"
                              >
                                Send reset email
                              </button>
                              <button
                                onClick={() =>
                                  setPasswordDirectly(admin.id, admin.full_name)
                                }
                                className="text-xs text-orange-600 hover:underline text-left whitespace-nowrap"
                              >
                                Set password
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {admins.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-12 text-center text-muted-foreground"
                          >
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
        )}

        {/* SUPERVISORS TAB */}
        {activeTab === "supervisors" && (
          <div>
            <h2 className="text-lg font-black text-primary mb-6">
              All Supervisors
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-muted rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
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
                        <th className="text-left p-4 font-bold text-primary hidden lg:table-cell">
                          Phone
                        </th>
                        <th className="text-left p-4 font-bold text-primary">
                          Tracking
                        </th>
                        <th className="text-left p-4 font-bold text-primary">
                          Account
                        </th>
                        <th className="text-left p-4 font-bold text-primary hidden lg:table-cell">
                          Password
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {supervisors.map((s) => (
                        <tr
                          key={s.id}
                          className={`border-b hover:bg-muted/20 ${!s.is_active ? "opacity-50" : ""}`}
                        >
                          <td className="p-4 font-medium">
                            <div className="flex items-center gap-2">
                              {s.is_active ? (
                                <UserCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <UserX className="h-4 w-4 text-destructive flex-shrink-0" />
                              )}
                              {s.full_name}
                            </div>
                            {!s.is_active && (
                              <span className="text-xs text-destructive ml-6">
                                Deactivated
                              </span>
                            )}
                          </td>
                          <td className="p-4 hidden sm:table-cell text-muted-foreground">
                            {s.designation}
                          </td>
                          <td className="p-4 hidden md:table-cell text-muted-foreground">
                            {s.email}
                          </td>
                          <td className="p-4 hidden lg:table-cell text-muted-foreground">
                            {s.phone}
                          </td>
                          <td className="p-4">
                            <Switch
                              checked={s.tracking_access}
                              onCheckedChange={() =>
                                toggleTracking(s.id, s.tracking_access)
                              }
                              disabled={!s.is_active}
                            />
                          </td>
                          <td className="p-4">
                            <Switch
                              checked={s.is_active}
                              onCheckedChange={() =>
                                toggleActive(s.id, s.is_active, "supervisor")
                              }
                            />
                          </td>
                          <td className="p-4 hidden lg:table-cell">
                            <button
                              onClick={() =>
                                sendResetEmail(s.email, s.full_name)
                              }
                              className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                            >
                              Send reset email
                            </button>
                          </td>
                        </tr>
                      ))}
                      {supervisors.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-12 text-center text-muted-foreground"
                          >
                            No supervisors found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SAMPLES TAB */}
        {activeTab === "samples" && (
          <div>
            <h2 className="text-lg font-black text-primary mb-6">
              All Samples — System Wide
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-muted rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-bold text-primary">
                          Sample ID
                        </th>
                        <th className="text-left p-4 font-bold text-primary hidden sm:table-cell">
                          Type
                        </th>
                        <th className="text-left p-4 font-bold text-primary hidden md:table-cell">
                          Courier
                        </th>
                        <th className="text-left p-4 font-bold text-primary hidden md:table-cell">
                          AWB
                        </th>
                        <th className="text-left p-4 font-bold text-primary">
                          Status
                        </th>
                        <th className="text-left p-4 font-bold text-primary hidden sm:table-cell">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {samples.map((s) => (
                        <tr key={s.id} className="border-b hover:bg-muted/20">
                          <td className="p-4 font-mono font-black text-primary text-sm">
                            {s.sample_id}
                          </td>
                          <td className="p-4 hidden sm:table-cell capitalize text-muted-foreground">
                            {s.sample_type}
                          </td>
                          <td className="p-4 hidden md:table-cell text-muted-foreground">
                            {s.courier_name}
                          </td>
                          <td className="p-4 hidden md:table-cell text-muted-foreground">
                            {s.awb_number || "—"}
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                s.status === "received"
                                  ? "bg-green-100 text-green-700"
                                  : s.status === "at_courier"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : s.status === "dispatched"
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {s.status
                                .replace("_", " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                          </td>
                          <td className="p-4 hidden sm:table-cell text-muted-foreground text-xs">
                            {new Date(s.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>
                        </tr>
                      ))}
                      {samples.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-12 text-center text-muted-foreground"
                          >
                            No samples found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ACTIVITY LOGS TAB */}
        {activeTab === "logs" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-primary">Activity Logs</h2>
              <Button
                variant="outline"
                onClick={fetchLogs}
                disabled={logsLoading}
                className="gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${logsLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            {logsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-muted rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground">
                No activity logs yet. Actions like creating admins, changing
                roles, and editing samples will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-card border rounded-xl p-4 flex items-start gap-4"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 font-mono text-sm font-bold text-primary">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-primary text-sm">
                          {log.actor_name}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(log.actor_role)}`}
                        >
                          {getRoleLabel(log.actor_role)}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${getActionColor(log.action)}`}
                        >
                          {log.action}
                        </span>
                        {log.target_name && (
                          <span className="text-sm text-muted-foreground">
                            →{" "}
                            <span className="font-medium text-foreground">
                              {log.target_name}
                            </span>
                          </span>
                        )}
                      </div>

                      {log.details && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.details}
                        </p>
                      )}
                      {log.old_value && (
                        <p className="text-xs mt-1 px-2 py-1 bg-red-50 text-red-700 rounded border border-red-100">
                          Before: {log.old_value}
                        </p>
                      )}
                      {log.new_value && (
                        <p className="text-xs mt-1 px-2 py-1 bg-green-50 text-green-700 rounded border border-green-100">
                          After: {log.new_value}
                        </p>
                      )}
                      {(log.sample_id || log.page) && (
                        <p className="text-xs text-muted-foreground mt-1 flex gap-3">
                          {log.sample_id && (
                            <span className="font-mono">
                              Sample: {log.sample_id}
                            </span>
                          )}
                          {log.page && <span>Page: {log.page}</span>}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 text-right">
                      {new Date(log.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      <br />
                      {new Date(log.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SYSTEM SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-bold text-primary mb-4">
                System Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {[
                  {
                    label: "Organization",
                    value: "Velciti Consulting Engineers Pvt. Ltd.",
                  },
                  { label: "Portal", value: "GeoTech Parcels" },
                  { label: "Domain", value: "geotech.velciti.com" },
                  { label: "Database", value: "Supabase PostgreSQL" },
                  { label: "Hosting", value: "Vercel" },
                  {
                    label: "Total users",
                    value: String(admins.length + supervisors.length),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold text-primary">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-bold text-primary mb-4">Role Permissions</h2>
              <div className="space-y-3 text-sm">
                {[
                  {
                    role: "Super Admin",
                    color: "bg-purple-100 text-purple-700",
                    perms:
                      "Full system access — create admins/super admins, manage all users, view all samples, activity logs, system settings",
                  },
                  {
                    role: "Admin",
                    color: "bg-blue-100 text-blue-700",
                    perms:
                      "Create supervisors, manage samples, update status, view reports, settings",
                  },
                  {
                    role: "Supervisor",
                    color: "bg-green-100 text-green-700",
                    perms:
                      "Submit samples, view own samples, update courier details, edit sample details (booked/picked up only)",
                  },
                ].map((item) => (
                  <div
                    key={item.role}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${item.color}`}
                    >
                      {item.role}
                    </span>
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
  );
}
