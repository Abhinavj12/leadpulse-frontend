"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

import AuthShell from "@/components/auth/AuthShell";
import PasswordField from "@/components/auth/PasswordField";
import AlertMessage from "@/components/ui/AlertMessage";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { resetPassword } from "@/lib/api/auth";
import { getApiErrorMessage, getFieldErrors } from "@/lib/auth/auth";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setServerError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setServerError("");

    if (!token) {
      setServerError("This password reset link is missing its token.");
      return;
    }

    const clientErrors = {};
    if (form.password.length < 8) clientErrors.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) {
      clientErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({
        token,
        password: form.password,
        confirmPassword: form.confirmPassword
      });
      setSuccess(true);
    } catch (error) {
      setErrors(getFieldErrors(error));
      setServerError(getApiErrorMessage(error, "Unable to reset the password."));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <AuthShell title="Password updated" subtitle="Your password has been reset successfully.">
        <AlertMessage message="You can now sign in with your new password." variant="success" />
        <Button className="w-100" onClick={() => router.push("/login")}>
          Continue to sign in
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Choose a new password for your LeadPulse account."
      footer={
        <span className="small">
          <Link href="/login">Back to sign in</Link>
        </span>
      }
    >
      <AlertMessage message={serverError} />

      <Form onSubmit={handleSubmit} noValidate>
        <PasswordField
          label="New password"
          name="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
        />

        <PasswordField
          label="Confirm new password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <p className="small text-secondary mb-4">
          Use at least 8 characters, including an uppercase letter, a number, and a special character.
        </p>

        <Button type="submit" className="w-100" disabled={submitting}>
          {submitting ? "Updating..." : "Reset password"}
        </Button>
      </Form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
