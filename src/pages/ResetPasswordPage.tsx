import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { Package, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  // 🔐 Proper Supabase recovery session handling
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setValidSession(true);
          setChecking(false);
        }
      }
    );

    // fallback (in case event already triggered)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidSession(true);
      } else {
        toast.error("Invalid or expired reset link");
        navigate("/login");
      }
      setChecking(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔐 Strong password validation
    const strongPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;

    if (!strongPassword.test(password)) {
      toast.error(
        "Password must include uppercase, lowercase, and number (min 8 chars)"
      );
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error("Reset error:", error.message);
        toast.error(error.message || "Failed to reset password");
        return;
      }

      setDone(true);

      // logout after reset
      await supabase.auth.signOut();
    } catch (err: any) {
      console.error("Unexpected error:", err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ⏳ Loading screen
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  // ❌ Invalid session
  if (!validSession) return null;

  // ✅ Success screen
  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-primary mb-2">
            Password Reset Successful!
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Your password has been updated. Please login again.
          </p>
          <Button
            variant="secondary"
            className="font-bold w-full"
            onClick={() => navigate("/login")}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // 🔐 Reset Form
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-primary">
            Set New Password
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enter a strong new password
          </p>
        </div>

        <form
          onSubmit={handleReset}
          className="bg-card rounded-xl border p-6 shadow-sm space-y-4"
        >
          <div>
            <Label>New Password</Label>
            <Input
              type="password"
              placeholder="Min 8 chars, include A-Z, a-z, 0-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <Label>Confirm Password</Label>
            <Input
              type="password"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Updating password..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}