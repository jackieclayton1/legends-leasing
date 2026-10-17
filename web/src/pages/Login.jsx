import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSignIn, useSignUp } from "@clerk/react";
import { ArrowLeft, ShieldCheck, Mail, KeyRound } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/FormField";
import { useAuth, clerkErrorMessage } from "@/lib/AuthContext";
import { SCHOOL, isSchoolEmail } from "@/lib/school";

// Passwordless UA email sign-in (Clerk email code). Same flow as the Expo AccessGate.
// Signing in and signing up are one flow: unknown emails are transferred to sign-up.
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn } = useAuth();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState("email"); // email | code
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from || "/choose";

  useEffect(() => {
    if (isSignedIn) navigate(redirectTo, { replace: true });
  }, [isSignedIn, navigate, redirectTo]);

  const sendCode = async (ev) => {
    ev.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!isSchoolEmail(normalized)) {
      setError(`Use your ${SCHOOL.name} email, like you@${SCHOOL.emailDomains[0]} or you@${SCHOOL.emailDomains[1]}.`);
      return;
    }
    if (!signIn || !signUp) return;
    setLoading(true);
    setError(null);
    try {
      const created = await signIn.create({ identifier: normalized });
      if (created.error) throw created.error;
      if (signIn.isTransferable) {
        const up = await signUp.create({ transfer: true });
        if (up.error) throw up.error;
        const sent = await signUp.verifications.sendEmailCode();
        if (sent.error) throw sent.error;
        setIsSigningUp(true);
      } else {
        const sent = await signIn.emailCode.sendCode();
        if (sent.error) throw sent.error;
        setIsSigningUp(false);
      }
      setPhase("code");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (ev) => {
    ev.preventDefault();
    if (!signIn || !signUp) return;
    setLoading(true);
    setError(null);
    try {
      const result = isSigningUp
        ? await signUp.verifications.verifyEmailCode({ code })
        : await signIn.emailCode.verifyCode({ code });
      if (result.error) throw result.error;
      const finalized = isSigningUp ? await signUp.finalize() : await signIn.finalize();
      if (finalized.error) throw finalized.error;
      // useEffect above navigates once Clerk reports isSignedIn.
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-white relative overflow-hidden">
        <Logo />
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold leading-tight">Welcome to Legends Leasing.</h2>
          <p className="mt-3 text-white/80 max-w-sm">Sign in with your UA email to manage listings, save favorites, and connect with students.</p>
          <div className="mt-8 flex items-center gap-2 text-sm text-white/70">
            <ShieldCheck className="w-4 h-4" /> Student-verified community
          </div>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
        </div>
      </div>

      <div className="flex flex-col p-6 sm:p-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-primary mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
          <div className="lg:hidden mb-6"><Logo /></div>
          <h1 className="text-3xl font-extrabold tracking-tight">Sign in with UA email</h1>
          <p className="mt-2 text-foreground/60">
            {phase === "email"
              ? "We'll email you a one-time code. No password needed. This is not official UA SSO."
              : `Enter the 6-digit code we sent to ${email.trim().toLowerCase()}.`}
          </p>

          <form onSubmit={phase === "email" ? sendCode : verifyCode} className="mt-8 space-y-5" noValidate>
            {phase === "email" ? (
              <FormField label="UA student email" required error={error}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@crimson.ua.edu" className="pl-10" autoComplete="email" />
                </div>
              </FormField>
            ) : (
              <FormField label="Verification code" required error={error}>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <Input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className="pl-10 tracking-widest" autoComplete="one-time-code" />
                </div>
              </FormField>
            )}
            <div id="clerk-captcha" />
            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base">
              {loading ? "Please wait…" : phase === "email" ? "Send code" : "Verify code"}
            </Button>
            {phase === "code" && (
              <button type="button" onClick={() => { setPhase("email"); setCode(""); setError(null); }} className="w-full text-sm text-primary hover:underline">
                Use a different email
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
