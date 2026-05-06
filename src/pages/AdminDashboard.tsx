import { useState } from "react";
import { Link } from "react-router-dom";
import { useSamples } from "@/hooks/useSamples";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Bell } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import type { SampleStatus } from "@/types";

export default function AdminDashboard() {
  const { samples, isLoading } = useSamples();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = samples.filter((s) => {
    const supervisorName = s.profiles?.full_name || s.customer_name || "";
    const matchSearch =
      !search ||
      s.sample_id.toLowerCase().includes(search.toLowerCase()) ||
      supervisorName.toLowerCase().includes(search.toLowerCase()) ||
      (s.test_required?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
      (s.courier_name?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
      (s.awb_number?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
      (s.project_name?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
      (s.sample_type?.toLowerCase() ?? "").includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const atCourierCount = samples.filter(
    (s) => s.status === "at_courier",
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-primary">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              All parcels across all supervisors
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/admin/customers"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Manage supervisors →
            </Link>
            <Link
              to="/admin/activity"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Audit logs →
            </Link>
            <Link
              to="/admin/settings"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Settings →
            </Link>
          </div>
        </div>

        {/* At Courier Hub notification banner */}
        {atCourierCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-6 flex items-center gap-3 animate-pulse">
            <div className="w-9 h-9 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-yellow-800 text-sm">
                {atCourierCount} parcel{atCourierCount > 1 ? "s" : ""} at
                courier hub
              </p>
              <p className="text-yellow-700 text-xs mt-0.5">
                {atCourierCount > 1 ? "These parcels have" : "This parcel has"}{" "}
                reached the courier office — action needed
              </p>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total parcels",
              value: samples.length,
              color: "bg-blue-50 text-primary",
            },
            {
              label: "Booked",
              value: samples.filter((s) => s.status === "booked").length,
              color: "bg-blue-50 text-blue-700",
            },
            {
              label: "At Courier Hub",
              value: samples.filter((s) => s.status === "at_courier").length,
              color: "bg-yellow-50 text-yellow-700",
              pulse:
                samples.filter((s) => s.status === "at_courier").length > 0,
            },
            {
              label: "Received at Lab",
              value: samples.filter((s) => s.status === "received").length,
              color: "bg-green-50 text-green-700",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`${card.color} rounded-xl p-4 border relative overflow-hidden`}
            >
              {"pulse" in card && card.pulse && (
                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-yellow-500 rounded-full animate-ping" />
              )}
              <div className="text-3xl font-black mb-1">{card.value}</div>
              <div className="text-xs font-semibold uppercase tracking-wider opacity-70">
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 justify-end">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Sample ID, supervisor, courier…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
              <SelectItem value="at_courier">At Courier Hub</SelectItem>
              <SelectItem value="received">Received at Lab</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Table */}
        {!isLoading && (
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-bold text-primary">
                      Sample ID
                    </th>
                    <th className="text-left p-4 font-bold text-primary hidden sm:table-cell">
                      Supervisor
                    </th>
                    <th className="text-left p-4 font-bold text-primary hidden md:table-cell">
                      Project Name 
                    </th>
                    <th className="text-left p-4 font-bold text-primary hidden md:table-cell">
                      Site location
                    </th>
                    <th className="text-left p-4 font-bold text-primary hidden lg:table-cell">
                      Courier
                    </th>
                    <th className="text-left p-4 font-bold text-primary hidden lg:table-cell">
                      AWB
                    </th>
                    <th className="text-left p-4 font-bold text-primary">
                      Status
                    </th>
                    <th className="text-left p-4 font-bold text-primary hidden sm:table-cell">
                      Dispatch date
                    </th>
                    <th className="text-left p-4 font-bold text-primary hidden xl:table-cell">
                      Received date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr
                      key={s.id}
                      className={`border-b transition-colors ${
                        s.status === "at_courier"
                          ? "bg-yellow-50 hover:bg-yellow-100"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {s.status === "at_courier" && (
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500" />
                            </span>
                          )}
                          <Link
                            to={`/admin/parcel/${s.id}`}
                            className="font-black text-primary font-mono hover:underline"
                          >
                            {s.sample_id}
                          </Link>
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell font-medium">
                        {s.profiles?.full_name || s.customer_name || "—"}
                      </td>
                      <td className="p-4 hidden md:table-cell capitalize text-muted-foreground">
                        {s.project_name}
                      </td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground">
                        {s.site_location}
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        {s.courier_name}
                      </td>
                      <td className="p-4 hidden lg:table-cell text-muted-foreground">
                        {s.awb_number || "—"}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={s.status as SampleStatus} />
                      </td>
                      <td className="p-4 hidden sm:table-cell text-muted-foreground">
                        {formatDate(s.pickup_date)}
                      </td>
                      <td className="p-4 hidden xl:table-cell">
                        {s.received_at ? (
                          <span className="text-green-600 font-medium">
                            {formatDate(s.received_at)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-12 text-center text-muted-foreground"
                      >
                        No parcels found.
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
  );
}
