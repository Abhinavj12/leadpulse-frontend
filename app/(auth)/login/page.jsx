"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

import AuthShell from "@/components/auth/AuthShell";
import PasswordField from "@/components/auth/PasswordField";
import AlertMessage from "@/components/ui/AlertMessage";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage, getFieldErrors, redirectForRole } from "@/lib/auth/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading: authLoading, user } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      redirectForRole(router, user.role);
    }
  }, [authLoading, user, router]);

  if (authLoading || user) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setServerError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    setErrors({});

    if (!form.email.trim() || !form.password) {
      setErrors({
        ...(form.email.trim() ? {} : { email: "Email is required." }),
        ...(form.password ? {} : { password: "Password is required." })
      });
      return;
    }

    setSubmitting(true);
    try {
      const loggedInUser = await login({
        email: form.email.trim().toLowerCase(),
        password: form.password
      });
      redirectForRole(router, loggedInUser.role);
    } catch (error) {
      setErrors(getFieldErrors(error));
      setServerError(getApiErrorMessage(error, "Unable to sign in. Please check your credentials."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Use your LeadPulse account credentials."
      footer={
        <span className="small text-secondary">
          Need an account? <Link href="/register">Register as a Campaign Manager</Link>
        </span>
      }
    >
      <AlertMessage message={serverError} />

      <Form onSubmit={handleSubmit} noValidate>
        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@company.com"
            autoComplete="email"
            isInvalid={Boolean(errors.email)}
          />
          {errors.email && <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>}
        </Form.Group>

        <PasswordField
          name="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />

        <div className="text-end mb-4">
          <Link href="/forgot-password" className="small">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-100" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
      </Form>
    </AuthShell>
  );
}
