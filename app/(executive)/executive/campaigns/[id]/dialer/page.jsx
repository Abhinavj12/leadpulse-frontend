"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Badge from "react-bootstrap/Badge";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import Spinner from "react-bootstrap/Spinner";

import AppLayout from "@/components/layout/AppLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

// --- Outcome Configuration ---
// Values MUST exactly match the backend enum in call.validation.js
const OUTCOMES = [
  {
    value: "Answered",
    label: "Answered",
    icon: "bi-telephone-fill",
    color: "info",
    description: "Call connected — spoke with someone",
    needsCallback: false,
    needsStatus: true,
  },
  {
    value: "Not Answered",
    label: "Not Answered",
    icon: "bi-telephone-x",
    color: "secondary",
    description: "Rang but no one picked up",
    needsCallback: false,
    needsStatus: false,
  },
  {
    value: "Busy",
    label: "Busy",
    icon: "bi-telephone-minus",
    color: "secondary",
    description: "Line was busy",
    needsCallback: false,
    needsStatus: false,
  },
  {
    value: "Left Voicemail",
    label: "Left Voicemail",
    icon: "bi-voicemail",
    color: "secondary",
    description: "Left a voicemail message",
    needsCallback: false,
    needsStatus: false,
  },
  {
    value: "Callback Requested",
    label: "Schedule Callback",
    icon: "bi-calendar-check",
    color: "warning",
    description: "Lead asked to be called back at a specific time",
    needsCallback: true,
    needsStatus: false,
  },
  {
    value: "Not Interested",
    label: "Not Interested",
    icon: "bi-x-circle",
    color: "danger",
    description: "Lead explicitly declined — marks them as Dead",
    needsCallback: false,
    needsStatus: false,
  },
  {
    value: "Wrong Number",
    label: "Wrong Number",
    icon: "bi-slash-circle",
    color: "dark",
    description: "Number is invalid or belongs to someone else",
    needsCallback: false,
    needsStatus: false,
  },
  {
    value: "Converted",
    label: "Converted",
    icon: "bi-trophy",
    color: "success",
    description: "Lead agreed — claim a conversion (requires manager review)",
    needsCallback: false,
    needsStatus: false,
  },
];

// Values MUST match backend: z.enum(['Contacted', 'Qualified'])
const LEAD_STATUS_OPTIONS = [
  { value: "", label: "— No status update —" },
  { value: "Contacted", label: "Contacted" },
  { value: "Qualified", label: "Qualified" },
];

// --- Helper Components ---
function LeadCard({ lead }) {
  const queueBadge = {
    pending: { bg: "secondary", label: "First Contact" },
    in_progress: { bg: "warning", label: "In Progress" },
    called: { bg: "info", label: "Previously Called" },
    completed: { bg: "success", label: "Completed" },
    skipped: { bg: "dark", label: "Skipped" },
  };
  const badge = queueBadge[lead.queueStatus] || { bg: "secondary", label: lead.queueStatus };

  return (
    <Card className="border-0 shadow rounded-4 overflow-hidden">
      {/* Top accent bar */}
      <div style={{ height: "5px", background: "linear-gradient(90deg, #0d6efd, #6610f2)" }} />
      <Card.Body className="p-4">
        {/* Lead Header */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h3 className="fw-bolder mb-0 text-dark">
                {lead.firstName} {lead.lastName}
              </h3>
              <Badge bg={badge.bg} className="px-2 py-1 rounded-pill small">{badge.label}</Badge>
            </div>
            {lead.jobTitle && (
              <div className="text-muted fw-medium">
                {lead.jobTitle}
                {lead.company && <span className="text-primary"> @ {lead.company}</span>}
              </div>
            )}
            {!lead.jobTitle && lead.company && (
              <div className="text-primary fw-medium">{lead.company}</div>
            )}
          </div>
          {lead.industry && (
            <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill small fw-bold">
              <i className="bi bi-building me-1"></i>{lead.industry}
            </span>
          )}
        </div>

        {/* Contact Details */}
        <Row className="g-3 mb-4">
          <Col md={4}>
            <div className="rounded-3 p-3" style={{ background: "#f8f9fa" }}>
              <div className="text-secondary small fw-bold text-uppercase mb-1">Phone</div>
              {lead.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  className="text-decoration-none fw-bold text-dark d-flex align-items-center gap-1"
                >
                  <i className="bi bi-telephone-fill text-primary"></i>
                  {lead.phone}
                </a>
              ) : (
                <span className="text-muted small">Not provided</span>
              )}
            </div>
          </Col>
          <Col md={4}>
            <div className="rounded-3 p-3" style={{ background: "#f8f9fa" }}>
              <div className="text-secondary small fw-bold text-uppercase mb-1">Email</div>
              {lead.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="text-decoration-none fw-bold text-dark d-flex align-items-center gap-1 text-truncate"
                >
                  <i className="bi bi-envelope-fill text-info"></i>
                  <span className="text-truncate">{lead.email}</span>
                </a>
              ) : (
                <span className="text-muted small">Not provided</span>
              )}
            </div>
          </Col>
          <Col md={4}>
            <div className="rounded-3 p-3" style={{ background: "#f8f9fa" }}>
              <div className="text-secondary small fw-bold text-uppercase mb-1">Industry</div>
              <span className="fw-bold text-dark">{lead.industry || "—"}</span>
            </div>
          </Col>
        </Row>

        {/* Previous Remarks */}
        {lead.previousRemarks?.length > 0 && (
          <div>
            <div className="fw-bold text-secondary small text-uppercase mb-2">
              <i className="bi bi-clock-history me-1"></i>
              Previous Attempts ({lead.previousRemarks.length})
            </div>
            <div className="d-flex flex-column gap-2" style={{ maxHeight: "200px", overflowY: "auto" }}>
              {lead.previousRemarks.map((r, i) => {
                const outcomeMap = {
                  "Converted": "success",
                  "Not Interested": "danger",
                  "Callback Requested": "warning",
                  "Not Answered": "secondary",
                  "Busy": "secondary",
                  "Left Voicemail": "secondary",
                  "Wrong Number": "dark",
                  "Answered": "info",
                };
                return (
                  <div
                    key={i}
                    className="rounded-3 p-3 d-flex align-items-start gap-3"
                    style={{ background: "#f8f9fa", borderLeft: "3px solid var(--bs-primary)" }}
                  >
                    <Badge bg={outcomeMap[r.callOutcome] || "secondary"} className="px-2 py-1 rounded-pill small flex-shrink-0">
                      {r.callOutcome?.replace(/_/g, " ")}
                    </Badge>
                    <div className="flex-grow-1 min-w-0">
                      {r.notes && <p className="mb-1 text-dark small">{r.notes}</p>}
                      {r.followUpDate && (
                        <p className="mb-0 text-warning small">
                          <i className="bi bi-calendar-check me-1"></i>
                          Follow-up: {new Date(r.followUpDate).toLocaleString()}
                        </p>
                      )}
                      <p className="mb-0 text-muted" style={{ fontSize: "0.75rem" }}>
                        {new Date(r.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

// --- Main Dialer Component ---
export default function ExecutiveDialer() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const campaignId = params.id;
  const specificLeadId = searchParams.get("leadId");

  // Lead state
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [queueEmpty, setQueueEmpty] = useState(false);
  const [error, setError] = useState("");

  // Remark form state
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [callDuration, setCallDuration] = useState("");
  const [leadStatusUpdate, setLeadStatusUpdate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Success / conversion modal
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Timer
  const [callStarted, setCallStarted] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (callStarted) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [callStarted]);

  const formatTimer = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const fetchLead = useCallback(async () => {
    setLoading(true);
    setError("");
    setSelectedOutcome(null);
    setNotes("");
    setFollowUpDate("");
    setCallDuration("");
    setLeadStatusUpdate("");
    setSubmitError("");
    setSuccessMessage("");
    setCallStarted(false);

    try {
      let res;
      if (specificLeadId) {
        // Jump to a specific lead (callback scenario or history re-dial)
        res = await api.get(`/call/leads/${specificLeadId}`);
      } else {
        // Get next lead from queue
        res = await api.get(`/call/campaigns/${campaignId}/next`);
      }

      const data = res.data.data;
      if (!data) {
        setQueueEmpty(true);
        setLead(null);
      } else {
        setLead(data);
        setQueueEmpty(false);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load lead."));
    } finally {
      setLoading(false);
    }
  }, [campaignId, specificLeadId]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const handleSkip = async () => {
    if (!lead) return;
    try {
      await api.post(`/call/leads/${lead.campaignLeadId}/skip`);
      setSuccessMessage("Lead skipped — it'll come back after other leads have been worked.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Clear specific lead param and fetch next
      if (specificLeadId) {
        router.replace(`/executive/campaigns/${campaignId}/dialer`);
      } else {
        fetchLead();
      }
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Failed to skip lead."));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmitRemark = async () => {
    if (!selectedOutcome || !lead) return;

    const outcome = OUTCOMES.find(o => o.value === selectedOutcome);
    if (outcome?.needsCallback && !followUpDate) {
      setSubmitError("Please select a follow-up date for the callback.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      // followUpDate backend expects YYYY-MM-DD (date only) — matches the
      // type="date" input's value format exactly, no conversion needed.
      const payload = {
        callOutcome: selectedOutcome,
        notes: notes.trim() || undefined,
        followUpDate: followUpDate || undefined,
        // Backend requires integer minutes
        callDurationMinutes: callDuration ? Math.round(parseFloat(callDuration)) : undefined,
        leadStatusUpdate: leadStatusUpdate || undefined,
      };

      await api.post(`/call/leads/${lead.campaignLeadId}/remarks`, payload);
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (selectedOutcome === "Converted") {
        setShowConversionModal(true);
      } else if (selectedOutcome === "Callback Requested") {
        setSuccessMessage(`Callback scheduled for ${followUpDate}. Moving to next lead.`);
        if (specificLeadId) router.replace(`/executive/campaigns/${campaignId}/dialer`);
        else fetchLead();
      } else {
        setSuccessMessage("Outcome logged. Loading next lead...");
        if (specificLeadId) router.replace(`/executive/campaigns/${campaignId}/dialer`);
        else fetchLead();
      }
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Failed to log outcome. Please try again."));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAfterConversion = () => {
    setShowConversionModal(false);
    setSuccessMessage("Conversion claimed and sent for manager review! Great work. Loading next lead...");
    if (specificLeadId) router.replace(`/executive/campaigns/${campaignId}/dialer`);
    else fetchLead();
  };

  // --- Render states ---
  if (loading) {
    return (
      <AppLayout role="executive">
        <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} className="mb-3" />
          <div className="text-muted fw-medium">Loading next lead...</div>
        </div>
      </AppLayout>
    );
  }

  if (error && !lead) {
    return (
      <AppLayout role="executive">
        <AlertMessage message={error} />
        <div className="text-center mt-4">
          <Button onClick={fetchLead} variant="primary" className="rounded-pill px-4">Try Again</Button>
        </div>
      </AppLayout>
    );
  }

  if (queueEmpty) {
    return (
      <AppLayout role="executive">
        <div className="d-flex flex-column justify-content-center align-items-center text-center" style={{ minHeight: "60vh" }}>
          <i className="bi bi-check2-circle text-success" style={{ fontSize: "4rem" }}></i>
          <h2 className="fw-bolder mt-3 mb-2">Nothing Left Right Now</h2>
          <p className="text-muted mb-4">
            You&apos;re caught up — there&apos;s nothing waiting in your queue at this moment.<br />
            This doesn&apos;t mean the campaign is finished: scheduled callbacks becoming due, or newly assigned leads, can bring new work back here later.
          </p>
          <div className="d-flex gap-3">
            <Link href={`/executive/campaigns/${campaignId}`} className="btn btn-outline-primary rounded-pill px-4">
              <i className="bi bi-arrow-left me-2"></i>Back to Queue
            </Link>
            <Link href="/executive/dashboard" className="btn btn-primary rounded-pill px-4">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const selectedOutcomeConfig = OUTCOMES.find(o => o.value === selectedOutcome);

  return (
    <AppLayout role="executive">
      {/* Conversion Success Modal */}
      <Modal show={showConversionModal} onHide={handleAfterConversion} centered>
        <Modal.Body className="text-center p-5">
          <i className="bi bi-trophy-fill text-success" style={{ fontSize: "3.5rem" }}></i>
          <h4 className="fw-bolder mt-3 mb-2">Conversion Claimed!</h4>
          <p className="text-muted mb-4">
            Your conversion has been recorded and sent to your manager for review.
            Once confirmed, it will count toward your performance.
          </p>
          <Button variant="success" className="rounded-pill px-5 fw-bold" onClick={handleAfterConversion}>
            <i className="bi bi-arrow-right me-2"></i>Next Lead
          </Button>
        </Modal.Body>
      </Modal>

      {/* Breadcrumb + Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <nav aria-label="breadcrumb" className="mb-1">
            <ol className="breadcrumb mb-0 small">
              <li className="breadcrumb-item">
                <Link href="/executive/dashboard" className="text-decoration-none text-muted">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link href={`/executive/campaigns/${campaignId}`} className="text-decoration-none text-muted">Campaign Queue</Link>
              </li>
              <li className="breadcrumb-item active text-muted">Dialer</li>
            </ol>
          </nav>
          <h3 className="fw-bolder mb-0">
            <i className="bi bi-telephone-outbound me-2 text-primary"></i>
            Live Dialer
            {specificLeadId && (
              <Badge bg="warning" text="dark" className="ms-2 px-3 py-2 rounded-pill small fw-normal">
                Direct Callback
              </Badge>
            )}
          </h3>
        </div>
        <div className="d-flex gap-2">
          {callStarted ? (
            <div className="btn btn-outline-danger rounded-pill px-4 fw-bold" style={{ minWidth: "120px" }}>
              <i className="bi bi-record-circle me-2 text-danger"></i>
              {formatTimer(timer)}
            </div>
          ) : (
            <Button
              variant="outline-success"
              className="rounded-pill px-4 fw-bold"
              onClick={() => setCallStarted(true)}
            >
              <i className="bi bi-stopwatch me-2"></i>Start Timer
            </Button>
          )}
          {callStarted && (
            <Button
              variant="outline-secondary"
              className="rounded-pill px-4"
              onClick={() => {
                setCallStarted(false);
                if (timer > 0) setCallDuration((timer / 60).toFixed(1));
              }}
            >
              <i className="bi bi-stop-circle me-2"></i>Stop
            </Button>
          )}
        </div>
      </div>

      {successMessage && (
        <AlertMessage variant="success" message={successMessage} />
      )}
      {submitError && (
        <AlertMessage message={submitError} />
      )}

      <Row className="g-4">
        {/* Left — Lead Card */}
        <Col lg={7}>
          <LeadCard lead={lead} />

          {/* Quick Actions */}
          <div className="d-flex gap-2 mt-3 flex-wrap">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                onClick={() => !callStarted && setCallStarted(true)}
              >
                <i className="bi bi-telephone-fill me-2"></i>Call {lead.phone}
              </a>
            )}
            <Button
              variant="outline-secondary"
              className="rounded-pill px-4"
              onClick={handleSkip}
              disabled={submitting}
            >
              <i className="bi bi-skip-forward me-2"></i>Skip for Now
            </Button>
            <Link
              href={`/executive/campaigns/${campaignId}`}
              className="btn btn-link text-muted ps-2"
            >
              ← Back to Queue
            </Link>
          </div>
        </Col>

        {/* Right — Log Outcome */}
        <Col lg={5}>
          <Card className="border-0 shadow rounded-4 overflow-hidden h-100">
            <div style={{ height: "5px", background: "linear-gradient(90deg, #198754, #20c997)" }} />
            <Card.Body className="p-4">
              <h5 className="fw-bolder mb-1">Log Call Outcome</h5>
              <p className="text-muted small mb-3">Select the result of this call attempt.</p>

              {/* This lead has already had 3 attempts logged — the backend
                  auto-resolves any lead to "completed" on its 4th remark,
                  regardless of outcome, so the executive should know this
                  submission is their last chance to work it. */}
              {lead.previousRemarks?.length >= 3 && (
                <div
                  className="rounded-3 p-3 mb-3 d-flex align-items-start gap-2"
                  style={{ background: "rgba(220, 53, 69, 0.08)", border: "1px solid rgba(220, 53, 69, 0.25)" }}
                >
                  <i className="bi bi-exclamation-triangle-fill text-danger mt-1 flex-shrink-0"></i>
                  <div className="small text-dark">
                    <span className="fw-bold">Final attempt on this lead.</span> Whatever outcome you log now will close it out of this campaign's queue for good.
                  </div>
                </div>
              )}

              {/* Outcome Selection */}
              <div className="d-flex flex-column gap-2 mb-4">
                {OUTCOMES.map(outcome => (
                  <div
                    key={outcome.value}
                    role="button"
                    onClick={() => {
                      setSelectedOutcome(outcome.value);
                      setSubmitError("");
                    }}
                    className={`rounded-3 p-3 border transition d-flex align-items-center gap-3 cursor-pointer`}
                    style={{
                      cursor: "pointer",
                      borderWidth: "2px !important",
                      border: selectedOutcome === outcome.value
                        ? `2px solid var(--bs-${outcome.color})`
                        : "2px solid #e9ecef",
                      background: selectedOutcome === outcome.value
                        ? `rgba(var(--bs-${outcome.color}-rgb, 13, 110, 253), 0.06)`
                        : "white",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      className={`d-flex align-items-center justify-content-center rounded-circle text-${outcome.color} flex-shrink-0`}
                      style={{ width: "38px", height: "38px", background: `rgba(var(--bs-${outcome.color}-rgb, 13,110,253), 0.1)` }}
                    >
                      <i className={`bi ${outcome.icon}`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className={`fw-bold text-${outcome.color === "warning" ? "dark" : outcome.color}`}>{outcome.label}</div>
                      <div className="text-muted" style={{ fontSize: "0.78rem" }}>{outcome.description}</div>
                    </div>
                    {selectedOutcome === outcome.value && (
                      <i className={`bi bi-check-circle-fill text-${outcome.color} flex-shrink-0`}></i>
                    )}
                  </div>
                ))}
              </div>

              {/* Conditional Fields */}
              {selectedOutcome && (
                <div className="d-flex flex-column gap-3 mb-4">
                  {/* Callback Date — only for callback_requested */}
                  {selectedOutcomeConfig?.needsCallback && (
                    <Form.Group>
                      <Form.Label className="fw-bold small text-danger">
                        <i className="bi bi-calendar-check me-1"></i>Follow-up Date *
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={followUpDate}
                        onChange={e => setFollowUpDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 10)}
                        className="rounded-3"
                        required
                      />
                      <Form.Text className="text-muted">
                        This lead is hidden from your queue until this date.
                      </Form.Text>
                    </Form.Group>
                  )}

                  {/* Lead Status — only for contacted */}
                  {selectedOutcomeConfig?.needsStatus && (
                    <Form.Group>
                      <Form.Label className="fw-bold small text-secondary">
                        Update Lead Status (optional)
                      </Form.Label>
                      <Form.Select
                        value={leadStatusUpdate}
                        onChange={e => setLeadStatusUpdate(e.target.value)}
                        className="rounded-3"
                      >
                        {LEAD_STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  )}

                  {/* Call Duration */}
                  <Form.Group>
                    <Form.Label className="fw-bold small text-secondary">
                      <i className="bi bi-stopwatch me-1"></i>
                      Call Duration (minutes)
                      {callStarted || callDuration ? (
                        <span className="text-success ms-1 small">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          {callDuration ? `${callDuration} min` : "tracking..."}
                        </span>
                      ) : (
                        <span className="text-muted ms-1 small">(optional)</span>
                      )}
                    </Form.Label>
                    <Form.Control
                      type="number"
                      step="0.5"
                      min="0"
                      max="120"
                      value={callDuration}
                      onChange={e => setCallDuration(e.target.value)}
                      placeholder="e.g. 3.5"
                      className="rounded-3"
                    />
                  </Form.Group>

                  {/* Notes */}
                  <Form.Group>
                    <Form.Label className="fw-bold small text-secondary">
                      <i className="bi bi-chat-left-text me-1"></i>Notes (optional)
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="What did you discuss? Key points, objections, next steps..."
                      className="rounded-3"
                      style={{ resize: "none" }}
                    />
                  </Form.Group>
                </div>
              )}

              {/* Submit Button */}
              <Button
                variant={selectedOutcomeConfig?.color === "warning" ? "warning" : (selectedOutcomeConfig?.color || "primary")}
                className="w-100 rounded-pill py-3 fw-bold shadow-sm"
                onClick={handleSubmitRemark}
                disabled={!selectedOutcome || submitting}
              >
                {submitting ? (
                  <><Spinner animation="border" size="sm" className="me-2" />Logging...</>
                ) : selectedOutcome ? (
                  <><i className={`bi ${selectedOutcomeConfig?.icon} me-2`}></i>
                    Log: {selectedOutcomeConfig?.label}</>
                ) : (
                  "Select an outcome above"
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </AppLayout>
  );
}
