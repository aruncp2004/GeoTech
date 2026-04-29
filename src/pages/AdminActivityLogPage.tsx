import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getActionIcon,
  getActionColor,
  getRoleLabel,
  getRoleBadgeColor,
} from "@/lib/activityLog";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.actor_name?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.sample_id?.toLowerCase().includes(q) ||
      log.target_name?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">

        <Link
          to="/admin"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-primary">Activity Logs</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Full audit trail of all actions in the system
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchLogs}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, action, sample ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Logs */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground">
            {search ? "No logs match your search." : "No activity logs yet."}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((log) => (
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
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(log.actor_role)}`}>
                      {getRoleLabel(log.actor_role)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    {log.target_name && (
                      <span className="text-sm text-muted-foreground">
                        → <span className="font-medium text-foreground">{log.target_name}</span>
                      </span>
                    )}
                  </div>

                  {log.details && (
                    <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
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
                        <span className="font-mono">Sample: {log.sample_id}</span>
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
      <Footer />
    </div>
  );
}