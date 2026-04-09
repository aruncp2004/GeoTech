import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { loginSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { Package } from "lucide-react";
import { toast } from "sonner";
import type { UserProfile } from "@/types";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user, login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);

  // Redirect once auth resolves
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.issues.forEach((err) => {
        fieldErrors[err.path[0] as "email" | "password"] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Invalid email or password");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        toast.error("Could not load profile. Please try again.");
        await supabase.auth.signOut();
        return;
      }

      toast.success("Welcome back!");
      // Update the store immediately so ProtectedRoute sees isAuthenticated: true
      login(profile as UserProfile);
      // Navigation handled by the useEffect above
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-primary">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Login to your GeoTech Labs account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-xl border p-6 shadow-sm space-y-4"
        >
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@velciti.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((er) => ({ ...er, email: undefined }));
              }}
              className="mt-1"
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-destructive text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((er) => ({ ...er, password: undefined }));
              }}
              className="mt-1"
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-destructive text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="secondary"
            className="w-full font-bold h-11 text-primary-foreground" // Added text color override
            disabled={submitting}
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Logging in...</span>
              </div>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
