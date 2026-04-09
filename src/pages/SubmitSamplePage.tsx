import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useSamples } from "@/hooks/useSamples";
import { generateSampleId } from "@/lib/sampleId";
import { sampleSchema } from "@/lib/validations";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, ArrowLeft, CheckCircle2 } from "lucide-react";
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
    if (!form.test_required)
      newErrors.test_required = "Test required is mandatory";
    if (!form.project_name) newErrors.project_name = "Project name is required";
    if (!form.site_location)
      newErrors.site_location = "Site location is required";
    if (!form.num_parcels || parseInt(form.num_parcels) < 1)
      newErrors.num_parcels = "At least 1 parcel";
    if (!form.pickup_date) newErrors.pickup_date = "Dispatch date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        test_required: form.test_required,
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

  if (step === "done") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-12">
          {/* Success header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-primary mb-1">
              Sample Created!
            </h1>
            <p className="text-muted-foreground text-sm">
              Write this ID on your parcel before dispatching
            </p>
          </div>

          {/* Sample ID box */}
          <div className="bg-primary rounded-xl p-6 text-center mb-6">
            <p className="text-xs text-primary-foreground/50 uppercase tracking-widest font-bold mb-2">
              Your Sample ID
            </p>
            <div className="text-5xl font-black text-secondary font-mono tracking-wider">
              {generatedId}
            </div>
          </div>

          {/* Flow steps */}
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
                      item.done
                        ? "bg-secondary text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      item.num
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-primary">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary" className="flex-1 font-bold"
              onClick={() => navigate("/dashboard")}
            >
              Go to dashboard
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
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
              }}
            >
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

        <h1 className="text-2xl font-black text-primary mb-1">
          Submit new sample
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Fill in the details — a unique Sample ID will be generated for your
          parcel
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sample information */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-primary">Sample information</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Sample type</Label>
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
                  </SelectContent>
                </Select>
                {errors.sample_type && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.sample_type}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="test">Test required</Label>
                <Input
                  id="test"
                  placeholder="e.g. SPT, Atterberg Limits, CBR"
                  value={form.test_required}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, test_required: e.target.value }))
                  }
                  className="mt-1"
                />
                {errors.test_required && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.test_required}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="project">Project name</Label>
                <Input
                  id="project"
                  placeholder="e.g. NH-44 Highway Project"
                  value={form.project_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, project_name: e.target.value }))
                  }
                  className="mt-1"
                />
                {errors.project_name && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.project_name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="site">Site location</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="site"
                    placeholder="e.g. Km 142, Trichy Road"
                    value={form.site_location}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, site_location: e.target.value }))
                    }
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!navigator.geolocation) {
                        toast.error("GPS not supported on this device");
                        return;
                      }
                      toast.info("Getting your location…");
                      navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                          const lat = pos.coords.latitude.toFixed(5);
                          const lng = pos.coords.longitude.toFixed(5);
                          try {
                            const res = await fetch(
                              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                            );
                            const data = await res.json();
                            const address =
                              data.display_name || `${lat}, ${lng}`;
                            setForm((f) => ({ ...f, site_location: address }));
                            toast.success("Location detected");
                          } catch {
                            setForm((f) => ({
                              ...f,
                              site_location: `${lat}, ${lng}`,
                            }));
                            toast.success("Coordinates captured");
                          }
                        },
                        () => {
                          toast.error(
                            "Could not get location. Please enter manually.",
                          );
                        },
                        { timeout: 10000 },
                      );
                    }}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors whitespace-nowrap flex items-center gap-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                    </svg>
                    Auto GPS
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Click "Auto GPS" to detect location or type manually
                </p>
                {errors.site_location && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.site_location}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="desc">Sample description (optional)</Label>
                <Input
                  id="desc"
                  placeholder="e.g. Bore hole #3 at 6m depth"
                  value={form.sample_description}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sample_description: e.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Parcel & dispatch */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-primary">Parcel & dispatch</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parcels">Number of parcels</Label>
                <Input
                  id="parcels"
                  type="number"
                  min="1"
                  value={form.num_parcels}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, num_parcels: e.target.value }))
                  }
                  className="mt-1"
                />
                {errors.num_parcels && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.num_parcels}
                  </p>
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, weight_kg: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="dispatch">Dispatch date</Label>
                <Input
                  id="dispatch"
                  type="date"
                  value={form.pickup_date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pickup_date: e.target.value }))
                  }
                  className="mt-1"
                />
                {errors.pickup_date && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.pickup_date}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="courier">Courier name (optional)</Label>
                <Input
                  id="courier"
                  placeholder="e.g. Blue Dart, DTDC, Speed Post..."
                  value={form.courier_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, courier_name: e.target.value }))
                  }
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You can update this after dispatch
                </p>
              </div>

              <div>
                <Label htmlFor="tracking">
                  Tracking / AWB number (optional)
                </Label>
                <Input
                  id="tracking"
                  placeholder="Enter after handing over to courier"
                  value={form.awb_number}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, awb_number: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="remarks">Remarks (optional)</Label>
                <Input
                  id="remarks"
                  placeholder="Any special handling notes"
                  value={form.remarks}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, remarks: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>

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
