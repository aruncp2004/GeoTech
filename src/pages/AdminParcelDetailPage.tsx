import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useSamples } from "@/hooks/useSamples";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import TrackingTimeline from "@/components/TrackingTimeline";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import type { Sample, SampleStatus, SampleCondition } from "@/types";
import { STATUS_ORDER } from "@/types";

interface DetailRow {
  label: string;
  value: string;
  green?: boolean;
}

interface SampleWithProfile extends Sample {
  profiles?: {
    full_name: string;
    company: string;
  };
}

function parseDescription(desc: string): {
  rows: string[];
  attachment: string | null;
} {
  if (!desc) return { rows: [], attachment: null };
  const lines = desc.split("\n").filter(Boolean);
  const rows: string[] = [];
  let attachment: string | null = null;
  for (const line of lines) {
    if (line.startsWith("ATTACHMENT:")) {
      attachment = line.replace("ATTACHMENT:", "").trim();
    } else {
      rows.push(line);
    }
  }
  return { rows, attachment };
}

export default function AdminParcelDetailPage() {
  const { id } = useParams();
  const { fetchSampleById, updateSample } = useSamples();
  const [sample, setSample] = useState<SampleWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SampleStatus>("booked");
  const [condition, setCondition] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [awb, setAwb] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchSampleById(id);
        if (!cancelled) {
          setSample(data as SampleWithProfile);
          setStatus(data.status);
          setCondition(data.condition || "");
          setNotes(data.notes || "");
          setAwb(data.awb_number || "");
        }
      } catch {
        if (!cancelled) setSample(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, fetchSampleById]);

  const handleUpdate = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateSample.mutateAsync({
        id,
        updates: {
          status,
          condition: (condition as SampleCondition) || undefined,
          notes,
          awb_number: awb,
          ...(status === "received"
            ? { received_at: new Date().toISOString() }
            : {}),
        },
      });
      toast.success("Parcel updated successfully");
    } catch {
      toast.error("Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReceived = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateSample.mutateAsync({
        id,
        updates: {
          status: "received",
          received_at: new Date().toISOString(),
        },
      });
      setStatus("received");
      toast.success("Parcel marked as received");
    } catch {
      toast.error("Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!sample) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-black text-primary mb-4">
            Parcel not found
          </h1>
          <Button variant="secondary" className="font-bold" asChild>
            <Link to="/admin">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const supervisorName =
    sample.profiles?.full_name || sample.customer_name || "—";
  const { rows: descRows, attachment } = parseDescription(
    sample.sample_description || "",
  );

  const detailRows: DetailRow[] = [
    { label: "Supervisor", value: supervisorName },
    { label: "Sample type", value: sample.sample_type || "—" },
    { label: "Project name", value: sample.project_name || "—" },
    { label: "Site location", value: sample.site_location || "—" },
    { label: "Test required", value: sample.test_required || "—" },
    { label: "No. of parcels", value: String(sample.num_parcels) },
    { label: "Total weight", value: `${sample.weight_kg} kg` },
    { label: "Collection address", value: sample.pickup_address || "—" },
    { label: "Date of sending", value: sample.pickup_date || "—" },
    { label: "Collection time", value: sample.pickup_time || "—" },
    { label: "Courier", value: sample.courier_name || "—" },
    {
      label: "Courier tracking number",
      value: sample.awb_number || "Not assigned",
    },
    {
      label: "Submitted on",
      value: new Date(sample.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
    ...(sample.received_at
      ? [
          {
            label: "Received on",
            value: new Date(sample.received_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            green: true,
          },
        ]
      : []),
    ...(sample.condition
      ? [{ label: "Condition on receipt", value: sample.condition }]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <Link
          to="/admin"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        {/* Header */}
        <div className="bg-primary rounded-xl p-6 mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs text-primary-foreground/50 uppercase tracking-widest font-bold mb-1">
              Sample ID
            </p>
            <div className="text-4xl font-black text-secondary font-mono tracking-wider">
              {sample.sample_id}
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Details */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <h2 className="font-bold text-primary mb-4">Sample details</h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-0 text-sm">
            {detailRows.map((item) => (
              <div
                key={item.label}
                className="flex justify-between py-2.5 border-b gap-4"
              >
                <span className="text-muted-foreground flex-shrink-0">
                  {item.label}
                </span>
                <span
                  className={`font-semibold text-right break-all ${item.green ? "text-green-600" : "text-primary"}`}
                >
                  {item.value}
                </span>
              </div>
            ))}

            {/* Sample description */}
            {(descRows.length > 0 || attachment) && (
              <div className="py-2.5">
                <p className="text-muted-foreground mb-2">Sample description</p>
                {descRows.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                    {descRows.map((line, i) => (
                      <p key={i} className="text-sm font-medium text-primary">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
                {attachment && (
                  <a
                    href={attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 mt-2 text-sm text-blue-600 hover:underline font-medium"
                  >
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    View attached document
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <h2 className="font-bold text-primary mb-6">Tracking timeline</h2>
          <TrackingTimeline currentStatus={status} />
        </div>

        {/* Admin controls */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-bold text-primary mb-5">Update parcel</h2>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Update status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as SampleStatus)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Condition on arrival</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intact">Intact</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="awb">Courier tracking number</Label>
              <Input
                id="awb"
                placeholder="Enter tracking number"
                value={awb}
                onChange={(e) => setAwb(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this parcel…"
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="font-bold"
                onClick={handleUpdate}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
              {status !== "received" && (
                <Button
                  variant="outline"
                  onClick={handleMarkReceived}
                  disabled={saving}
                >
                  Mark as received
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
