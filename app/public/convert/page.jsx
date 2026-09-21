"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Card, Button, Spinner } from "react-bootstrap";
import api from "@/lib/api/axios";

import { Suspense } from "react";

function ConvertContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState("idle"); // idle, loading, success, error

  useEffect(() => {
    if (!token) setStatus("error");
  }, [token]);

  const handleConfirm = async () => {
    try {
      setStatus("loading");
      await api.post("/track/convert", { token });
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <Card className="shadow-lg border-0" style={{ maxWidth: "500px", width: "100%" }}>
      <Card.Body className="p-5 text-center">
        {status === "idle" && (
          <>
            <div className="mb-4">
              <i className="bi bi-envelope-open-heart text-primary" style={{ fontSize: "3rem" }}></i>
            </div>
            <h2 className="mb-3 fw-bold text-dark">Confirm Your Interest</h2>
            <p className="text-muted mb-4 fs-5">
              We're thrilled you're interested. Click below to let us know, and a member of our team will be in touch shortly.
            </p>
            <Button variant="primary" size="lg" className="px-5 py-3 rounded-pill shadow-sm" onClick={handleConfirm}>
              Yes, I'm interested!
            </Button>
          </>
        )}

        {status === "loading" && (
          <div className="py-5">
            <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
            <h4 className="mt-4 text-muted">Processing your request...</h4>
          </div>
        )}

        {status === "success" && (
          <div className="py-4">
            <div className="mb-4">
              <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "4rem" }}></i>
            </div>
            <h2 className="mb-3 fw-bold text-dark">Thank You!</h2>
            <p className="text-muted fs-5 mb-0">
              Your interest has been confirmed. Someone from our team will reach out to you soon.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="py-4">
            <div className="mb-4">
              <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: "4rem" }}></i>
            </div>
            <h2 className="mb-3 fw-bold text-dark">Oops!</h2>
            <p className="text-muted fs-5 mb-0">
              Something went wrong, or your link has expired. Please try clicking the link in your email again.
            </p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default function ConvertPage() {
  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <Suspense fallback={<Spinner animation="border" variant="primary" />}>
        <ConvertContent />
      </Suspense>
    </Container>
  );
}
