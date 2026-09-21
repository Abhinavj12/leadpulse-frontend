"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Card, Button, Spinner } from "react-bootstrap";
import api from "@/lib/api/axios";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!token) setStatus("error");
  }, [token]);

  const handleConfirm = async () => {
    try {
      setStatus("loading");
      await api.post("/track/unsubscribe", { token });
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
              <i className="bi bi-dash-circle text-danger" style={{ fontSize: "3rem" }}></i>
            </div>
            <h2 className="mb-3 fw-bold text-dark">Unsubscribe</h2>
            <p className="text-muted mb-4 fs-5">
              Confirm that you no longer wish to receive these emails.
            </p>
            <Button variant="danger" size="lg" className="px-5 py-3 rounded-pill shadow-sm" onClick={handleConfirm}>
              Unsubscribe me
            </Button>
          </>
        )}

        {status === "loading" && (
          <div className="py-5">
            <Spinner animation="border" variant="danger" style={{ width: "3rem", height: "3rem" }} />
            <h4 className="mt-4 text-muted">Processing...</h4>
          </div>
        )}

        {status === "success" && (
          <div className="py-4">
            <div className="mb-4">
              <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "4rem" }}></i>
            </div>
            <h2 className="mb-3 fw-bold text-dark">You have been unsubscribed</h2>
            <p className="text-muted fs-5 mb-0">
              You will not receive further emails from this sender.
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
              Something went wrong. Please try clicking the link in your email again.
            </p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default function UnsubscribePage() {
  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <Suspense fallback={<Spinner animation="border" variant="danger" />}>
        <UnsubscribeContent />
      </Suspense>
    </Container>
  );
}
