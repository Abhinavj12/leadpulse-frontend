"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToastNotification } from "@/components/ui/ToastNotification";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

export default function ConversionApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pendingConversions, setPendingConversions] = useState([]);

  // States for rejection reason
  const [showRejectInput, setShowRejectInput] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bootstrap modal confirm states
  const [confirmApprove, setConfirmApprove] = useState(null); // remarkId or null
  const [confirmReject, setConfirmReject] = useState(null);   // remarkId or null

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", variant: "danger" });
  const showToast = (message, variant = "danger") => setToast({ show: true, message, variant });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/call/conversions/pending");
      setPendingConversions(res.data.data);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load pending conversions."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const reviewConversion = async (remarkId, confirmed, reason = undefined) => {
    setIsSubmitting(true);
    try {
      // Zod validation strictly expects string or undefined for optional fields, not null.
      const payload = { confirmed };
      if (reason) {
        payload.rejectionReason = reason;
      }

      await api.patch(`/call/remarks/${remarkId}/review`, payload);
      setShowRejectInput(null);
      setRejectReason("");
      await loadData();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to review conversion."), "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = (remarkId) => {
    setConfirmApprove(remarkId);
  };

  const handleRejectClick = (remarkId) => {
    setShowRejectInput(remarkId);
    setRejectReason("");
  };

  const handleRejectSubmit = (remarkId) => {
    if (!rejectReason.trim()) {
      showToast("Please provide a rejection reason.", "warning");
      return;
    }
    setConfirmReject(remarkId);
  };

  if (loading) return <AppLayout role="manager"><LoadingSpinner /></AppLayout>;
  if (error) return <AppLayout role="manager"><AlertMessage message={error} onRetry={loadData} /></AppLayout>;

  return (
    <AppLayout role="manager">
      <PageHeader 
        title="Conversion Approvals" 
        subtitle="Review and approve pending conversions claimed by your executives before they are billed to the client." 
      />

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden mt-4">
        <div style={{ height: "4px", background: "linear-gradient(90deg, #198754, #20c997)" }} />
        <Card.Header className="bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
          <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
            <i className="bi bi-shield-check me-2 text-success" style={{ fontSize: "1.2rem" }}></i>
            Pending Conversions
            {pendingConversions.length > 0 && (
              <span className="badge bg-warning text-dark rounded-pill ms-3 fs-6">
                {pendingConversions.length} Action Required
              </span>
            )}
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {pendingConversions.length > 0 ? (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr className="text-secondary small text-uppercase" style={{ letterSpacing: "0.03em" }}>
                  <th className="px-4 py-3 border-0 fw-semibold">Lead Details</th>
                  <th className="px-4 py-3 border-0 fw-semibold">Campaign</th>
                  <th className="px-4 py-3 border-0 fw-semibold">Executive</th>
                  <th className="px-4 py-3 border-0 fw-semibold">Notes</th>
                  <th className="px-4 py-3 border-0 fw-semibold text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingConversions.map(conv => (
                  <tr key={conv.remarkId} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td className="px-4 py-3">
                      <div className="fw-bold text-dark">
                        <Link href={`/manager/leads/${conv.leadId}`} className="text-decoration-none text-dark">
                          {conv.leadName}
                        </Link>
                      </div>
                      <div className="text-muted small">
                        {conv.company}
                        <span className="mx-2">•</span>
                        <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                          <i className="bi bi-clock me-1"></i>
                          {new Date(conv.reportedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/manager/campaigns/${conv.campaignId}`} className="text-decoration-none fw-semibold">
                        {conv.campaignName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-secondary bg-opacity-10 text-secondary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>
                          {conv.reportedBy?.charAt(0) || "E"}
                        </div>
                        <span className="fw-medium text-dark">{conv.reportedBy}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted fst-italic small" style={{ maxWidth: "250px" }}>
                      {conv.notes ? `"${conv.notes}"` : "No notes provided"}
                    </td>
                    <td className="px-4 py-3 text-end">
                      {showRejectInput === conv.remarkId ? (
                        <div className="d-flex flex-column align-items-end gap-2">
                          <Form.Control 
                            type="text" 
                            size="sm"
                            placeholder="Reason for rejection..." 
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            style={{ minWidth: '220px' }}
                            autoFocus
                            disabled={isSubmitting}
                          />
                          <div className="d-flex gap-2">
                            <Button 
                              variant="light" 
                              size="sm" 
                              className="rounded-pill fw-medium" 
                              onClick={() => setShowRejectInput(null)}
                              disabled={isSubmitting}
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm" 
                              className="rounded-pill fw-semibold" 
                              onClick={() => handleRejectSubmit(conv.remarkId)}
                              disabled={isSubmitting}
                            >
                              Confirm Reject
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-end gap-2">
                          <Button 
                            variant="success" 
                            size="sm" 
                            className="rounded-pill fw-semibold px-3" 
                            onClick={() => handleConfirm(conv.remarkId)}
                            disabled={isSubmitting}
                          >
                            <i className="bi bi-check-lg me-1"></i> Approve
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="rounded-pill fw-semibold px-3" 
                            onClick={() => handleRejectClick(conv.remarkId)}
                            disabled={isSubmitting}
                          >
                            <i className="bi bi-x-lg me-1"></i> Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="bi bi-inbox text-muted opacity-25" style={{ fontSize: "3rem" }}></i>
              </div>
              <h5 className="fw-bold text-dark mb-1">You're all caught up!</h5>
              <p className="text-muted small">No pending conversions require your approval at this time.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Approve Conversion Confirm Modal */}
      <ConfirmDialog
        show={!!confirmApprove}
        title="Approve Conversion"
        message="Are you sure you want to approve this conversion? This is final and will be billed to the client."
        confirmText="Yes, Approve"
        variant="success"
        isProcessing={isSubmitting}
        onConfirm={() => { const id = confirmApprove; setConfirmApprove(null); reviewConversion(id, true); }}
        onCancel={() => setConfirmApprove(null)}
      />

      {/* Reject Conversion Confirm Modal */}
      <ConfirmDialog
        show={!!confirmReject}
        title="Reject Conversion"
        message="Are you sure you want to reject this conversion?"
        confirmText="Yes, Reject"
        variant="danger"
        isProcessing={isSubmitting}
        onConfirm={() => { const id = confirmReject; setConfirmReject(null); reviewConversion(id, false, rejectReason); }}
        onCancel={() => setConfirmReject(null)}
      />

      {/* Toast Notification */}
      <ToastNotification
        show={toast.show}
        onClose={() => setToast(t => ({ ...t, show: false }))}
        message={toast.message}
        variant={toast.variant}
      />
    </AppLayout>
  );
}
