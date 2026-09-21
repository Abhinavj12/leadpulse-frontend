"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Badge from "react-bootstrap/Badge";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import CampaignStatusBadge from "@/components/executive/CampaignStatusBadge";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";
import { getCampaignQueueAction } from "@/lib/executive/campaignQueueAction";
import { isoDay, todayIso, formatDay } from "@/lib/executive/dateOnly";

export default function ExecutiveCampaignQueue() {
  const params = useParams();
  const campaignId = params.id;

  const [campaign, setCampaign] = useState(null);
  const [callbacks, setCallbacks] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [myCampsRes, callbacksRes, historyRes] = await Promise.all([
        api.get("/call/my-campaigns"),
        api.get(`/call/campaigns/${campaignId}/callbacks-due`),
        api.get(`/call/campaigns/${campaignId}/history`)
      ]);

      const found = myCampsRes.data.data.find(c => c.id === campaignId);
      if (!found) throw new Error("Campaign not found or not assigned to you.");

      setCampaign(found);
      setCallbacks(callbacksRes.data.data || []);
      setHistory(historyRes.data.data || []);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load campaign queue."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!mounted) return;
      await loadData();
    };
    run();
    return () => { mounted = false; };
  }, [campaignId]);

  const getOutcomeBadge = (outcome) => {
    const map = {
      "Converted": { bg: "success", label: "Converted" },
      "Not Interested": { bg: "danger", label: "Not Interested" },
      "Callback Requested": { bg: "warning", label: "Callback Scheduled" },
      "Not Answered": { bg: "secondary", label: "Not Answered" },
      "Busy": { bg: "secondary", label: "Busy" },
      "Left Voicemail": { bg: "secondary", label: "Left Voicemail" },
      "Wrong Number": { bg: "dark", label: "Wrong Number" },
      "Answered": { bg: "info", label: "Answered" },
    };
    const config = map[outcome] || { bg: "secondary", label: outcome || "Unknown" };
    return <Badge bg={config.bg} className="px-2 py-1 rounded-pill">{config.label}</Badge>;
  };

  if (loading) return <AppLayout role="executive"><LoadingSpinner /></AppLayout>;
  if (error && !campaign) return <AppLayout role="executive"><AlertMessage message={error} /></AppLayout>;

  const action = getCampaignQueueAction(campaign?.status);
  const today = todayIso();
  const decoratedCallbacks = callbacks.map(cb => {
    const day = isoDay(cb.followUpDate);
    return { ...cb, day, overdue: day < today };
  });
  const overdueCallbacks = decoratedCallbacks.filter(cb => cb.overdue);

  return (
    <AppLayout role="executive">
      {error && <AlertMessage message={error} />}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <nav aria-label="breadcrumb" className="mb-1">
            <ol className="breadcrumb mb-0 small">
              <li className="breadcrumb-item">
                <Link href="/executive/dashboard" className="text-decoration-none text-muted">Dashboard</Link>
              </li>
              <li className="breadcrumb-item active text-muted">{campaign?.name || "Campaign"}</li>
            </ol>
          </nav>
          <h2 className="fw-bolder mb-1">{campaign?.name}</h2>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted small fw-medium">
              <i className="bi bi-building me-1"></i>{campaign?.clientName}
            </span>
            {campaign && <CampaignStatusBadge status={campaign.status} />}
            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
              <i className="bi bi-telephone me-1"></i>
              {campaign?.myPendingLeads || 0} Leads Remaining
            </span>
          </div>
        </div>
        {action.canDial ? (
          <Link
            href={`/executive/campaigns/${campaignId}/dialer`}
            className={`btn btn-lg fw-bold rounded-pill px-5 shadow-sm btn-${action.variant}`}
          >
            <i className={`bi ${action.icon} me-2`}></i>
            {action.detailLabel}
          </Link>
        ) : (
          <OverlayTrigger placement="left" overlay={<Tooltip>{action.reason}</Tooltip>}>
            <span className="d-inline-block">
              <span
                className={`btn btn-lg fw-bold rounded-pill px-5 disabled btn-${action.variant}`}
                style={{ pointerEvents: "none" }}
              >
                <i className={`bi ${action.icon} me-2`}></i>
                {action.detailLabel}
              </span>
            </span>
          </OverlayTrigger>
        )}
      </div>

      {/* Stats bar */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 text-center py-3">
            <div className="text-secondary small fw-bold text-uppercase mb-1">Pending</div>
            <div className="fs-2 fw-bolder text-primary">{campaign?.myPendingLeads || 0}</div>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className={`border-0 shadow-sm rounded-4 text-center py-3 ${overdueCallbacks.length > 0 ? "bg-danger bg-opacity-10" : ""}`}>
            <div className={`small fw-bold text-uppercase mb-1 ${overdueCallbacks.length > 0 ? "text-danger" : "text-secondary"}`}>Overdue Callbacks</div>
            <div className={`fs-2 fw-bolder ${overdueCallbacks.length > 0 ? "text-danger" : "text-dark"}`}>{overdueCallbacks.length}</div>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 text-center py-3">
            <div className="text-secondary small fw-bold text-uppercase mb-1">Called So Far</div>
            <div className="fs-2 fw-bolder text-info">{history.length}</div>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 text-center py-3">
            <div className="text-secondary small fw-bold text-uppercase mb-1">Conversions</div>
            <div className="fs-2 fw-bolder text-success">
              {history.filter(h => h.previousRemarks?.some(r => r.callOutcome === "Converted")).length}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs defaultActiveKey={overdueCallbacks.length > 0 ? "callbacks" : "history"} className="mb-4">
        <Tab
          eventKey="callbacks"
          title={
            <span>
              <i className="bi bi-alarm me-1"></i>
              Callbacks Due
              {overdueCallbacks.length > 0 && (
                <span className="badge bg-danger ms-2 rounded-pill">{overdueCallbacks.length}</span>
              )}
              {callbacks.length > 0 && overdueCallbacks.length === 0 && (
                <span className="badge bg-warning text-dark ms-2 rounded-pill">{callbacks.length}</span>
              )}
            </span>
          }
        >
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
            {callbacks.length === 0 ? (
              <Card.Body className="text-center py-5 text-muted">
                <i className="bi bi-check-circle fs-1 d-block mb-3 text-success"></i>
                <div className="fw-bold">No callbacks due!</div>
                <div className="small">
                  {action.canDial ? "All caught up — go start dialing." : "All caught up."}
                </div>
              </Card.Body>
            ) : (
              <Table responsive hover className="mb-0 align-middle">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr className="text-secondary small text-uppercase">
                    <th className="border-0 ps-4">Lead</th>
                    <th className="border-0">Company</th>
                    <th className="border-0">Phone</th>
                    <th className="border-0">Follow-up Due</th>
                    <th className="border-0">Notes from Last Call</th>
                    <th className="border-0 pe-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {decoratedCallbacks.map(cb => (
                    <tr key={cb.campaignLeadId} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td className="ps-4">
                        <div className="fw-bold text-dark">{cb.leadName}</div>
                      </td>
                      <td className="text-muted fw-medium">{cb.company || "—"}</td>
                      <td>
                        <a href={`tel:${cb.phone}`} className="text-decoration-none text-dark fw-medium">
                          <i className="bi bi-telephone me-1 text-primary"></i>{cb.phone || "—"}
                        </a>
                      </td>
                      <td>
                        <div className={`fw-bold ${cb.overdue ? "text-danger" : "text-warning"}`}>
                          {formatDay(cb.day)}
                        </div>
                        {cb.overdue ? (
                          <span className="badge bg-danger rounded-pill small">OVERDUE</span>
                        ) : (
                          <span className="badge bg-warning text-dark rounded-pill small">DUE TODAY</span>
                        )}
                      </td>
                      <td className="text-muted small" style={{ maxWidth: "200px" }}>
                        <span className="text-truncate d-block">{cb.notes || "No notes"}</span>
                      </td>
                      <td className="pe-4 text-end">
                        {action.canDial ? (
                          <Link
                            href={`/executive/campaigns/${campaignId}/dialer?leadId=${cb.campaignLeadId}`}
                            className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold"
                          >
                            <i className="bi bi-telephone me-1"></i>Call Now
                          </Link>
                        ) : (
                          <OverlayTrigger placement="left" overlay={<Tooltip>{action.reason}</Tooltip>}>
                            <span className="d-inline-block">
                              <span
                                className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold disabled"
                                style={{ pointerEvents: "none" }}
                              >
                                <i className="bi bi-telephone me-1"></i>Call Now
                              </span>
                            </span>
                          </OverlayTrigger>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </Tab>

        <Tab
          eventKey="history"
          title={<span><i className="bi bi-clock-history me-1"></i>Recent Activity ({history.length})</span>}
        >
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
            {history.length === 0 ? (
              <Card.Body className="text-center py-5 text-muted">
                <i className="bi bi-telephone-x fs-1 d-block mb-3 opacity-40"></i>
                <div className="fw-bold">No calls logged yet</div>
                <div className="small">Start dialing to see your call history appear here.</div>
              </Card.Body>
            ) : (
              <Table responsive hover className="mb-0 align-middle">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr className="text-secondary small text-uppercase">
                    <th className="border-0 ps-4">Lead</th>
                    <th className="border-0">Company</th>
                    <th className="border-0">Last Outcome</th>
                    <th className="border-0">Attempts</th>
                    <th className="border-0">Last Called</th>
                    <th className="border-0 pe-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(lead => {
                    const latestRemark = lead.previousRemarks?.[0];
                    return (
                      <tr key={lead.campaignLeadId} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td className="ps-4">
                          <div className="fw-bold text-dark">{lead.firstName} {lead.lastName}</div>
                          <div className="small text-muted">{lead.jobTitle || ""}</div>
                        </td>
                        <td className="text-muted fw-medium">{lead.company || "—"}</td>
                        <td>
                          {latestRemark ? getOutcomeBadge(latestRemark.callOutcome) : <span className="text-muted small">—</span>}
                        </td>
                        <td>
                          <span className="badge bg-secondary rounded-pill px-2">{lead.previousRemarks?.length || 0} calls</span>
                        </td>
                        <td className="text-muted small">
                          {latestRemark ? new Date(latestRemark.createdAt).toLocaleString() : "—"}
                        </td>
                        <td className="pe-4 text-end">
                          <Link
                            href={`/executive/campaigns/${campaignId}/dialer?leadId=${lead.campaignLeadId}`}
                            className="btn btn-outline-primary btn-sm rounded-pill px-3"
                          >
                            {action.canDial ? "View & Call" : "View History"}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card>
        </Tab>
      </Tabs>
    </AppLayout>
  );
}
