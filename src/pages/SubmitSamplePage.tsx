import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useSamples } from "@/hooks/useSamples";
import { generateSampleId } from "@/lib/sampleId";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Package, ArrowLeft, CheckCircle2, MapPin,
  Loader2, FileText, Upload, X, Plus, Trash2
} from "lucide-react";
import { toast } from "sonner";
import type { SampleType } from "@/types";

type Step = "form" | "done";

interface DescRow {
  id: number
  value: string
}

export default function SubmitSamplePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { createSample } = useSamples();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("form");
  const [generatedId, setGeneratedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const [rows, setRows] = useState<DescRow[]>([{ id: 1, value: '' }]);

  const [form, setForm] = useState({
    sample_type: "" as SampleType | "",
    custom_sample_type: "",
    test_required: "",
    project_name: "",
    site_location: "",
    num_parcels: "1",
    courier_name: "",
    awb_number: "",
    pickup_date: "",
    weight_kg: "",
    remarks: "",
    pickup_time: "09:00",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const addRow = () => {
    setRows(prev => [...prev, { id: Date.now(), value: '' }]);
  };

  const removeRow = (id: number) => {
    if (rows.length === 1) {
      toast.error("At least one row is required");
      return;
    }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: number, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, value } : r));
  };

  const buildDescription = () => {
    return rows
      .filter(r => r.value.trim())
      .map((r, i) => `${i + 1}) ${r.value.trim()}`)
      .join('\n');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.project_name) newErrors.project_name = "Project name is required";
    if (!form.site_location) newErrors.site_location = "Site location is required";
    if (!form.num_parcels || parseInt(form.num_parcels) < 1)
      newErrors.num_parcels = "At least 1 parcel";
    if (!form.pickup_date) newErrors.pickup_date = "Date of sending is required";
    const hasData = rows.some(r => r.value.trim());
    if (!hasData) newErrors.rows = "Please fill at least one sample detail";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      toast.error("GPS not supported on this device");
      return;
    }
    setGpsLoading(true);
    toast.info("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          if (data && data.address) {
            const a = data.address;
            const parts = [
              a.road || a.pedestrian || a.footway,
              a.suburb || a.neighbourhood || a.village,
              a.city || a.town || a.county,
              a.state,
              a.postcode,
            ].filter(Boolean);
            const shortAddress = parts.length > 0 ? parts.join(", ") : `${lat}, ${lng}`;
            setForm((f) => ({ ...f, site_location: shortAddress }));
            toast.success("Location detected — edit if needed");
          } else {
            setForm((f) => ({ ...f, site_location: `${lat}, ${lng}` }));
          }
        } catch {
          setForm((f) => ({ ...f, site_location: `${lat}, ${lng}` }));
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) toast.error("Location permission denied.");
        else if (err.code === 2) toast.error("Location unavailable. Enter manually.");
        else toast.error("Location timed out. Enter manually.");
      },
      { timeout: 15000, enableHighAccuracy: true }
    );
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size must be less than 20MB");
      return;
    }
    setUploadedFile(file);
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${user?.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("sample-docs")
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("sample-docs")
        .getPublicUrl(fileName);
      setUploadedFileUrl(urlData.publicUrl);
      toast.success("File uploaded successfully");
    } catch {
      toast.error("Failed to upload file. Please try again.");
      setUploadedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadedFileUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!user) return;
    setLoading(true);
    try {
      const id = await generateSampleId();
      const description = buildDescription() +
        (uploadedFileUrl ? `\nATTACHMENT: ${uploadedFileUrl}` : '');

      const finalSampleType = form.sample_type === 'other' && form.custom_sample_type
        ? form.custom_sample_type
        : form.sample_type || 'other'

      await createSample.mutateAsync({
        sample_id: id,
        customer_id: user.id,
        sample_type: finalSampleType as SampleType,
        test_required: form.test_required || "Not specified",
        project_name: form.project_name,
        site_location: form.site_location,
        sample_description: description,
        num_parcels: parseInt(form.num_parcels),
        weight_kg: parseFloat(form.weight_kg) || 0,
        pickup_address: `${form.site_location} — ${user.address}`,
        pickup_date: form.pickup_date,
        pickup_time: form.pickup_time,
        courier_name: form.courier_name || "Not assigned",
        awb_number: form.awb_number || undefined,
        status: "booked",
      });
      setGeneratedId(id);
      setStep("done");
      toast.success("Sample created successfully!");
    } catch {
      toast.error("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep("form");
    setGeneratedId("");
    setUploadedFile(null);
    setUploadedFileUrl("");
    setRows([{ id: 1, value: '' }]);
    setForm({
      sample_type: "",
      custom_sample_type: "",
      test_required: "",
      project_name: "",
      site_location: "",
      num_parcels: "1",
      courier_name: "",
      awb_number: "",
      pickup_date: "",
      weight_kg: "",
      remarks: "",
      pickup_time: "09:00",
    });
    setErrors({});
  };

  if (step === "done") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-primary mb-1">Sample Created!</h1>
            <p className="text-muted-foreground text-sm">Write this ID on your parcel before dispatching</p>
          </div>
          <div className="bg-primary rounded-xl p-6 text-center mb-6">
            <p className="text-xs text-primary-foreground/50 uppercase tracking-widest font-bold mb-2">Your Sample ID</p>
            <div className="text-5xl font-black text-secondary font-mono tracking-wider">{generatedId}</div>
          </div>
          <div className="bg-card border rounded-xl p-6 mb-6">
            <h2 className="font-bold text-primary mb-4">What to do next</h2>
            <div className="space-y-4">
              {[
                { num: "1", title: "Write Sample ID on parcel", desc: `Write "${generatedId}" clearly on all your parcels`, done: true },
                { num: "2", title: "Dispatch via courier", desc: "Hand over to your courier service", done: false },
                { num: "3", title: "Get tracking number", desc: "Collect AWB / tracking number from courier", done: false },
                { num: "4", title: "Update tracking details", desc: "Come back to dashboard and update courier + tracking number", done: false },
              ].map((item) => (
                <div key={item.num} className="flex gap-4 items-start">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${item.done ? "bg-secondary text-primary" : "bg-muted text-muted-foreground"}`}>
                    {item.done ? <CheckCircle2 className="h-4 w-4" /> : item.num}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-primary">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 font-bold" onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
            <Button variant="outline" className="flex-1" onClick={resetForm}>Submit another</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link to="/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>

        <h1 className="text-2xl font-black text-primary mb-1">Submit new sample</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Fill in the details — a unique Sample ID will be generated for your parcel
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Sample information */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-primary">Sample information</h2>
            <div className="grid sm:grid-cols-2 gap-4">

              {/* Sample type */}
              <div>
                <Label>Sample type (optional)</Label>
                <select
                  value={form.sample_type}
                  onChange={(e) => setForm((f) => ({ ...f, sample_type: e.target.value as SampleType, custom_sample_type: '' }))}
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
                {form.sample_type === 'other' && (
                  <Input
                    placeholder="Type sample type e.g. Bitumen, Brick..."
                    value={form.custom_sample_type}
                    onChange={(e) => setForm((f) => ({ ...f, custom_sample_type: e.target.value }))}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Test required */}
              <div>
                <Label htmlFor="test">Test required <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="test" placeholder="e.g. SPT, Atterberg Limits, CBR" value={form.test_required} onChange={(e) => setForm((f) => ({ ...f, test_required: e.target.value }))} className="mt-1" />
              </div>

              {/* Project name */}
              <div>
                <Label htmlFor="project">Project name <span className="text-destructive">*</span></Label>
                <Input id="project" placeholder="e.g. NH-44 Highway Project" value={form.project_name} onChange={(e) => setForm((f) => ({ ...f, project_name: e.target.value }))} className="mt-1" />
                {errors.project_name && <p className="text-destructive text-xs mt-1">{errors.project_name}</p>}
              </div>

              {/* Site location */}
              <div>
                <Label htmlFor="site">Site location <span className="text-destructive">*</span></Label>
                <div className="flex gap-2 mt-1">
                  <Input id="site" placeholder="e.g. Km 142, Trichy Road" value={form.site_location} onChange={(e) => setForm((f) => ({ ...f, site_location: e.target.value }))} className="flex-1" />
                  <button type="button" onClick={handleGPS} disabled={gpsLoading}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors whitespace-nowrap flex items-center gap-1 disabled:opacity-50">
                    {gpsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
                    {gpsLoading ? "..." : "GPS"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Click GPS to auto-detect or type manually</p>
                {errors.site_location && <p className="text-destructive text-xs mt-1">{errors.site_location}</p>}
              </div>
            </div>
          </div>

          {/* Sample description */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div>
              <h2 className="font-bold text-primary">Sample description <span className="text-destructive">*</span></h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add each detail as a separate row — e.g. BH No, Soil type, Depth, etc.
              </p>
            </div>

            {errors.rows && <p className="text-destructive text-xs">{errors.rows}</p>}

            <div className="space-y-2">
              {rows.map((row, index) => (
                <div key={row.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </div>
                  <Input
                    value={row.value}
                    onChange={(e) => updateRow(row.id, e.target.value)}
                    placeholder={index === 0 ? "e.g. BH No: BH-01" : "Add more details..."}
                    className="flex-1 h-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addRow();
                      }
                    }}
                  />
                  <button type="button" onClick={() => removeRow(row.id)}
                    className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={addRow}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
              <Plus className="h-4 w-4" />
              Add another row
            </button>

            <p className="text-xs text-muted-foreground">
              💡 Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> in any row to add a new one
            </p>

            {/* File upload */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Attach file (optional)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload any supporting document — PDF, image, Excel, Word etc. (max 20MB)
              </p>
              {!uploadedFile ? (
                <div onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm font-medium text-primary">Click to upload</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Any file type — max 20MB</p>
                  <input ref={fileInputRef} type="file" accept="*" onChange={handleFileSelect} className="hidden" />
                </div>
              ) : (
                <div className="border rounded-xl p-3 bg-muted/30">
                  {uploading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary truncate max-w-[250px]">{uploadedFile.name}</p>
                          <p className="text-xs text-green-600 font-medium">✓ Uploaded successfully</p>
                        </div>
                      </div>
                      <button type="button" onClick={removeFile} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors">
                        <X className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Parcel & dispatch */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-primary">Parcel & dispatch</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parcels">Number of parcels <span className="text-destructive">*</span></Label>
                <Input id="parcels" type="number" min="1" value={form.num_parcels} onChange={(e) => setForm((f) => ({ ...f, num_parcels: e.target.value }))} className="mt-1" />
                {errors.num_parcels && <p className="text-destructive text-xs mt-1">{errors.num_parcels}</p>}
              </div>

              <div>
                <Label htmlFor="weight">Total weight in kg (optional)</Label>
                <Input id="weight" type="number" step="0.1" min="0" placeholder="0.0" value={form.weight_kg} onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="dispatch">Date of sending <span className="text-destructive">*</span></Label>
                <Input id="dispatch" type="date" value={form.pickup_date} min={new Date().toISOString().split("T")[0]} onChange={(e) => setForm((f) => ({ ...f, pickup_date: e.target.value }))} className="mt-1" />
                {errors.pickup_date && <p className="text-destructive text-xs mt-1">{errors.pickup_date}</p>}
              </div>

              <div>
                <Label htmlFor="courier">Courier name (optional)</Label>
                <Input id="courier" placeholder="e.g. Blue Dart, DTDC..." value={form.courier_name} onChange={(e) => setForm((f) => ({ ...f, courier_name: e.target.value }))} className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">You can update this after dispatch</p>
              </div>

              <div>
                <Label htmlFor="tracking">Courier tracking number (optional)</Label>
                <Input id="tracking" placeholder="Enter after handing over to courier" value={form.awb_number} onChange={(e) => setForm((f) => ({ ...f, awb_number: e.target.value }))} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="remarks">Remarks (optional)</Label>
                <Input id="remarks" placeholder="Any special handling notes" value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} className="mt-1" />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            <span className="text-destructive">*</span> Required fields
          </p>

          <Button type="submit" variant="secondary" className="w-full font-bold h-12 text-base" disabled={loading || uploading}>
            {loading ? "Generating…" : "Generate Sample ID & Submit →"}
          </Button>
        </form>
      </div>
    </div>
  );
}