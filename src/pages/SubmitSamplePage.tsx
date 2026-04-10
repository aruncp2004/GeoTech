import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useSamples } from "@/hooks/useSamples";
import { generateSampleId } from "@/lib/sampleId";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, ArrowLeft, CheckCircle2, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SampleType } from "@/types";

type Step = "form" | "done";

export default function SubmitSamplePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { createSample } = useSamples();

  const [step, setStep] = useState<Step>("form");
  const [generatedId, setGeneratedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [form, setForm] = useState({
    sample_type: "" as SampleType | "",
    test_required: "",
    project_name: "",
    site_location: "",
    sample_description: "",
    num_parcels: "1",
    courier_name: "",
    awb_number: "",
    pickup_date: "",
    weight_kg: "",
    remarks: "",
    pickup_time: "09:00",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.sample_type) newErrors.sample_type = "Select a sample type";
    if (!form.project_name) newErrors.project_name = "Project name is required";
    if (!form.site_location) newErrors.site_location = "Site location is required";
    if (!form.sample_description) newErrors.sample_description = "Sample description is required";
    if (!form.num_parcels || parseInt(form.num_parcels) < 1)
      newErrors.num_parcels = "At least 1 parcel";
    if (!form.pickup_date) newErrors.pickup_date = "Dispatch date is required";
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
            const shortAddress = parts.length > 0
              ? parts.join(", ")
              : `${lat}, ${lng}`;
            setForm((f) => ({ ...f, site_location: shortAddress }));
            toast.success("Location detected — edit if needed");
          } else {
            setForm((f) => ({ ...f, site_location: `${lat}, ${lng}` }));
            toast.success("Coordinates captured — edit if needed");
          }
        } catch {
          setForm((f) => ({ ...f, site_location: `${lat}, ${lng}` }));
          toast.success("Coordinates captured");
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          toast.error("Location permission denied. Please allow location access and try again.");
        } else if (err.code === 2) {
          toast.error("Location unavailable. Please enter manually.");
        } else {
          toast.error("Location timed out. Please enter manually.");
        }
      },
      { timeout: 15000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!user) return;
    setLoading(true);
    try {
      const id = generateSampleId();
      await createSample.mutateAsync({
        sample_id: id,
        customer_id: user.id,
        sample_type: form.sample_type as SampleType,
        test_required: form.test_required || "Not specified",
        project_name: form.project_name,
        site_location: form.site_location,
        sample_description: form.sample_description,
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
    setForm({
      sample_type: "",
      test_required: "",
      project_name: "",
      site_location: "",
      sample_description: "",
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
            <p className="text-muted-foreground text-sm">
              Write this ID on your parcel before dispatching
            </p>
          </div>

          <div className="bg-primary rounded-xl p-6 text-center mb-6">
            <p className="text-xs text-primary-foreground/50 uppercase tracking-widest font-bold mb-2">
              Your Sample ID
            </p>
            <div className="text-5xl font-black text-secondary font-mono tracking-wider">
              {generatedId}
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 mb-6">
            <h2 className="font-bold text-primary mb-4">What to do next</h2>
            <div className="space-y-4">
              {[
                {
                  num: "1",
                  title: "Write Sample ID on parcel",
                  desc: `Write "${generatedId}" clearly on all your parcels`,
                  done: true,
                },
                {
                  num: "2",
                  title: "Dispatch via courier",
                  desc: "Hand over to your courier service",
                  done: false,
                },
                {
                  num: "3",
                  title: "Get tracking number",
                  desc: "Collect AWB / tracking number from courier",
                  done: false,
                },
                {
                  num: "4",
                  title: "Update tracking details",
                  desc: "Come back to dashboard and update courier + tracking number",
                  done: false,
                },
              ].map((item) => (
                <div key={item.num} className="flex gap-4 items-start">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      item.done ? "bg-secondary text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
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
            <Button
              variant="secondary"
              className="flex-1 font-bold"
              onClick={() => navigate("/dashboard")}
            >
              Go to dashboard
            </Button>
            <Button variant="outline" className="flex-1" onClick={resetForm}>
              Submit another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link
          to="/dashboard"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
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
                <Label>
                  Sample type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.sample_type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, sample_type: v as SampleType }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soil">Soil</SelectItem>
                    <SelectItem value="rock">Rock</SelectItem>
                    <SelectItem value="water">Water</SelectItem>
                    <SelectItem value="concrete">Concrete</SelectItem>
                    <SelectItem value="aggregate">Aggregate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.sample_type && (
                  <p className="text-destructive text-xs mt-1">{errors.sample_type}</p>
                )}
              </div>

              {/* Test required */}
              <div>
                <Label htmlFor="test">
                  Test required{" "}
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="test"
                  placeholder="e.g. SPT, Atterberg Limits, CBR"
                  value={form.test_required}
                  onChange={(e) => setForm((f) => ({ ...f, test_required: e.target.value }))}
                  className="mt-1"
                />
              </div>

              {/* Project name */}
              <div>
                <Label htmlFor="project">
                  Project name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="project"
                  placeholder="e.g. NH-44 Highway Project"
                  value={form.project_name}
                  onChange={(e) => setForm((f) => ({ ...f, project_name: e.target.value }))}
                  className="mt-1"
                />
                {errors.project_name && (
                  <p className="text-destructive text-xs mt-1">{errors.project_name}</p>
                )}
              </div>

              {/* Site location */}
              <div>
                <Label htmlFor="site">
                  Site location <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="site"
                    placeholder="e.g. Km 142, Trichy Road or use Auto GPS"
                    value={form.site_location}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, site_location: e.target.value }))
                    }
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleGPS}
                    disabled={gpsLoading}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors whitespace-nowrap flex items-center gap-1 disabled:opacity-50"
                  >
                    {gpsLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5" />
                    )}
                    {gpsLoading ? "..." : "GPS"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Click GPS to auto-detect or type manually — always editable
                </p>
                {errors.site_location && (
                  <p className="text-destructive text-xs mt-1">{errors.site_location}</p>
                )}
              </div>

              {/* Sample description — full width, required, big textarea */}
              <div className="sm:col-span-2">
                <Label htmlFor="desc">
                  Sample description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="desc"
                  placeholder="e.g. Bore hole #3 at 6m depth, undisturbed sample collected using thin-walled sampler..."
                  value={form.sample_description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sample_description: e.target.value }))
                  }
                  className="mt-1 min-h-[100px] resize-y"
                />
                {errors.sample_description && (
                  <p className="text-destructive text-xs mt-1">{errors.sample_description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Parcel & dispatch */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-primary">Parcel & dispatch</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parcels">
                  Number of parcels <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="parcels"
                  type="number"
                  min="1"
                  value={form.num_parcels}
                  onChange={(e) => setForm((f) => ({ ...f, num_parcels: e.target.value }))}
                  className="mt-1"
                />
                {errors.num_parcels && (
                  <p className="text-destructive text-xs mt-1">{errors.num_parcels}</p>
                )}
              </div>

              <div>
                <Label htmlFor="weight">Weight in kg (optional)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={form.weight_kg}
                  onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="dispatch">
                  Dispatch date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dispatch"
                  type="date"
                  value={form.pickup_date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm((f) => ({ ...f, pickup_date: e.target.value }))}
                  className="mt-1"
                />
                {errors.pickup_date && (
                  <p className="text-destructive text-xs mt-1">{errors.pickup_date}</p>
                )}
              </div>

              <div>
                <Label htmlFor="courier">Courier name (optional)</Label>
                <Input
                  id="courier"
                  placeholder="e.g. Blue Dart, DTDC, Speed Post..."
                  value={form.courier_name}
                  onChange={(e) => setForm((f) => ({ ...f, courier_name: e.target.value }))}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You can update this after dispatch
                </p>
              </div>

              <div>
                <Label htmlFor="tracking">Tracking / AWB number (optional)</Label>
                <Input
                  id="tracking"
                  placeholder="Enter after handing over to courier"
                  value={form.awb_number}
                  onChange={(e) => setForm((f) => ({ ...f, awb_number: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="remarks">Remarks (optional)</Label>
                <Input
                  id="remarks"
                  placeholder="Any special handling notes"
                  value={form.remarks}
                  onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            <span className="text-destructive">*</span> Required fields
          </p>

          <Button
            type="submit"
            variant="secondary"
            className="w-full font-bold h-12 text-base"
            disabled={loading}
          >
            {loading ? "Generating…" : "Generate Sample ID & Submit →"}
          </Button>
        </form>
      </div>
    </div>
  );
}