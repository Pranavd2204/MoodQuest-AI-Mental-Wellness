import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { LotusMark } from "@/components/ui/Logo";
import { InlineError } from "@/components/ui/States";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/layouts/AuthLayout";
import { getErrorMessage } from "@/lib/api";
import { validateEmail } from "@/utils/validation";

export function LoginPage() {
  const { login, sessionMessage, clearSessionMessage } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = { email: validateEmail(email), password: password ? null : "Password is required" };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setSubmitting(true);
    setFormError(null);
    clearSessionMessage();
    try {
      await login(email.trim(), password);
    } catch (error) {
      setFormError(getErrorMessage(error, "Couldn't log you in. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="glass-strong p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <LotusMark className="size-12" />
          <h1 className="mt-3 text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-slate-400">Log in to continue your journey.</p>
        </div>

        {sessionMessage && (
          <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {sessionMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            icon={<Mail className="size-4" />}
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            icon={<Lock className="size-4" />}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="rounded-full p-2 text-slate-400 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
          />
          <InlineError message={formError} />
          <Button type="submit" fullWidth size="lg" loading={submitting}>
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          New to MoodQuest?{" "}
          <Link to="/register" className="font-semibold text-primary-300 hover:text-primary-200">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-center text-xs">
          <Link to="/welcome" className="text-slate-500 hover:text-slate-300">
            ← Back to welcome
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
