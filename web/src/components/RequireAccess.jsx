import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useAuth, clerkErrorMessage } from "@/lib/AuthContext";

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

// Signed in, but the server says this account isn't an eligible student yet.
function VerifyGate() {
  const { eligibility, eligibilityError, verifyStudent, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const message =
    eligibility?.status === "expired" ? "Your student eligibility has expired. Renew it to regain access."
    : eligibility?.status === "rejected" ? "Your verification was not approved. Contact support or try again later."
    : "You're signed in, but your student eligibility hasn't been verified yet.";

  const run = async () => {
    setBusy(true);
    setError(null);
    try { await verifyStudent(); } catch (e) { setError(clerkErrorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5 text-center">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="text-2xl font-extrabold">Eligibility required</h1>
        <p className="text-foreground/60">{eligibilityError || message}</p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={run} disabled={busy} className="w-full h-12 bg-primary text-white hover:bg-primary/90">
          {busy ? "Verifying…" : "Verify student status"}
        </Button>
        <button onClick={logout} className="text-sm text-primary hover:underline">Sign out</button>
      </div>
    </div>
  );
}

export default function RequireAccess({ children }) {
  const { isLoaded, isSignedIn, canAccess, eligibilityLoading } = useAuth();
  const location = useLocation();
  if (!isLoaded || (isSignedIn && eligibilityLoading)) return <Spinner />;
  if (!isSignedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!canAccess) return <VerifyGate />;
  return children;
}
