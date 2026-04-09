import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  User,
  Lock,
  Building,
  Truck,
  Bell,
  Database,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "password", label: "Password", icon: Lock },
  { id: "lab", label: "Lab details", icon: Building },
  { id: "couriers", label: "Couriers", icon: Truck },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "data", label: "Data retention", icon: Database },
];

const DEFAULT_COURIERS = [
  { id: "bluedart", name: "Blue Dart", enabled: true },
  { id: "delhivery", name: "Delhivery", enabled: true },
  { id: "dtdc", name: "DTDC", enabled: true },
  { id: "xpressbees", name: "XpressBees", enabled: true },
  { id: "ecomexpress", name: "Ecom Express", enabled: true },
];

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  // Profile
  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    designation: user?.designation || "",
  });

  // Password
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  // Lab details
  const [lab, setLab] = useState({
    name: "Velciti Consulting Engineers Pvt. Ltd.",
    address: "Velachery, Chennai — 600 042",
    phone: "+91 44-XXXX-XXXX",
    email: "support@velciti.com",
    nabl: "NABL Accredited",
    website: "https://velciti.com",
  });

  // Couriers
  const [couriers, setCouriers] = useState(DEFAULT_COURIERS);

  // Notifications
  const [notifications, setNotifications] = useState({
    parcel_received: true,
    new_submission: true,
    status_update: false,
    daily_summary: false,
  });

  // Data retention
  const [retention] = useState({
    days: 30,
    total_records: 0,
    oldest_received: null as string | null,
  });

  useEffect(() => {
    fetchStats();
  }, []);

 const fetchStats = async () => {
  await supabase
    .from("samples")
    .select("*", { count: "exact", head: true })
    .eq("status", "received")
}

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          designation: profile.designation,
        })
        .eq("id", user?.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwords.new.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });
      if (error) throw error;
      toast.success("Password changed successfully");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch {
      toast.error("Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleLabSave = () => {
    toast.success("Lab details saved");
  };

  const handleNotificationSave = () => {
    toast.success("Notification preferences saved");
  };

  const toggleCourier = (id: string) => {
    setCouriers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
    );
  };

  const handleCourierSave = async () => {
    setSaving(true);
    try {
      for (const courier of couriers) {
        await supabase
          .from("couriers")
          .update({ enabled: courier.enabled })
          .eq("id", courier.id);
      }
      toast.success("Courier settings saved");
    } catch {
      toast.error("Failed to save courier settings");
    } finally {
      setSaving(false);
    }
  };

  const handleManualCleanup = async () => {
    const confirmed = window.confirm(
      "This will permanently delete all received parcels older than 30 days. Are you sure?",
    );

    if (!confirmed) return;

    setSaving(true);
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - retention.days);

      const { error, count } = await supabase
        .from("samples")
        .delete({ count: "exact" })
        .eq("status", "received")
        .lt("received_at", cutoff.toISOString());

      if (error) throw error;

      toast.success(`Deleted ${count || 0} old records`);
    } catch {
      toast.error("Cleanup failed");
    } finally {
      setSaving(false);
    }
  };

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

        <h1 className="text-2xl font-black text-primary mb-8">Settings</h1>

        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3">
            <nav className="flex flex-col gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="col-span-12 md:col-span-9">
            {/* PROFILE */}
            {activeTab === "profile" && (
              <div className="bg-card border rounded-xl p-6">
                <h2 className="font-bold text-primary text-lg mb-1">Profile</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Update your personal information
                </p>
                <Separator className="mb-6" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full name</Label>
                    <Input
                      value={profile.full_name}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, full_name: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Designation</Label>
                    <Input
                      value={profile.designation}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          designation: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Email address</Label>
                    <Input
                      value={profile.email}
                      disabled
                      className="mt-1 bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email cannot be changed here
                    </p>
                  </div>
                  <div>
                    <Label>Phone number</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, phone: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <Button
                    variant="secondary"
                    className="font-bold"
                    onClick={handleProfileSave}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save profile"}
                  </Button>
                </div>
              </div>
            )}

            {/* PASSWORD */}
            {activeTab === "password" && (
              <div className="bg-card border rounded-xl p-6">
                <h2 className="font-bold text-primary text-lg mb-1">
                  Change password
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Update your admin account password
                </p>
                <Separator className="mb-6" />
                <div className="space-y-4 max-w-sm">
                  <div>
                    <Label>New password</Label>
                    <Input
                      type="password"
                      placeholder="Min 8 characters"
                      value={passwords.new}
                      onChange={(e) =>
                        setPasswords((p) => ({ ...p, new: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Confirm new password</Label>
                    <Input
                      type="password"
                      placeholder="Re-enter new password"
                      value={passwords.confirm}
                      onChange={(e) =>
                        setPasswords((p) => ({ ...p, confirm: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <Button
                    variant="secondary"
                    className="font-bold"
                    onClick={handlePasswordChange}
                    disabled={saving}
                  >
                    {saving ? "Changing…" : "Change password"}
                  </Button>
                </div>
              </div>
            )}

            {/* LAB DETAILS */}
            {activeTab === "lab" && (
              <div className="bg-card border rounded-xl p-6">
                <h2 className="font-bold text-primary text-lg mb-1">
                  Lab details
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  These details appear on sample labels and notifications
                </p>
                <Separator className="mb-6" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label>Laboratory name</Label>
                    <Input
                      value={lab.name}
                      onChange={(e) =>
                        setLab((l) => ({ ...l, name: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Address</Label>
                    <Input
                      value={lab.address}
                      onChange={(e) =>
                        setLab((l) => ({ ...l, address: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={lab.phone}
                      onChange={(e) =>
                        setLab((l) => ({ ...l, phone: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={lab.email}
                      onChange={(e) =>
                        setLab((l) => ({ ...l, email: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Accreditation</Label>
                    <Input
                      value={lab.nabl}
                      onChange={(e) =>
                        setLab((l) => ({ ...l, nabl: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input
                      value={lab.website}
                      onChange={(e) =>
                        setLab((l) => ({ ...l, website: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <Button
                    variant="secondary"
                    className="font-bold"
                    onClick={handleLabSave}
                  >
                    Save lab details
                  </Button>
                </div>
              </div>
            )}

            {/* COURIERS */}
            {activeTab === "couriers" && (
              <div className="bg-card border rounded-xl p-6">
                <h2 className="font-bold text-primary text-lg mb-1">
                  Courier management
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Enable or disable couriers shown to supervisors
                </p>
                <Separator className="mb-6" />
                <div className="space-y-3">
                  {couriers.map((courier) => (
                    <div
                      key={courier.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-black text-primary">
                            {courier.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-sm">
                          {courier.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCourier(courier.id)}
                        // The outer track
                        className={`w-11 h-6 rounded-full transition-colors duration-200 relative flex items-center ${
                          courier.enabled ? "bg-secondary" : "bg-muted"
                        }`}
                      >
                        {/* The sliding circle (Thumb) */}
                        <span
                          className={`absolute w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                            courier.enabled
                              ? "translate-x-5"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button
                    variant="secondary"
                    className="font-bold"
                    onClick={handleCourierSave}
                  >
                    Save courier settings
                  </Button>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="bg-card border rounded-xl p-6">
                <h2 className="font-bold text-primary text-lg mb-1">
                  Notifications
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Choose what email alerts you receive
                </p>
                <Separator className="mb-6" />
                <div className="space-y-4">
                  {[
                    {
                      key: "parcel_received",
                      label: "Parcel received at lab",
                      desc: "Get notified when lab marks a parcel as received",
                    },
                    {
                      key: "new_submission",
                      label: "New sample submitted",
                      desc: "Get notified when a supervisor submits a new sample",
                    },
                    {
                      key: "status_update",
                      label: "Status updates",
                      desc: "Get notified when parcel status changes",
                    },
                    {
                      key: "daily_summary",
                      label: "Daily summary",
                      desc: "Receive a daily report of all active parcels every morning",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-start justify-between p-4 border rounded-lg gap-4"
                    >
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                      <button
                        type="button" // Important: prevents accidental form submission
                        onClick={() =>
                          setNotifications((n) => ({
                            ...n,
                            [item.key]: !n[item.key as keyof typeof n],
                          }))
                        }
                        className={`w-11 h-6 rounded-full transition-colors duration-200 relative flex items-center flex-shrink-0 ${
                          notifications[item.key as keyof typeof notifications]
                            ? "bg-secondary"
                            : "bg-muted"
                        }`}
                      >
                        <span
                          className={`absolute w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${
                            notifications[
                              item.key as keyof typeof notifications
                            ]
                              ? "translate-x-5"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button
                    variant="secondary"
                    className="font-bold"
                    onClick={handleNotificationSave}
                  >
                    Save notification settings
                  </Button>
                </div>
              </div>
            )}

            {/* DATA RETENTION */}
            {activeTab === "data" && (
              <div className="bg-card border rounded-xl p-6">
                <h2 className="font-bold text-primary text-lg mb-1">
                  Data retention
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Manage how long records are kept in the system
                </p>
                <Separator className="mb-6" />

                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-primary mb-1">
                      {retention.days}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Days retention
                    </div>
                  </div>
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-primary mb-1">
                      Auto
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Cleanup schedule
                    </div>
                  </div>
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-primary mb-1">
                      Daily
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Runs at midnight
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        Automatic cleanup is active
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Records marked as "Received" are automatically deleted
                        30 days after receipt date. This runs daily at midnight
                        via Supabase scheduled function.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-sm text-primary mb-1">
                      Manual cleanup
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Manually delete all received parcels older than 30 days
                      right now. This action cannot be undone.
                    </p>
                    <Button
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                      onClick={handleManualCleanup}
                      disabled={saving}
                    >
                      {saving ? "Deleting…" : "Run manual cleanup now"}
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-sm text-primary mb-1">
                      What gets deleted
                    </h3>
                    <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                      <li>✓ Sample records with status "Received"</li>
                      <li>✓ Associated courier and AWB details</li>
                      <li>✓ Condition notes and lab receipt logs</li>
                      <li>
                        ✗ Supervisor accounts — never deleted automatically
                      </li>
                      <li>
                        ✗ Active parcels (Booked / In transit) — never deleted
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
