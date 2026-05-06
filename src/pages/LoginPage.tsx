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
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Forgot password
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetting, setResetting] = useState(false);

  // 🔐 Login attempt protection
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 5;

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "super_admin" || user.role === "admin") {
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

    if (attempts >= MAX_ATTEMPTS) {
      toast.error("Too many failed attempts. Try again later.");
      return;
    }

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
        console.error("Login error:", error.message);
        setAttempts((prev) => prev + 1);
        toast.error(error.message || "Invalid email or password");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        console.error("Profile error:", profileError);
        toast.error("Could not load profile.");
        await supabase.auth.signOut();
        return;
      }

      // 🔐 Account active check
      if (!profile.is_active) {
        toast.error("Your account is deactivated. Contact admin.");
        await supabase.auth.signOut();
        return;
      }

      toast.success("Welcome back!");

      // small delay for UX
      setTimeout(() => {
        login(profile as UserProfile);
      }, 500);

    } catch (err: any) {
      console.error("Unexpected error:", err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
      toast.error("Enter a valid email address");
      return;
    }

    setResetting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error(error.message);
        toast.error("Failed to send reset email");
      } else {
        toast.success("Reset link sent! Check your email.");
        setShowReset(false);
        setResetEmail("");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setResetting(false);
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
            Login to your GeoTech Parcels account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-6 shadow-sm space-y-4">
          
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((er) => ({ ...er, email: undefined }));
              }}
            />
            {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
          </div>

          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((er) => ({ ...er, password: undefined }));
              }}
            />
            {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Logging in..." : "Login"}
          </Button>

          {/* Forgot Password */}
          <div className="text-center">
            <button type="button" onClick={() => setShowReset(!showReset)} className="text-sm underline">
              Forgot password?
            </button>
          </div>

          {showReset && (
            <div className="border p-3 rounded space-y-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              <Button onClick={handleForgotPassword} disabled={resetting}>
                {resetting ? "Sending..." : "Send Reset Link"}
              </Button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}