"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import CampaignStatusBadge from "@/components/executive/CampaignStatusBadge";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";
import { getCampaignQueueAction } from "@/lib/executive/campaignQueueAction";

export default function ExecutiveDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      try {
        const [metricsRes, campaignsRes] = await Promise.all([
          api.get("/call/my-metrics"),
          api.get("/call/my-campaigns")
        ]);
        if (mounted) {
          setMetrics(metricsRes.data.data);
          setCampaigns(campaignsRes.data.data);
          setError("");
        }
      } catch (err) {
        if (mounted) {
          setError(getApiErrorMessage(err, "Failed to load executive dashboard."));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadDashboard();
    return () => { mounted = false; };
  }, []);

  if (loading) return <AppLayout role="executive"><LoadingSpinner /></AppLayout>;
  if (error) return <AppLayout role="executive"><AlertMessage message={error} /></AppLayout>;

  return (
    <AppLayout role="executive">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <PageHeader title="Executive Dashboard" subtitle="Your daily metrics and assigned campaigns." />
        </div>
      </div>

      <Row className="mb-4 g-4">
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <Card.Body className="p-4 d-flex flex-column justify-content-center align-items-center position-relative overflow-hidden">
              <div className="position-absolute top-0 end-0 p-3 opacity-25">
                <i className="bi bi-telephone-outbound fs-1 text-primary"></i>
              </div>
              <div className="text-secondary small text-uppercase fw-bold tracking-wide mb-2 z-1">Calls Today</div>
              <div className="fs-1 fw-bolder text-primary z-1">{metrics?.callsMadeToday || 0}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <Card.Body className="p-4 d-flex flex-column justify-content-center align-items-center position-relative overflow-hidden">
              <div className="position-absolute top-0 end-0 p-3 opacity-25">
                <i className="bi bi-trophy fs-1 text-success"></i>
              </div>
              <div className="text-secondary small text-uppercase fw-bold tracking-wide mb-2 z-1">Conversions Today</div>
              <div className="fs-1 fw-bolder text-success z-1">{metrics?.conversionsClaimedToday || 0}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <Card.Body className="p-4 d-flex flex-column justify-content-center align-items-center position-relative overflow-hidden">
              <div className="position-absolute top-0 end-0 p-3 opacity-25">
                <i className="bi bi-people fs-1 text-info"></i>
              </div>
              <div className="text-secondary small text-uppercase fw-bold tracking-wide mb-2 z-1">Total Pending Leads</div>
              <div className="fs-1 fw-bolder text-dark z-1">{metrics?.totalPendingLeads || 0}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Link href="/executive/callbacks-due" className="text-decoration-none">
            <Card className={`h-100 border-0 shadow-sm ${metrics?.overdueCallbacks > 0 ? 'bg-danger bg-opacity-10' : ''}`} style={{ borderRadius: '12px' }}>
              <Card.Body className="p-4 d-flex flex-column justify-content-center align-items-center position-relative overflow-hidden">
                <div className="position-absolute top-0 end-0 p-3 opacity-25">
                  <i className={`bi bi-alarm fs-1 ${metrics?.overdueCallbacks > 0 ? 'text-danger' : 'text-secondary'}`}></i>
                </div>
                <div className={`small text-uppercase fw-bold tracking-wide mb-2 z-1 ${metrics?.overdueCallbacks > 0 ? 'text-danger' : 'text-secondary'}`}>
                  Overdue Callbacks
                </div>
                <div className={`fs-1 fw-bolder z-1 ${metrics?.overdueCallbacks > 0 ? 'text-danger' : 'text-dark'}`}>
                  {metrics?.overdueCallbacks || 0}
                </div>
              </Card.Body>
            </Card>
          </Link>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
        <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 px-4">
          <h5 className="fw-bold mb-0">My Campaigns</h5>
        </Card.Header>
        <Card.Body className="p-4">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light text-secondary small text-uppercase">
              <tr>
                <th className="border-0 rounded-start">Campaign Name</th>
                <th className="border-0">Client</th>
                <th className="border-0">Status</th>
                <th className="border-0">Pending Leads</th>
                <th className="border-0 rounded-end text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length > 0 ? campaigns.map(camp => {
                const action = getCampaignQueueAction(camp.status);
                return (
                  <tr key={camp.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                    <td className="fw-bold text-dark">
                      {camp.name}
                    </td>
                    <td className="text-muted fw-medium">{camp.clientName || camp.client?.name || "Unknown"}</td>
                    <td>
                      <CampaignStatusBadge status={camp.status} />
                    </td>
                    <td>
                      <span className={`badge px-2 py-1 rounded ${camp.myPendingLeads > 0 ? 'bg-primary' : 'bg-secondary'}`}>
                        {camp.myPendingLeads || 0} Leads
                      </span>
                    </td>
                    <td className="text-end">
                      {action.enabled ? (
                        <Link
                          href={`/executive/campaigns/${camp.id}`}
                          className={`btn btn-${action.variant} btn-sm rounded-pill px-3 shadow-sm fw-bold`}
                        >
                          {action.label} <i className={`bi ${action.icon} ms-1`}></i>
                        </Link>
                      ) : (
                        <OverlayTrigger placement="left" overlay={<Tooltip>{action.reason}</Tooltip>}>
                          <span className="d-inline-block">
                            <span
                              className={`btn btn-${action.variant} btn-sm rounded-pill px-3 fw-bold disabled`}
                              style={{ pointerEvents: "none", opacity: 0.65 }}
                            >
                              {action.label} <i className={`bi ${action.icon} ms-1`}></i>
                            </span>
                          </span>
                        </OverlayTrigger>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-5">
                    <i className="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>
                    You have no campaign assignments at the moment.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </AppLayout>
  );
}
