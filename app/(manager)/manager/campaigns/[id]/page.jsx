
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import ProgressBar from "react-bootstrap/ProgressBar";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

// ─── Outcome colour map (matches backend enum) ────────────────────────────────
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

// ─── Inline performance mini-card for the assignment panel ───────────────────
function ExecPerformanceMini({ execId }) {
  const [perf, setPerf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/executives/${execId}/performance`)
      .then(res => setPerf(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [execId]);

  if (loading) return <Spinner animation="border" size="sm" variant="secondary" />;
  if (!perf) return null;

  const ov = perf.overview;
  const claimRate = ov.conversionClaimRate ?? 0;

  return (
    <div className="d-flex align-items-center gap-3 flex-wrap">
      <span className="text-muted small">
        <i className="bi bi-telephone-fill me-1 text-primary"></i>
        <strong className="text-dark">{ov.totalCallsLogged}</strong> calls
      </span>
      <span className="text-muted small">
        <i className="bi bi-trophy-fill me-1 text-success"></i>
        <strong className="text-dark">{ov.totalConversionsConfirmed}</strong> conversions
      </span>
      <span className="text-muted small">
        <i className="bi bi-people-fill me-1 text-info"></i>
        <strong className="text-dark">{ov.activeCampaigns}</strong> active campaign{ov.activeCampaigns !== 1 ? "s" : ""}
      </span>
      <span className="text-muted small">
        <i className="bi bi-percent me-1 text-warning"></i>
        <strong className="text-dark">{claimRate}%</strong> claim rate
      </span>
      {ov.totalCallsLogged === 0 && (
        <span className="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1 rounded-pill small">New Executive</span>
      )}
    </div>
  );
}

// ─── Full performance drawer (opened from campaign exec list) ─────────────────
function ExecPerformanceDrawer({ executive, onClose }) {
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
            style={{ width: 52, height: 52, background: "linear-gradient(135deg,#0d6efd,#6610f2)", fontSize: "1.1rem", flexShrink: 0 }}
          >
            {initials}
          </div>
          <div>
            <Modal.Title className="fw-bolder mb-0" style={{ fontSize: "1.2rem" }}>
              {executive?.firstName} {executive?.lastName}
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
            {/* KPI tiles */}
            <h6 className="fw-bold text-secondary text-uppercase mb-3" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>
              <i className="bi bi-graph-up me-2"></i>Lifetime Performance
            </h6>
            <Row className="g-3 mb-4">
              {[
                { label: "Total Calls", value: ov.totalCallsLogged, accent: "#0d6efd", icon: "bi-telephone-fill" },
                { label: "Confirmed Conversions", value: ov.totalConversionsConfirmed, sub: `${ov.totalConversionsClaimed} claimed`, accent: "#198754", icon: "bi-trophy-fill" },
                { label: "Claim Rate", value: `${ov.conversionClaimRate}%`, sub: "conversions per call", accent: "#6610f2", icon: "bi-percent" },
                { label: "Confirm Rate", value: `${ov.conversionConfirmRate}%`, sub: "claims you approved", accent: "#0dcaf0", icon: "bi-check2-circle" },
                { label: "Avg Call Duration", value: ov.avgCallDurationMinutes != null ? `${ov.avgCallDurationMinutes} min` : "N/A", accent: "#fd7e14", icon: "bi-stopwatch" },
                { label: "Leads Assigned", value: ov.totalLeadsAssigned, sub: `${ov.leadsPending} still open`, accent: "#6c757d", icon: "bi-people-fill" },
                { label: "Completion Rate", value: `${ov.leadCompletionRate}%`, sub: `${ov.leadsCompleted}/${ov.totalLeadsAssigned} resolved`, accent: "#198754", icon: "bi-check-circle-fill" },
                { label: "Campaigns Worked", value: ov.campaignsWorked, sub: `${ov.activeCampaigns} currently active`, accent: "#0d6efd", icon: "bi-megaphone-fill" },
              ].map(({ label, value, sub, accent, icon }) => (
                <Col xs={6} md={3} key={label}>
                  <div className="rounded-4 p-3 h-100" style={{ background: "#f8f9fa", borderLeft: `4px solid ${accent}` }}>
                    <div className="text-secondary mb-1 d-flex align-items-center gap-1" style={{ fontSize: "0.7rem", letterSpacing: "0.06em" }}>
                      <i className={`bi ${icon}`} /><span className="text-uppercase fw-semibold">{label}</span>
                    </div>
                    <div className="fw-bolder" style={{ fontSize: "1.4rem", color: accent, lineHeight: 1 }}>{value ?? "—"}</div>
                    {sub && <div className="text-muted mt-1" style={{ fontSize: "0.72rem" }}>{sub}</div>}
                  </div>
                </Col>
              ))}
            </Row>

            {/* Completion bar */}
            <div className="mb-4 px-1">
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

            {/* Outcome breakdown */}
            {Object.keys(perf.outcomeBreakdown).length > 0 && (
              <div className="rounded-4 p-3 mb-4" style={{ background: "#f8f9fa" }}>
                <h6 className="fw-bold text-secondary text-uppercase mb-3" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                  <i className="bi bi-pie-chart-fill me-2"></i>Outcome Breakdown
                </h6>
                <div className="d-flex flex-column gap-2">
                  {Object.entries(perf.outcomeBreakdown).sort((a, b) => b[1] - a[1]).map(([outcome, count]) => {
                    const pct = Math.round((count / ov.totalCallsLogged) * 100);
                    const color = OUTCOME_COLORS[outcome] || "#6c757d";
                    return (
                      <div key={outcome}>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small fw-medium" style={{ color: "#444" }}>{outcome}</span>
                          <span className="small text-muted">{count} ({pct}%)</span>
                        </div>
                        <div className="rounded-pill overflow-hidden" style={{ height: "7px", background: "#e9ecef" }}>
                          <div className="h-100 rounded-pill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Campaign history table */}
            {perf.campaignBreakdown.length > 0 && (
              <>
                <h6 className="fw-bold text-secondary text-uppercase mb-3" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                  <i className="bi bi-clock-history me-2"></i>Campaign History
                </h6>
                <div className="rounded-4 overflow-hidden border">
                  <Table responsive hover className="mb-0 align-middle" style={{ fontSize: "0.875rem" }}>
                    <thead style={{ background: "#f8f9fa" }}>
                      <tr className="text-secondary small text-uppercase">
                        <th className="border-0 ps-3 fw-semibold">Campaign</th>
                        <th className="border-0 fw-semibold">Status</th>
                        <th className="border-0 fw-semibold text-center">Calls</th>
                        <th className="border-0 fw-semibold text-center">Leads Done</th>
                        <th className="border-0 fw-semibold text-center pe-3">Conversions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perf.campaignBreakdown.map(c => (
                        <tr key={c.campaignId} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td className="ps-3 fw-semibold text-dark">
                            {c.campaignName}
                            {c.isCurrentlyAssigned && (
                              <Badge bg="primary" className="ms-2 px-2 rounded-pill" style={{ fontSize: "0.6rem" }}>Current</Badge>
                            )}
                          </td>
                          <td>
                            <Badge bg={{ active: "success", paused: "warning", completed: "info", draft: "secondary" }[c.status] || "secondary"}
                              className="px-2 py-1 rounded-pill text-uppercase" style={{ fontSize: "0.6rem" }}>
                              {c.status}
                            </Badge>
                          </td>
                          <td className="text-center fw-bold text-primary">{c.callsLogged}</td>
                          <td className="text-center text-muted">{c.leadsCompleted}/{c.leadsAssigned}</td>
                          <td className="text-center pe-3">
                            {c.conversionsConfirmed > 0
                              ? <span className="fw-bold text-success">{c.conversionsConfirmed} ✓</span>
                              : c.conversionsClaimed > 0
                              ? <span className="text-warning fw-bold">{c.conversionsClaimed} pending</span>
                              : <span className="text-muted">—</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </>
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

export default function CampaignManagementDashboard()
{
  const params = useParams();
  const campaignId = params.id;
  const router = useRouter();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Executive Management
  const [allExecutives, setAllExecutives] = useState([]);
  // Performance drawer state (for viewing an exec's stats from the campaign page)
  const [viewingExec, setViewingExec] = useState(null);
  // To populate the "onlyFromCampaignId" dropdown
  const [clientCampaigns, setClientCampaigns] = useState([]);

  // Audience Preview
  const [previewLeads, setPreviewLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Form states for Draft editing
  const [filters, setFilters] = useState({
    membershipStatus: "",
    industry: "",
    jobTitle: "",
    source: "",
    onlyFromCampaignId: "",
  });
  const [excludeClosed, setExcludeClosed] = useState(true);
  const [emailSettings, setEmailSettings] = useState({
    subjectLine: "",
    senderName: "",
    emailBodyHtml: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [pendingConversions, setPendingConversions] = useState([]);

  // Stranded Leads Reassignment
  const [strandedLeads, setStrandedLeads] = useState([]);
  const [selectedStrandedLeads, setSelectedStrandedLeads] = useState([]);
  const [reassignTargetExecutive, setReassignTargetExecutive] = useState("");

  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [emailDispatches, setEmailDispatches] = useState([]);
  const [emailAnalytics, setEmailAnalytics] = useState(null);

  const loadData = async () =>
  {
    try
    {
      setLoading(true);
      const campRes = await api.get(`/campaigns/${campaignId}`);
      const campData = campRes.data.data;
      setCampaign(campData);

      // Initialize forms if draft
      if (campData.status === "draft")
      {
        setFilters({
          membershipStatus: campData.segmentationFilters?.membershipStatus || "",
          industry: campData.segmentationFilters?.industry || "",
          jobTitle: campData.segmentationFilters?.jobTitle || "",
          source: campData.segmentationFilters?.source || "",
          onlyFromCampaignId: campData.segmentationFilters?.onlyFromCampaignId || "",
        });
        setExcludeClosed(campData.excludeClosedLeads ?? true);
        setEmailSettings({
          subjectLine: campData.subjectLine || "",
          senderName: campData.senderName || "",
          emailBodyHtml: campData.emailBodyHtml || "",
        });
        setBannerImageUrl(campData.bannerImageUrl || "");

        // Fetch sibling campaigns in the same cadence for the "Target Leads from Prior Step" dropdown.
        // We ONLY offer cadence siblings here — they are the only campaigns guaranteed to share
        // the same lead list. Loading all client campaigns would allow cross-list targeting which
        // is logically incorrect (CampaignLead rows from a different list don't overlap this one).
        if (campData.sequenceId) {
          try {
            const siblingsRes = await api.get(`/campaigns?sequenceId=${campData.sequenceId}`);
            // Exclude this campaign itself from the options
            setClientCampaigns(siblingsRes.data.data.filter(c => c.id !== campaignId));
          } catch (e) {
            console.error("Failed to load cadence siblings for prior-step targeting dropdown", e);
          }
        } else {
          // Standalone campaign: no prior-step filter available — clear it
          setClientCampaigns([]);
        }
      }

      // If it's a call campaign, fetch available executives and pending conversions
      if (campData.type === "call")
      {
        const execRes = await api.get("/users/executives");
        setAllExecutives(execRes.data.data);

        if (campData.status !== "draft")
        {
          const pcRes = await api.get(`/call/campaigns/${campaignId}/pending-conversions`);
          setPendingConversions(pcRes.data.data || []);

          try
          {
            const strRes = await api.get(`/campaigns/${campaignId}/stranded-leads`);
            setStrandedLeads(strRes.data.data || []);
          } catch (e)
          {
            console.error("Failed to load stranded leads", e);
          }
        }
      }

      // If it's an email campaign and approved, fetch dispatches and analytics
      if (campData.type === "email" && campData.status !== "draft")
      {
        const [dispRes, anRes] = await Promise.all([
          api.get(`/email/campaigns/${campaignId}/dispatches`),
          api.get(`/email/campaigns/${campaignId}/analytics`)
        ]);
        setEmailDispatches(dispRes.data.data);
        setEmailAnalytics(anRes.data.data);
      }
    } catch (err)
    {
      setError(getApiErrorMessage(err, "Failed to load campaign data."));
    } finally
    {
      setLoading(false);
    }
  };

  useEffect(() =>
  {
    loadData();
  }, [campaignId]);

  // Audience Preview Logic
  useEffect(() =>
  {
    if (!campaign || campaign.status !== "draft") return;
    const fetchPreview = async () =>
    {
      setLoadingLeads(true);
      try
      {
        const query = new URLSearchParams();
        query.append("clientId", campaign.clientId);
        query.append("leadListId", campaign.leadListId);
        query.append("pageSize", "10");

        if (filters.membershipStatus) query.append("status", filters.membershipStatus);
        if (filters.industry) query.append("industry", filters.industry);
        if (filters.jobTitle) query.append("jobTitle", filters.jobTitle);
        if (filters.source) query.append("source", filters.source);
        if (filters.onlyFromCampaignId) query.append("onlyFromCampaignId", filters.onlyFromCampaignId);

        const res = await api.get(`/leads?${query.toString()}`);
        setPreviewLeads(res.data.data);
      } catch (err)
      {
        console.error("Preview fetch failed", err);
      } finally
      {
        setLoadingLeads(false);
      }
    };

    const timeout = setTimeout(fetchPreview, 500);
    return () => clearTimeout(timeout);
  }, [campaign, filters]);

  const handleBannerUpload = async (e) =>
  {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("File too large. Max 5MB.");

    setUploadingBanner(true);
    try
    {
      const presignRes = await api.post('/uploads/banner-url', {
        campaignId,
        contentType: file.type,
        fileSize: file.size
      });
      const { uploadUrl, method, publicUrl } = presignRes.data.data;

      await fetch(uploadUrl, {
        method: method,
        body: file,
        headers: { 'Content-Type': file.type }
      });

      setBannerImageUrl(publicUrl);
    } catch (err)
    {
      alert(getApiErrorMessage(err, "Failed to upload banner."));
    } finally
    {
      setUploadingBanner(false);
    }
  };

  const handleLoadDefaultTemplate = () => {
    setEmailSettings({
      subjectLine: "Exclusive Demo for {{company}} — Transform Your Outbound Pipeline",
      senderName: "Nexsales Outreach Team",
      emailBodyHtml: `<p>Hi {{first_name}},</p>
<p>I noticed {{company}} has been scaling its operations recently. We help teams like yours streamline their workflows and increase efficiency by up to 30%.</p>
<p>You can <a href="https://example.com/demo-video">watch our 2-minute demo video here</a> to see exactly how our platform works.</p>
<p>If you're ready to chat about how we can support your growth, just click below:</p>
<p>{{conversion_link}}</p>
<p>Best,<br>
The Acme Team</p>`
    });
  };

  const handleSaveDraft = async () =>
  {
    setIsSaving(true);
    try
    {
      const cleanFilters = {};
      if (filters.membershipStatus) cleanFilters.membershipStatus = filters.membershipStatus;
      if (filters.industry) cleanFilters.industry = filters.industry;
      if (filters.jobTitle) cleanFilters.jobTitle = filters.jobTitle;
      if (filters.source) cleanFilters.source = filters.source;
      if (filters.onlyFromCampaignId) cleanFilters.onlyFromCampaignId = filters.onlyFromCampaignId;

      const payload = {
        segmentationFilters: Object.keys(cleanFilters).length > 0 ? cleanFilters : null,
        excludeClosedLeads: excludeClosed,
      };

      if (campaign.type === "email")
      {
        payload.subjectLine = emailSettings.subjectLine;
        payload.senderName = emailSettings.senderName;
        payload.emailBodyHtml = emailSettings.emailBodyHtml;
        payload.bannerImageUrl = bannerImageUrl ? bannerImageUrl : null;
      }

      await api.patch(`/campaigns/${campaignId}`, payload);
      await loadData();
      alert("Draft settings saved!");
    } catch (err)
    {
      alert(getApiErrorMessage(err, "Failed to save draft."));
    } finally
    {
      setIsSaving(false);
    }
  };

  const handleDeleteDraft = async () =>
  {
    setIsDeleting(true);
    try
    {
      await api.delete(`/campaigns/${campaignId}`);
      router.push("/manager/campaigns");
    } catch (err)
    {
      alert(getApiErrorMessage(err, "Failed to delete draft campaign."));
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDispatchEmail = async () =>
  {
    if (!confirm("Dispatch this email campaign now?")) return;
    try
    {
      setIsDispatching(true);
      await api.post(`/email/campaigns/${campaignId}/dispatch`);
      await loadData();
    } catch (err)
    {
      alert(getApiErrorMessage(err, "Failed to dispatch email."));
    } finally
    {
      setIsDispatching(false);
    }
  };

  const handleApprove = async () =>
  {
    if (!confirm("Are you sure you want to approve this campaign? This will freeze the audience and cannot be undone.")) return;
    try
    {
      await api.patch(`/campaigns/${campaignId}/approve`);
      await loadData();
    } catch (err)
    {
      alert(getApiErrorMessage(err, "Failed to approve campaign. Check requirements."));
    }
  };

  const handleStatusChange = async (newStatus) =>
  {
    try
    {
      await api.patch(`/campaigns/${campaignId}/${newStatus}`);
      await loadData();
    } catch (err)
    {
      alert(getApiErrorMessage(err, `Failed to change status to ${newStatus}.`));
    }
  };

  const assignExecutive = async (execId) =>
  {
    try
    {
      await api.post(`/campaigns/${campaignId}/executives`, { executiveUserIds: [execId] });
      await loadData();
    } catch (err)
    {
      alert(getApiErrorMessage(err, "Failed to assign executive."));
    }
  };

  const unassignExecutive = async (execId) =>
  {
    if (!confirm("Unassign executive? Their pending leads will be returned to the pool.")) return;
    try
    {
      await api.delete(`/campaigns/${campaignId}/executives/${execId}`);
      await loadData();
    } catch (err)
    {
      alert(getApiErrorMessage(err, "Failed to unassign executive."));
    }
  };

  const reviewConversion = async (remarkId, confirmed) =>
  {
    try
    {
      await api.patch(`/call/remarks/${remarkId}/review`, { confirmed });
      const pcRes = await api.get(`/call/campaigns/${campaignId}/pending-conversions`);
      setPendingConversions(pcRes.data.data || []);
    } catch (err)
    {
      alert(getApiErrorMessage(err, "Failed to review conversion."));
    }
  };

  const handleReassignLeads = async () =>
  {
    if (!reassignTargetExecutive || selectedStrandedLeads.length === 0)
    {
      return alert("Select an executive and at least one lead.");
    }
    if (!confirm(`Reassign ${selectedStrandedLeads.length} leads?`)) return;
    try
    {
      await api.post(`/campaigns/${campaignId}/reassign-leads`, {
        targetExecutiveId: reassignTargetExecutive,
        leadIds: selectedStrandedLeads
      });
      setSelectedStrandedLeads([]);
      setReassignTargetExecutive("");
      await loadData();
      alert("Leads reassigned successfully.");
    } catch (err)
    {
      alert(getApiErrorMessage(err, "Failed to reassign leads."));
    }
  };

  if (loading) return <AppLayout role="manager"><LoadingSpinner /></AppLayout>;
  if (error || !campaign) return <AppLayout role="manager"><AlertMessage message={error} /></AppLayout>;

  return (
    <AppLayout role="manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <PageHeader
            title={campaign.name}
            subtitle={`${campaign.type === 'call' ? 'Call' : 'Email'} Campaign Workflow`}
          />
        </div>
        <div className="d-flex gap-2">
          {campaign.status === "draft" && (
            <>
              <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)} className="rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center">
                <i className="bi bi-trash-fill me-2"></i> Delete Draft
              </Button>
              <Button variant="success" onClick={handleApprove} className="rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center">
                <i className="bi bi-check-circle me-2"></i> Approve Campaign
              </Button>
            </>
          )}
          {campaign.status === "active" && (
            <Button variant="warning" onClick={() => handleStatusChange("pause")} className="rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center">
              <i className="bi bi-pause-fill me-2"></i> Pause
            </Button>
          )}
          {campaign.status === "paused" && (
            <Button variant="success" onClick={() => handleStatusChange("resume")} className="rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center">
              <i className="bi bi-play-fill me-2"></i> Resume
            </Button>
          )}
          {(campaign.status === "active" || campaign.status === "paused") && (
            <Button variant="danger" onClick={() => handleStatusChange("end")} className="rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center">
              <i className="bi bi-stop-circle me-2"></i> End Early
            </Button>
          )}
        </div>
      </div>

      <Row className="mb-5">
        <Col md={12}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)' }}>
            <Card.Body className="p-4 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-4">
                <div className={`bg-${campaign.status === 'active' ? 'success' : campaign.status === 'paused' ? 'warning' : campaign.status === 'completed' ? 'info' : 'secondary'} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '64px', height: '64px' }}>
                  <i className={`bi bi-${campaign.type === 'email' ? 'envelope' : 'telephone'} fs-2 text-${campaign.status === 'active' ? 'success' : campaign.status === 'paused' ? 'warning' : campaign.status === 'completed' ? 'info' : 'secondary'}`}></i>
                </div>
                <div>
                  <span className="text-muted d-block small text-uppercase fw-bold tracking-wide mb-1">Current Status</span>
                  <Badge bg={
                    campaign.status === 'active' ? 'success' :
                      campaign.status === 'paused' ? 'warning' :
                        campaign.status === 'completed' ? 'info' : 'secondary'
                  } className="px-3 py-2 rounded-pill fs-6 text-uppercase fw-bolder shadow-sm">
                    {campaign.status}
                  </Badge>
                </div>
              </div>
              <div className="text-end border-start ps-4">
                <span className="text-muted d-block small text-uppercase fw-bold tracking-wide mb-1">Frozen Audience Size</span>
                <span className="fs-3 fw-bolder text-dark">
                  {campaign.status === 'draft' ? <span className="fs-5 text-secondary">Pending Approval</span> : campaign.audienceCount}
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey={campaign.status === "draft" ? "setup" : "team"} className="mb-4">

        {/* SETUP & SEGMENTATION TAB */}
        <Tab eventKey="setup" title="Audience & Setup" disabled={campaign.status !== "draft" && campaign.status !== "completed" && campaign.status !== "active" && campaign.status !== "paused"}>
          <Row>
            <Col md={12}>
              <Card className="border mb-4 shadow-sm">
                <Card.Header className="bg-white border-bottom fw-bold p-3 fs-5">
                  <i className="bi bi-funnel me-2 text-primary"></i> Audience Segmentation
                </Card.Header>
                <Card.Body className="p-4">
                  {campaign.status !== "draft" ? (
                    <AlertMessage variant="info" message="Audience is frozen. Segmentation filters can no longer be edited." />
                  ) : (
                    <Form>
                      <Row>
                        {/* LEFT COLUMN: History & Engagement */}
                        <Col md={6} className="pe-md-4 border-md-end">
                          <h6 className="fw-bold mb-3 text-secondary text-uppercase small tracking-wide">History & Engagement</h6>

                          <Form.Group className="mb-3">
                            <Form.Label className="fw-medium">
                              Target Leads from Prior Cadence Step
                            </Form.Label>
                            {!campaign.sequenceId ? (
                              <div className="text-muted small p-2 bg-light rounded-3">
                                <i className="bi bi-info-circle me-1"></i>
                                This filter is only available for cadence-linked campaigns. This is a standalone campaign.
                              </div>
                            ) : clientCampaigns.length === 0 ? (
                              <div className="text-muted small p-2 bg-light rounded-3">
                                <i className="bi bi-info-circle me-1"></i>
                                No other steps in this cadence yet. Add another campaign step to enable prior-step targeting.
                              </div>
                            ) : (
                              <>
                                <Form.Select
                                  value={filters.onlyFromCampaignId}
                                  onChange={e => setFilters({ ...filters, onlyFromCampaignId: e.target.value })}
                                  className="shadow-sm"
                                >
                                  <option value="">-- All leads in this cadence's list --</option>
                                  {clientCampaigns.map((c, idx) => (
                                    <option key={c.id} value={c.id}>
                                      Step #{c.sequenceStepOrder ?? idx + 1}: {c.name} ({c.status})
                                    </option>
                                  ))}
                                </Form.Select>
                                <Form.Text className="text-muted d-block mt-1">
                                  <i className="bi bi-funnel me-1"></i>
                                  Only target leads that were frozen into a specific prior step of this cadence. Useful for follow-up campaigns that should only contact leads that went through the initial outreach.
                                </Form.Text>
                              </>
                            )}
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label className="fw-medium">Current Lead Status</Form.Label>
                            <Form.Select
                              value={filters.membershipStatus}
                              onChange={e => setFilters({ ...filters, membershipStatus: e.target.value })}
                              className="shadow-sm"
                            >
                              <option value="">-- Any Status --</option>
                              <option value="New">Pending (Never Contacted)</option>
                              <option value="Contacted">Contacted (In Progress)</option>
                              <option value="Qualified">Qualified</option>
                            </Form.Select>
                          </Form.Group>

                          <Form.Group className="mb-4 pt-2">
                            <Form.Check
                              type="switch"
                              id="exclude-closed-switch"
                              label="Exclude Closed Leads (Converted or Dead)"
                              checked={excludeClosed}
                              onChange={e => setExcludeClosed(e.target.checked)}
                              className="fw-medium text-dark"
                            />
                          </Form.Group>
                        </Col>

                        {/* RIGHT COLUMN: Firmographics */}
                        <Col md={6} className="ps-md-4">
                          <h6 className="fw-bold mb-3 text-secondary text-uppercase small tracking-wide">Firmographics</h6>

                          <Form.Group className="mb-3">
                            <Form.Label className="fw-medium">Industry</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="e.g. Manufacturing (Partial match)"
                              value={filters.industry}
                              onChange={e => setFilters({ ...filters, industry: e.target.value })}
                              className="shadow-sm"
                            />
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label className="fw-medium">Job Title</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="e.g. Director or VP (Partial match)"
                              value={filters.jobTitle}
                              onChange={e => setFilters({ ...filters, jobTitle: e.target.value })}
                              className="shadow-sm"
                            />
                          </Form.Group>

                          <Form.Group className="mb-4">
                            <Form.Label className="fw-medium">Source</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="e.g. LinkedIn or Inbound (Partial match)"
                              value={filters.source}
                              onChange={e => setFilters({ ...filters, source: e.target.value })}
                              className="shadow-sm"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* EMAIL CONFIGURATION (Full Width) */}
                      {campaign.type === "email" && (
                        <>
                          <hr className="my-4 text-muted" />
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold mb-0 text-secondary text-uppercase small tracking-wide">
                              <i className="bi bi-envelope-fill me-2"></i> Email Configuration
                            </h6>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="rounded-pill px-3 fw-semibold shadow-sm"
                              onClick={handleLoadDefaultTemplate}
                            >
                              <i className="bi bi-file-earmark-arrow-down me-1"></i> Import Template
                            </Button>
                          </div>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-medium">Subject Line</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={emailSettings.subjectLine}
                                  onChange={e => setEmailSettings({ ...emailSettings, subjectLine: e.target.value })}
                                  className="shadow-sm"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-medium">Sender Name</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={emailSettings.senderName}
                                  onChange={e => setEmailSettings({ ...emailSettings, senderName: e.target.value })}
                                  className="shadow-sm"
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Form.Group className="mb-3">
                            <Form.Label className="fw-medium d-flex justify-content-between">
                              <span>Email Body (HTML)</span>
                              <span className="text-muted small fw-normal">
                                Variables: <code>{`{{first_name}}`}</code>, <code>{`{{company}}`}</code>
                              </span>
                            </Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={6}
                              value={emailSettings.emailBodyHtml}
                              onChange={e => setEmailSettings({ ...emailSettings, emailBodyHtml: e.target.value })}
                              className="shadow-sm font-monospace"
                              style={{ fontSize: '0.9rem' }}
                            />
                          </Form.Group>

                          <Form.Group className="mb-4">
                            <Form.Label className="fw-medium">Banner Image (Optional)</Form.Label>
                            {bannerImageUrl && (
                              <div className="mb-3 p-2 border rounded bg-light d-inline-block">
                                <img src={bannerImageUrl} alt="Banner Preview" className="img-fluid rounded" style={{ maxHeight: '120px' }} />
                              </div>
                            )}
                            <Form.Control
                              type="file"
                              accept="image/png, image/jpeg"
                              onChange={handleBannerUpload}
                              disabled={uploadingBanner}
                              className="shadow-sm"
                            />
                            {uploadingBanner && <div className="small text-primary mt-2 fw-medium"><Spinner size="sm" animation="border" className="me-1" /> Uploading...</div>}
                          </Form.Group>
                        </>
                      )}

                      <div className="d-flex justify-content-end border-top pt-3 mt-2">
                        <Button variant="primary" size="lg" className="px-5 shadow-sm fw-bold" onClick={handleSaveDraft} disabled={isSaving || uploadingBanner}>
                          {isSaving ? <><Spinner size="sm" animation="border" className="me-2" /> Saving...</> : "Save Draft"}
                        </Button>
                      </div>
                    </Form>
                  )}
                </Card.Body>
              </Card>

              {/* AUDIENCE PREVIEW */}
              <Card className="border shadow-sm">
                <Card.Header className="bg-white border-bottom fw-bold p-3 d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-people-fill me-2 text-primary"></i> Audience Preview (Top 10)</span>
                  {loadingLeads && <Spinner size="sm" animation="border" variant="primary" />}
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="ps-4">Name</th>
                        <th>Company</th>
                        <th>Title</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewLeads.length > 0 ? previewLeads.map((lead, idx) => (
                        <tr key={lead.id || `preview-lead-${idx}`}>
                          <td className="ps-4 fw-medium text-dark">{lead.firstName} {lead.lastName}</td>
                          <td className="text-secondary">{lead.company}</td>
                          <td className="text-secondary">{lead.jobTitle}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="3" className="text-center text-muted py-5">No leads match the current filters.</td></tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* TEAM & DISPATCH TAB (Call Campaigns Only) */}
        {campaign.type === "call" && (
          <Tab eventKey="team" title="Executive Dispatch">
            {/* ── Assigned Executives ── */}
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-person-check me-2 text-success"></i>
                  Assigned Executives
                  {campaign.executives?.length > 0 && (
                    <Badge bg="success" className="ms-2 rounded-pill px-2" style={{ fontSize: "0.7rem" }}>
                      {campaign.executives.length}
                    </Badge>
                  )}
                </h6>
                {campaign.status === "draft" && !campaign.executives?.length && (
                  <span className="text-danger small fw-semibold">
                    <i className="bi bi-exclamation-circle me-1"></i>At least one required for approval
                  </span>
                )}
              </div>

              {campaign.executives && campaign.executives.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {campaign.executives.map(exec => (
                    <Card key={exec.id} className="border-0 shadow-sm rounded-4 overflow-hidden">
                      <div style={{ height: "3px", background: "linear-gradient(90deg,#198754,#20c997)" }} />
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-start justify-content-between gap-3">
                          <div className="d-flex align-items-start gap-3 flex-grow-1">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center fw-bolder text-white flex-shrink-0"
                              style={{ width: 44, height: 44, background: "linear-gradient(135deg,#198754,#20c997)", fontSize: "0.9rem" }}
                            >
                              {exec.firstName?.[0]}{exec.lastName?.[0]}
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <span className="fw-bold text-dark">{exec.firstName} {exec.lastName}</span>
                                <Badge bg="success" className="px-2 py-1 rounded-pill" style={{ fontSize: "0.65rem" }}>Assigned</Badge>
                              </div>
                              <div className="text-muted small mb-2">{exec.email}</div>
                              <ExecPerformanceMini execId={exec.id} />
                            </div>
                          </div>
                          <div className="d-flex gap-2 flex-shrink-0">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="rounded-pill px-3"
                              onClick={() => setViewingExec(exec)}
                            >
                              <i className="bi bi-bar-chart me-1"></i>Full Stats
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="rounded-pill px-3"
                              onClick={() => unassignExecutive(exec.id)}
                            >
                              <i className="bi bi-person-x me-1"></i>Unassign
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 rounded-4" style={{ background: "#f8f9fa", border: "2px dashed #dee2e6" }}>
                  <i className="bi bi-person-slash fs-2 d-block mb-2 text-muted opacity-40"></i>
                  <div className="text-muted small">No executives assigned yet.</div>
                  <div className="text-muted small">Assign from the pool below to enable campaign approval.</div>
                </div>
              )}
            </div>

            {/* ── Available Executives Pool ── */}
            {(() => {
              const available = allExecutives.filter(e => !campaign.executives?.find(ce => ce.id === e.id));
              if (available.length === 0) return null;
              return (
                <div>
                  <h6 className="fw-bold mb-3 text-dark">
                    <i className="bi bi-people me-2 text-secondary"></i>
                    Available Executives
                    <Badge bg="secondary" className="ms-2 rounded-pill px-2" style={{ fontSize: "0.7rem" }}>{available.length}</Badge>
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    {available.map(exec => (
                      <Card key={exec.id} className="border-0 shadow-sm rounded-4 overflow-hidden" style={{ opacity: exec.isActive ? 1 : 0.6 }}>
                        <div style={{ height: "3px", background: exec.isActive ? "linear-gradient(90deg,#0d6efd,#6610f2)" : "#adb5bd" }} />
                        <Card.Body className="p-3">
                          <div className="d-flex align-items-start justify-content-between gap-3">
                            <div className="d-flex align-items-start gap-3 flex-grow-1">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center fw-bolder text-white flex-shrink-0"
                                style={{
                                  width: 44, height: 44, fontSize: "0.9rem",
                                  background: exec.isActive
                                    ? "linear-gradient(135deg,#0d6efd,#6610f2)"
                                    : "#adb5bd"
                                }}
                              >
                                {exec.firstName?.[0]}{exec.lastName?.[0]}
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <span className="fw-bold text-dark">{exec.firstName} {exec.lastName}</span>
                                  {!exec.isActive && (
                                    <Badge bg="secondary" className="px-2 py-1 rounded-pill" style={{ fontSize: "0.65rem" }}>Inactive</Badge>
                                  )}
                                  {exec.openLeads > 0 && (
                                    <Badge bg="warning" text="dark" className="px-2 py-1 rounded-pill" style={{ fontSize: "0.65rem" }}>
                                      {exec.openLeads} open leads
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-muted small mb-2">{exec.email}</div>
                                <ExecPerformanceMini execId={exec.id} />
                              </div>
                            </div>
                            <div className="d-flex gap-2 flex-shrink-0">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="rounded-pill px-3"
                                onClick={() => setViewingExec(exec)}
                              >
                                <i className="bi bi-bar-chart me-1"></i>Full Stats
                              </Button>
                              <Button
                                variant="success"
                                size="sm"
                                className="rounded-pill px-3 fw-semibold"
                                onClick={() => assignExecutive(exec.id)}
                                disabled={!exec.isActive}
                              >
                                <i className="bi bi-person-plus me-1"></i>Assign
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Performance Drawer */}
            <ExecPerformanceDrawer executive={viewingExec} onClose={() => setViewingExec(null)} />


            {campaign.status !== "draft" && strandedLeads.length > 0 && (
              <Row className="mt-4">
                <Col md={12}>
                  <Card className="border border-warning">
                    <Card.Header className="bg-warning bg-opacity-10 fw-semibold p-3 text-warning-emphasis d-flex justify-content-between align-items-center">
                      <span>Stranded Leads ({strandedLeads.length})</span>
                    </Card.Header>
                    <Card.Body>
                      <p className="text-muted small mb-3">
                        These leads are currently unassigned, likely because their executive was removed. Reassign them to an active executive.
                      </p>

                      <div className="d-flex gap-3 mb-3">
                        <Form.Select
                          className="w-auto"
                          value={reassignTargetExecutive}
                          onChange={(e) => setReassignTargetExecutive(e.target.value)}
                        >
                          <option value="">-- Select Target Executive --</option>
                          {campaign.executives?.map(e => (
                            <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                          ))}
                        </Form.Select>
                        <Button
                          variant="primary"
                          disabled={!reassignTargetExecutive || selectedStrandedLeads.length === 0}
                          onClick={handleReassignLeads}
                        >
                          Reassign Selected ({selectedStrandedLeads.length})
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => setSelectedStrandedLeads(strandedLeads.map(l => l.leadId))}
                        >
                          Select All
                        </Button>
                      </div>

                      <Table responsive hover size="sm" className="mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th style={{ width: '40px' }}></th>
                            <th>Name</th>
                            <th>Company</th>
                            <th>Added At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {strandedLeads.map(lead => (
                            <tr key={lead.leadId}>
                              <td>
                                <Form.Check
                                  type="checkbox"
                                  checked={selectedStrandedLeads.includes(lead.leadId)}
                                  onChange={(e) =>
                                  {
                                    if (e.target.checked)
                                    {
                                      setSelectedStrandedLeads([...selectedStrandedLeads, lead.leadId]);
                                    } else
                                    {
                                      setSelectedStrandedLeads(selectedStrandedLeads.filter(id => id !== lead.leadId));
                                    }
                                  }}
                                />
                              </td>
                              <td className="align-middle fw-medium">{lead.firstName} {lead.lastName}</td>
                              <td className="align-middle">{lead.company}</td>
                              <td className="align-middle">{new Date(lead.addedAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Tab>
        )}

        {/* EMAIL DISPATCH & ANALYTICS (Email Campaigns Only) */}
        {campaign.type === "email" && (
          <Tab eventKey="email_dispatch" title="Dispatch & Analytics">
            {campaign.status === "draft" ? (
              <AlertMessage variant="warning" message="Approve the campaign first to freeze the audience and unlock the dispatch engine." />
            ) : (
              <Row>
                {emailDispatches.length === 0 && (
                  <Col md={12} className="mb-4">
                    <Card className="border text-center p-4 shadow-sm">
                      <h3 className="mb-3">Ready to Send?</h3>
                      <p className="text-muted mb-4">The audience is frozen at {campaign.audienceCount} leads. Dispatching will queue the emails for delivery.</p>
                      <div>
                        <Button variant="primary" size="lg" onClick={handleDispatchEmail} disabled={isDispatching}>
                          {isDispatching ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Dispatching...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-send-fill me-2"></i> Dispatch Email Campaign
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  </Col>
                )}

                {emailAnalytics && emailAnalytics.funnel && (
                  <Col md={12} className="mb-4">
                    <Card className="border shadow-sm">
                      <Card.Header className="bg-light fw-semibold p-3">Funnel Analytics</Card.Header>
                      <Card.Body>
                        <Row className="text-center g-3">
                          <Col sm={3}>
                            <div className="text-muted small text-uppercase">Audience / Processed</div>
                            <div className="fs-3 fw-bold">{emailAnalytics.funnel.audience}</div>
                          </Col>
                          <Col sm={3}>
                            <div className="text-muted small text-uppercase">Total Sent</div>
                            <div className="fs-3 fw-bold text-primary">{emailAnalytics.funnel.sent}</div>
                          </Col>
                          <Col sm={3}>
                            <div className="text-muted small text-uppercase">Total Opened</div>
                            <div className="fs-3 fw-bold text-info">{emailAnalytics.funnel.opened}</div>
                          </Col>
                          <Col sm={3}>
                            <div className="text-muted small text-uppercase">Link Clicks (Conversions)</div>
                            <div className="fs-3 fw-bold text-success">{emailAnalytics.funnel.converted}</div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                <Col md={12}>
                  <Card className="border">
                    <Card.Header className="bg-light fw-semibold p-3">Dispatch Job History</Card.Header>
                    <Card.Body className="p-0">
                      <Table responsive hover className="mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th>Job ID</th>
                            <th>Status</th>
                            <th>Processed</th>
                            <th>Sent</th>
                            <th>Failed</th>
                            <th>Started At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {emailDispatches.length > 0 ? emailDispatches.map(job => (
                            <tr key={job.id}>
                              <td className="align-middle fw-medium">{job.id.substring(0, 8)}...</td>
                              <td className="align-middle">
                                <Badge bg={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'danger' : 'warning text-dark'}>
                                  {job.status}
                                </Badge>
                              </td>
                              <td className="align-middle">{job.processed}</td>
                              <td className="align-middle text-primary fw-bold">{job.sent}</td>
                              <td className="align-middle text-danger">{job.failed}</td>
                              <td className="align-middle">{new Date(job.createdAt).toLocaleString()}</td>
                            </tr>
                          )) : (
                            <tr><td colSpan="6" className="text-center text-muted py-4">No dispatch jobs found.</td></tr>
                          )}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Tab>
        )}

        {/* CONVERSION INBOX (Call Campaigns Only) */}
        {campaign.type === "call" && campaign.status !== "draft" && (
          <Tab eventKey="conversions" title={`Pending Conversions (${pendingConversions.length})`}>
            <Card className="border">
              <Card.Header className="bg-light fw-semibold p-3">Conversion Review Inbox</Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Lead</th>
                      <th>Executive</th>
                      <th>Notes</th>
                      <th>Logged At</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingConversions.length > 0 ? pendingConversions.map((conv, idx) => {
                      const remarkId = conv.remarkId || conv.id;
                      const keyId = remarkId || `pending-conv-${idx}`;
                      const leadDisplayName = conv.leadName || `${conv.lead?.firstName || ''} ${conv.lead?.lastName || ''}`.trim() || "Unknown Lead";
                      const companyName = conv.company || conv.lead?.company || "";
                      const execDisplayName = conv.reportedBy || `${conv.executive?.firstName || ''} ${conv.executive?.lastName || ''}`.trim() || "Unknown Executive";
                      const dateVal = conv.reportedAt || conv.createdAt;
                      const formattedDate = dateVal ? new Date(dateVal).toLocaleDateString() : "N/A";

                      return (
                        <tr key={keyId}>
                          <td className="align-middle fw-medium">
                            {leadDisplayName}<br />
                            {companyName && <small className="text-muted">{companyName}</small>}
                          </td>
                          <td className="align-middle">{execDisplayName}</td>
                          <td className="align-middle">{conv.notes || "No notes"}</td>
                          <td className="align-middle">{formattedDate}</td>
                          <td className="align-middle text-end">
                            <Button variant="success" size="sm" className="me-2" onClick={() => reviewConversion(remarkId, true)}>
                              Confirm
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => reviewConversion(remarkId, false)}>
                              Reject
                            </Button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan="5" className="text-center text-muted py-4">No pending conversions to review.</td></tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>
        )}

      </Tabs>

      {/* DELETE DRAFT MODAL */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="text-danger fw-bold">Delete Draft Campaign</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p className="mb-0 fs-5">
            Are you sure you want to delete this draft campaign?
            <br /><br />
            <strong>This action cannot be undone.</strong>
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="px-4 fw-bold">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteDraft} disabled={isDeleting} className="px-4 fw-bold d-flex align-items-center">
            {isDeleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              "Yes, Delete Campaign"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </AppLayout>
  );
}