"use client";

import { useEffect, useState, useCallback } from "react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Card from "react-bootstrap/Card";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Dropdown from "react-bootstrap/Dropdown";
import Badge from "react-bootstrap/Badge";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";
import ProgressBar from "react-bootstrap/ProgressBar";

import AppLayout from "@/components/layout/AppLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import api from "@/lib/api/axios";
import { getApiErrorMessage, getFieldErrors } from "@/lib/auth/auth";

// ─── Outcome colour map (matches backend enum) ───────────────────────────────
const OUTCOME_COLORS = {
  "Answered":           "#0dcaf0",
  "Not Answered":       "#6c757d",
  "Busy":               "#adb5bd",
  "Left Voicemail":     "#8c9aa7",
  "Callback Requested": "#ffc107",
  "Not Interested":     "#dc3545",
  "Wrong Number":       "#343a40",
  "Converted":          "#198754",
};

// ─── Small stat tile ─────────────────────────────────────────────────────────
function StatTile({ label, value, sub, accent = "#0d6efd", icon }) {
  return (
    <div
      className="rounded-4 p-3 h-100"
      style={{ background: "#f8f9fa", borderLeft: `4px solid ${accent}` }}
    >
      <div className="d-flex align-items-center gap-2 mb-1">
        {icon && <i className={`bi ${icon} text-secondary`} style={{ fontSize: "0.85rem" }} />}
        <span className="text-secondary small fw-semibold text-uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.06em" }}>
          {label}
        </span>
      </div>
      <div className="fw-bolder" style={{ fontSize: "1.5rem", color: accent, lineHeight: 1 }}>
        {value ?? "—"}
      </div>
      {sub && <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>{sub}</div>}
    </div>
  );
}

// ─── Outcome breakdown bar chart ─────────────────────────────────────────────
function OutcomeBreakdown({ breakdown, totalCalls }) {
  if (!breakdown || totalCalls === 0) {
    return <p className="text-muted small text-center py-3">No calls logged yet.</p>;
  }
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  return (
    <div className="d-flex flex-column gap-2">
      {entries.map(([outcome, count]) => {
        const pct = Math.round((count / totalCalls) * 100);
        const color = OUTCOME_COLORS[outcome] || "#6c757d";
        return (
          <div key={outcome}>
            <div className="d-flex justify-content-between mb-1">
              <span className="small fw-medium" style={{ color: "#444" }}>{outcome}</span>
              <span className="small text-muted">{count} ({pct}%)</span>
            </div>
            <div className="rounded-pill overflow-hidden" style={{ height: "8px", background: "#e9ecef" }}>
              <div
                className="h-100 rounded-pill"
                style={{ width: `${pct}%`, background: color, transition: "width 0.4s ease" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Activity sparkline (simple bar chart, no dep) ───────────────────────────
function ActivitySparkline({ trend }) {
  if (!trend || trend.length === 0) {
    return <p className="text-muted small text-center py-3">No activity in the last 30 days.</p>;
  }
  const max = Math.max(...trend.map(d => d.count), 1);
  return (
    <div className="d-flex align-items-end gap-1" style={{ height: "60px" }}>
      {trend.map(d => {
        const h = Math.max(4, Math.round((d.count / max) * 60));
        return (
          <div
            key={d.date}
            title={`${d.date}: ${d.count} calls`}
            className="rounded-top flex-grow-1"
            style={{
              height: `${h}px`,
              background: "linear-gradient(to top, #0d6efd, #6ea8fe)",
              minWidth: "4px",
              cursor: "default",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Performance Drawer (Modal) ───────────────────────────────────────────────
function PerformanceDrawer({ executive, onClose }) {
  const [perf, setPerf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!executive) return;
    setLoading(true);
    setError("");
    api.get(`/users/executives/${executive.id}/performance`)
      .then(res => setPerf(res.data.data))
      .catch(err => setError(getApiErrorMessage(err, "Failed to load performance data.")))
      .finally(() => setLoading(false));
  }, [executive?.id]);

  const ov = perf?.overview;
  const initials = `${executive?.firstName?.[0] || ""}${executive?.lastName?.[0] || ""}`;

  return (
    <Modal show={!!executive} onHide={onClose} size="xl" centered scrollable>
      <Modal.Header closeButton className="border-0 pb-0 pt-4 px-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bolder text-white"
            style={{ width: 52, height: 52, background: "linear-gradient(135deg,#0d6efd,#6610f2)", fontSize: "1.1rem" }}
          >
            {initials}
          </div>
          <div>
            <Modal.Title className="fw-bolder mb-0" style={{ fontSize: "1.2rem" }}>
              {executive?.firstName} {executive?.lastName}
              <Badge
                bg={executive?.isActive ? "success" : "secondary"}
                className="ms-2 px-2 py-1 rounded-pill"
                style={{ fontSize: "0.65rem", verticalAlign: "middle" }}
              >
                {executive?.isActive ? "Active" : "Inactive"}
              </Badge>
            </Modal.Title>
            <div className="text-muted small">{executive?.email}</div>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className="text-muted small mt-2">Loading performance data…</div>
          </div>
        )}
        {error && <AlertMessage message={error} />}

        {perf && !loading && (
          <>
            {/* ── KPI Overview ── */}
            <div className="mb-4">
              <h6 className="fw-bold text-secondary text-uppercase mb-3" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                <i className="bi bi-graph-up me-2"></i>Lifetime Performance
              </h6>
              <Row className="g-3">
                <Col xs={6} md={3}>
                  <StatTile label="Total Calls" value={ov.totalCallsLogged} icon="bi-telephone-fill" accent="#0d6efd" />
                </Col>
                <Col xs={6} md={3}>
                  <StatTile
                    label="Conversions"
                    value={ov.totalConversionsConfirmed}
                    sub={`${ov.totalConversionsClaimed} claimed · ${ov.totalConversionsRejected} rejected`}
                    icon="bi-trophy-fill"
                    accent="#198754"
                  />
                </Col>
                <Col xs={6} md={3}>
                  <StatTile
                    label="Claim Rate"
                    value={`${ov.conversionClaimRate}%`}
                    sub="conversions per call"
                    icon="bi-percent"
                    accent="#6610f2"
                  />
                </Col>
                <Col xs={6} md={3}>
                  <StatTile
                    label="Confirm Rate"
                    value={`${ov.conversionConfirmRate}%`}
                    sub="of claims approved by you"
                    icon="bi-check2-circle"
                    accent="#0dcaf0"
                  />
                </Col>
                <Col xs={6} md={3}>
                  <StatTile
                    label="Avg Call Duration"
                    value={ov.avgCallDurationMinutes != null ? `${ov.avgCallDurationMinutes} min` : "N/A"}
                    icon="bi-stopwatch"
                    accent="#fd7e14"
                  />
                </Col>
                <Col xs={6} md={3}>
                  <StatTile
                    label="Leads Assigned"
                    value={ov.totalLeadsAssigned}
                    sub={`${ov.leadsPending} still open`}
                    icon="bi-people-fill"
                    accent="#6c757d"
                  />
                </Col>
                <Col xs={6} md={3}>
                  <StatTile
                    label="Completion Rate"
                    value={`${ov.leadCompletionRate}%`}
                    sub={`${ov.leadsCompleted} of ${ov.totalLeadsAssigned} leads resolved`}
                    icon="bi-check-circle-fill"
                    accent="#198754"
                  />
                </Col>
                <Col xs={6} md={3}>
                  <StatTile
                    label="Campaigns"
                    value={ov.campaignsWorked}
                    sub={`${ov.activeCampaigns} currently active`}
                    icon="bi-megaphone-fill"
                    accent="#0d6efd"
                  />
                </Col>
              </Row>

              {/* Completion progress bar */}
              <div className="mt-3 px-1">
                <div className="d-flex justify-content-between small text-muted mb-1">
                  <span>Overall lead completion</span>
                  <span className="fw-bold">{ov.leadCompletionRate}%</span>
                </div>
                <ProgressBar
                  now={ov.leadCompletionRate}
                  variant={ov.leadCompletionRate >= 80 ? "success" : ov.leadCompletionRate >= 50 ? "warning" : "danger"}
                  style={{ height: "8px", borderRadius: "99px" }}
                />
              </div>
            </div>

            <Row className="g-4 mb-4">
              {/* Outcome Breakdown */}
              <Col md={5}>
                <div className="rounded-4 p-3 h-100" style={{ background: "#f8f9fa" }}>
                  <h6 className="fw-bold text-secondary text-uppercase mb-3" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                    <i className="bi bi-pie-chart-fill me-2"></i>Outcome Breakdown
                  </h6>
                  <OutcomeBreakdown breakdown={perf.outcomeBreakdown} totalCalls={ov.totalCallsLogged} />
                </div>
              </Col>

              {/* Activity Trend */}
              <Col md={7}>
                <div className="rounded-4 p-3 h-100" style={{ background: "#f8f9fa" }}>
                  <h6 className="fw-bold text-secondary text-uppercase mb-3" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                    <i className="bi bi-bar-chart-fill me-2"></i>Activity — Last 30 Days
                    <span className="text-muted fw-normal ms-2 text-lowercase" style={{ fontSize: "0.7rem" }}>
                      ({perf.activityTrend.reduce((s, d) => s + d.count, 0)} calls)
                    </span>
                  </h6>
                  <ActivitySparkline trend={perf.activityTrend} />
                  {perf.activityTrend.length > 0 && (
                    <div className="d-flex justify-content-between text-muted mt-1" style={{ fontSize: "0.7rem" }}>
                      <span>{perf.activityTrend[0]?.date}</span>
                      <span>{perf.activityTrend[perf.activityTrend.length - 1]?.date}</span>
                    </div>
                  )}
                </div>
              </Col>
            </Row>

            {/* Campaign History Table */}
            {perf.campaignBreakdown.length > 0 && (
              <div>
                <h6 className="fw-bold text-secondary text-uppercase mb-3" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                  <i className="bi bi-clock-history me-2"></i>Campaign History ({perf.campaignBreakdown.length})
                </h6>
                <div className="rounded-4 overflow-hidden border" style={{ borderColor: "#e9ecef !important" }}>
                  <Table responsive hover className="mb-0 align-middle" style={{ fontSize: "0.875rem" }}>
                    <thead style={{ background: "#f8f9fa" }}>
                      <tr className="text-secondary small text-uppercase">
                        <th className="border-0 ps-3 fw-semibold">Campaign</th>
                        <th className="border-0 fw-semibold">Client</th>
                        <th className="border-0 fw-semibold">Status</th>
                        <th className="border-0 fw-semibold text-center">Calls</th>
                        <th className="border-0 fw-semibold text-center">Leads</th>
                        <th className="border-0 fw-semibold text-center">Conversions</th>
                        <th className="border-0 pe-3 fw-semibold text-center">Avg Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perf.campaignBreakdown.map(c => {
                        const statusColor = {
                          active: "success", paused: "warning",
                          completed: "info", draft: "secondary"
                        }[c.status] || "secondary";
                        return (
                          <tr key={c.campaignId} style={{ borderBottom: "1px solid #f0f0f0" }}>
                            <td className="ps-3 fw-semibold text-dark">
                              {c.campaignName}
                              {c.isCurrentlyAssigned && (
                                <Badge bg="primary" className="ms-2 px-2 rounded-pill" style={{ fontSize: "0.65rem" }}>
                                  Current
                                </Badge>
                              )}
                            </td>
                            <td className="text-muted">{c.clientName || "—"}</td>
                            <td>
                              <Badge bg={statusColor} className="px-2 py-1 rounded-pill text-uppercase" style={{ fontSize: "0.65rem" }}>
                                {c.status}
                              </Badge>
                            </td>
                            <td className="text-center fw-bold text-primary">{c.callsLogged}</td>
                            <td className="text-center text-muted">
                              {c.leadsCompleted}/{c.leadsAssigned}
                            </td>
                            <td className="text-center">
                              {c.conversionsConfirmed > 0 ? (
                                <span className="fw-bold text-success">{c.conversionsConfirmed}</span>
                              ) : c.conversionsClaimed > 0 ? (
                                <span className="text-warning fw-bold">{c.conversionsClaimed} pending</span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td className="text-center pe-3 text-muted">
                              {c.avgCallDurationMinutes != null ? `${c.avgCallDurationMinutes} min` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}

            {perf.campaignBreakdown.length === 0 && (
              <div className="text-center py-4 text-muted rounded-4" style={{ background: "#f8f9fa" }}>
                <i className="bi bi-megaphone fs-2 d-block mb-2 opacity-40"></i>
                <div className="small">No campaigns worked yet.</div>
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button variant="light" onClick={onClose} className="rounded-pill px-4">Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExecutivesPage() {
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Create executive modal
  const [showModal, setShowModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "" });

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({ show: false, exec: null, action: null });
  const [isConfirming, setIsConfirming] = useState(false);

  // Performance drawer
  const [viewingExec, setViewingExec] = useState(null);

  const loadExecutives = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/executives");
      setExecutives(res.data.data);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load executives."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadExecutives(); }, [loadExecutives]);

  const handleShow = () => {
    setFormData({ firstName: "", lastName: "", email: "" });
    setFormError("");
    setFormErrors({});
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setFormError("");
    setFormErrors({});
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormErrors(prev => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormErrors({});
    setIsSubmitting(true);
    try {
      await api.post("/users/executives", formData);
      handleClose();
      loadExecutives();
      setSuccessMessage("Executive created! Their temporary password has been emailed.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setFormErrors(getFieldErrors(err));
      setFormError(getApiErrorMessage(err, "Failed to create executive."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConfirmDialog = (exec, action) => setConfirmDialog({ show: true, exec, action });

  const handleConfirmAction = async () => {
    const { exec, action } = confirmDialog;
    setIsConfirming(true);
    try {
      if (action === "deactivate" || action === "reactivate") {
        await api.patch(`/users/${exec.id}/${action}`);
        loadExecutives();
        setSuccessMessage(`Executive ${action}d successfully.`);
      } else if (action === "reset-password") {
        await api.post(`/users/${exec.id}/reset-password`);
        setSuccessMessage(`Password reset link sent to ${exec.email}.`);
      }
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError(getApiErrorMessage(err, `Failed to ${action.replace("-", " ")}.`));
    } finally {
      setIsConfirming(false);
      setConfirmDialog({ show: false, exec: null, action: null });
    }
  };

  const getConfirmDialogProps = () => {
    const { exec, action } = confirmDialog;
    if (!exec || !action) return null;
    if (action === "reset-password") return {
      title: "Reset Password",
      message: `Send a password reset link to ${exec.firstName} (${exec.email})?`,
      confirmText: "Send Link", variant: "primary"
    };
    if (action === "deactivate") return {
      title: "Deactivate Executive",
      message: (
        <>
          Deactivate <strong>{exec.firstName} {exec.lastName}</strong>?
          {exec.openLeads > 0 && (
            <div className="mt-2 p-2 bg-danger bg-opacity-10 rounded text-danger small">
              <i className="bi bi-exclamation-triangle me-1"></i>
              This executive has <strong>{exec.openLeads} open leads</strong> — they will become stranded.
              Reassign them after deactivating.
            </div>
          )}
        </>
      ),
      confirmText: "Deactivate", variant: "danger"
    };
    return {
      title: "Reactivate Executive",
      message: `Reactivate ${exec.firstName} ${exec.lastName}?`,
      confirmText: "Reactivate", variant: "success"
    };
  };

  const confirmProps = getConfirmDialogProps();

  return (
    <AppLayout role="manager">
      {/* ── Page Header ── */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h3 className="fw-bolder mb-1 text-dark">Executives</h3>
          <p className="text-secondary small mb-0">
            Manage your outreach team. Click <strong>View Performance</strong> on any executive to see their full analytics.
          </p>
        </div>
        <Button variant="primary" onClick={handleShow} className="px-4 fw-medium shadow-sm rounded-pill">
          <i className="bi bi-plus-lg me-2"></i>Add Executive
        </Button>
      </div>

      {error && <AlertMessage message={error} />}
      {successMessage && <AlertMessage variant="success" message={successMessage} />}

      {/* ── Team Summary Cards ── */}
      {!loading && executives.length > 0 && (
        <Row className="g-3 mb-4">
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm rounded-4 text-center py-3">
              <div className="text-secondary small fw-bold text-uppercase mb-1" style={{ fontSize: "0.7rem" }}>Total Executives</div>
              <div className="fs-2 fw-bolder text-primary">{executives.length}</div>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm rounded-4 text-center py-3">
              <div className="text-secondary small fw-bold text-uppercase mb-1" style={{ fontSize: "0.7rem" }}>Active</div>
              <div className="fs-2 fw-bolder text-success">{executives.filter(e => e.isActive).length}</div>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm rounded-4 text-center py-3">
              <div className="text-secondary small fw-bold text-uppercase mb-1" style={{ fontSize: "0.7rem" }}>Open Leads (Team)</div>
              <div className="fs-2 fw-bolder text-warning">{executives.reduce((s, e) => s + (e.openLeads || 0), 0)}</div>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm rounded-4 text-center py-3">
              <div className="text-secondary small fw-bold text-uppercase mb-1" style={{ fontSize: "0.7rem" }}>Total Calls (All Time)</div>
              <div className="fs-2 fw-bolder text-info">{executives.reduce((s, e) => s + (e.callsLogged || 0), 0)}</div>
            </Card>
          </Col>
        </Row>
      )}

      {/* ── Executives Table ── */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: "12px", overflow: "hidden" }}>
        <Card.Body className="p-0">
          {loading ? (
            <div className="p-5 d-flex justify-content-center"><LoadingSpinner /></div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light text-muted">
                <tr>
                  <th className="px-4 py-3 fw-semibold border-0">Executive</th>
                  <th className="px-4 py-3 fw-semibold border-0">Active Campaigns</th>
                  <th className="px-4 py-3 fw-semibold border-0">Open Leads</th>
                  <th className="px-4 py-3 fw-semibold border-0">All-Time Calls</th>
                  <th className="px-4 py-3 fw-semibold border-0">Status</th>
                  <th className="px-4 py-3 fw-semibold border-0 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {executives.length > 0 ? executives.map(exec => (
                  <tr key={exec.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center fw-bolder text-white flex-shrink-0"
                          style={{
                            width: 40, height: 40, fontSize: "0.85rem",
                            background: exec.isActive
                              ? "linear-gradient(135deg,#0d6efd,#6610f2)"
                              : "#adb5bd"
                          }}
                        >
                          {exec.firstName?.[0]}{exec.lastName?.[0]}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{exec.firstName} {exec.lastName}</div>
                          <div className="text-muted small">{exec.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge bg="primary" className="bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold">
                        {exec.assignedCampaigns?.length || 0} Campaign{exec.assignedCampaigns?.length !== 1 ? "s" : ""}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        bg={exec.openLeads > 0 ? "warning" : "secondary"}
                        className={`px-3 py-2 rounded-pill fw-bold ${exec.openLeads > 0 ? "text-dark" : "bg-opacity-10 text-secondary"}`}
                      >
                        {exec.openLeads || 0} Lead{exec.openLeads !== 1 ? "s" : ""}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="fw-bold text-primary">{exec.callsLogged || 0}</span>
                      <span className="text-muted small ms-1">calls</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        bg={exec.isActive ? "success" : "secondary"}
                        className="px-3 py-2 rounded-pill fw-bold text-uppercase"
                        style={{ fontSize: "0.65rem" }}
                      >
                        {exec.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="rounded-pill px-3 fw-medium"
                          onClick={() => setViewingExec(exec)}
                        >
                          <i className="bi bi-bar-chart me-1"></i>Performance
                        </Button>
                        <Dropdown>
                          <Dropdown.Toggle
                            variant="light"
                            size="sm"
                            className="rounded-circle shadow-sm border-0 px-2 text-secondary"
                            style={{ width: 32, height: 32 }}
                          >
                            <i className="bi bi-three-dots-vertical"></i>
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="border-0 shadow-sm rounded-3">
                            <Dropdown.Item
                              onClick={() => openConfirmDialog(exec, "reset-password")}
                              className="fw-medium text-dark py-2"
                            >
                              <i className="bi bi-envelope me-2 text-primary"></i>Reset Password
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item
                              onClick={() => openConfirmDialog(exec, exec.isActive ? "deactivate" : "reactivate")}
                              className={`fw-medium py-2 ${exec.isActive ? "text-danger" : "text-success"}`}
                            >
                              {exec.isActive
                                ? <><i className="bi bi-pause-circle me-2"></i>Deactivate</>
                                : <><i className="bi bi-play-circle me-2"></i>Reactivate</>
                              }
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-5">
                      <i className="bi bi-people fs-1 d-block mb-3 opacity-25"></i>
                      No executives yet. Click <strong>Add Executive</strong> to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* ── Performance Drawer ── */}
      <PerformanceDrawer executive={viewingExec} onClose={() => setViewingExec(null)} />

      {/* ── Create Executive Modal ── */}
      <Modal show={showModal} onHide={handleClose} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bolder">Add New Executive</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            {formError && <AlertMessage message={formError} />}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">First Name</Form.Label>
              <Form.Control
                type="text" name="firstName" required
                value={formData.firstName} onChange={handleChange}
                placeholder="e.g. Raj" isInvalid={Boolean(formErrors.firstName)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid">{formErrors.firstName}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Last Name</Form.Label>
              <Form.Control
                type="text" name="lastName" required
                value={formData.lastName} onChange={handleChange}
                placeholder="e.g. Kumar" isInvalid={Boolean(formErrors.lastName)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid">{formErrors.lastName}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-1">
              <Form.Label className="fw-semibold small">Email</Form.Label>
              <Form.Control
                type="email" name="email" required
                value={formData.email} onChange={handleChange}
                placeholder="raj@acme-agency.com" isInvalid={Boolean(formErrors.email)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
            </Form.Group>
            <p className="text-muted small mt-2 mb-0">
              <i className="bi bi-info-circle me-1"></i>
              A temporary password will be auto-generated and emailed to this address.
            </p>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={handleClose} disabled={isSubmitting} className="rounded-pill px-4">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting} className="rounded-pill px-4 fw-bold">
              {isSubmitting
                ? <><Spinner animation="border" size="sm" className="me-2" />Creating…</>
                : <><i className="bi bi-person-plus me-2"></i>Create Executive</>
              }
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {confirmProps && (
        <ConfirmDialog
          show={confirmDialog.show}
          title={confirmProps.title}
          message={confirmProps.message}
          confirmText={confirmProps.confirmText}
          cancelText="Cancel"
          variant={confirmProps.variant}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmDialog({ show: false, exec: null, action: null })}
          isProcessing={isConfirming}
        />
      )}
    </AppLayout>
  );
}
