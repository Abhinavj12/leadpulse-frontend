"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Script from "next/script";

import AuthShell from "@/components/auth/AuthShell";
import PasswordField from "@/components/auth/PasswordField";
import AlertMessage from "@/components/ui/AlertMessage";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ToastNotification } from "@/components/ui/ToastNotification";
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
  const [countdown, setCountdown] = useState(3);
  const [toast, setToast] = useState({ show: false, message: "", variant: "info" });

  // Countdown timer for automatic redirection to login
  useEffect(() => {
    let timer;
    if (success) {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        router.push("/login");
      }
    }
    return () => clearTimeout(timer);
  }, [success, countdown, router]);

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

    if (!window.grecaptcha) {
      setServerError("reCAPTCHA failed to load. Please refresh and try again.");
      setSubmitting(false);
      return;
    }

    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, { action: 'reset_password' })
        .then(async (recaptchaToken) => {
          try {
            await resetPassword({
              token,
              password: form.password,
              confirmPassword: form.confirmPassword,
              recaptchaToken: recaptchaToken // Pass token to reset endpoint
            });
            setSuccess(true);
          } catch (error) {
            setErrors(getFieldErrors(error));
            setServerError(getApiErrorMessage(error, "Unable to reset the password."));
          } finally {
            setSubmitting(false);
          }
        })
        .catch(() => {
          setServerError("Failed to verify reCAPTCHA.");
          setSubmitting(false);
        });
    });
  };

  if (success) {
    return (
      <AuthShell 
        title="Password Changed Successfully!" 
        subtitle="Your LeadPulse account password has been updated."
      >
        <div className="text-center my-3">
          <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex p-3 mb-3 fs-1">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <AlertMessage 
            message={`Password changed successfully! Redirecting to login page in ${countdown} second${countdown === 1 ? '' : 's'}...`} 
            variant="success" 
          />
          <div className="d-flex flex-column gap-2 mt-4">
            <Button 
              className="w-100 py-2 fw-semibold" 
              onClick={() => router.push("/login")}
            >
              Go to Login Now ({countdown}s) <i className="bi bi-arrow-right ms-1"></i>
            </Button>
          </div>
        </div>

        <ToastNotification 
          show={toast.show} 
          onClose={() => setToast(t => ({ ...t, show: false }))} 
          message={toast.message} 
          variant={toast.variant} 
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Choose a new secure password for your LeadPulse account."
      footer={
        <span className="small">
          <Link href="/login" className="text-decoration-none">Back to sign in</Link>
        </span>
      }
    >
       <Script
        src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
        strategy="lazyOnload"
      />
      <AlertMessage message={serverError} />

      {!token && (
        <AlertMessage 
          message="Password reset token missing or invalid. Please check your email link or request a new reset email." 
          variant="warning" 
        />
      )}

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
          <i className="bi bi-info-circle me-1"></i> Must be at least 8 characters long and include an uppercase letter, a number, and a special character.
        </p>

        <Button type="submit" className="w-100 py-2 fw-semibold" disabled={submitting || !token}>
          {submitting ? "Updating Password..." : "Reset Password"}
        </Button>
      </Form>

      <ToastNotification 
        show={toast.show} 
        onClose={() => setToast(t => ({ ...t, show: false }))} 
        message={toast.message} 
        variant={toast.variant} 
      />
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

