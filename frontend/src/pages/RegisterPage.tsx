import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { LotusMark } from "@/components/ui/Logo";
import { InlineError } from "@/components/ui/States";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { AuthLayout } from "@/layouts/AuthLayout";
import { getErrorMessage } from "@/lib/api";
import { validateEmail, validateName, validatePassword } from "@/utils/validation";

export function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await register(name.trim(), email.trim(), password);
      toast.success("Welcome to MoodQuest! Your account is ready.");
      navigate("/", { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, "Couldn't create your account. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="glass-strong p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <LotusMark className="size-12" />
          <h1 className="mt-3 text-2xl font-bold text-white">Create your account</h1>
          <p className="text-sm text-slate-400">A safe space. Anytime. Anywhere.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <TextField
            label="Name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            icon={<User className="size-4" />}
            placeholder="What should we call you?"
            maxLength={100}
          />
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint="At least 8 characters, with a letter and a number."
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
            Sign up
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary-300 hover:text-primary-200">
            Log in
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
