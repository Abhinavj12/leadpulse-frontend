"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import ProgressBar from "react-bootstrap/ProgressBar";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import { ToastNotification } from "@/components/ui/ToastNotification";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

export default function ClientCampaignDetailPage({ params }) {
  const unwrappedParams = use(params);
  const campaignId = unwrappedParams.id;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", variant: "danger" });

  useEffect(() => {
    let mounted = true;
    const fetchCampaignDetail = async () => {
      try {
        const res = await api.get(`/reports/campaigns/${campaignId}`);
        if (mounted) {
          setReport(res.data.data);
          setError("");
        }
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Failed to load campaign analytics."));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCampaignDetail();
    return () => { mounted = false; };
  }, [campaignId]);

  const downloadFile = async (format) => {
    try {
      setDownloading(true);
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const name = report?.campaign?.name || "Campaign";
      const url = `/reports/campaigns/${campaignId}/${format}`;
      const res = await api.get(url, { responseType: 'blob' });
      
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${name.replace(/\s+/g, '_')}_Report.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setToast({ show: true, message: `Failed to download ${format.toUpperCase()} report.`, variant: "danger" });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <AppLayout role="client"><LoadingSpinner /></AppLayout>;
  if (error || !report) return <AppLayout role="client"><AlertMessage message={error || "Campaign not found."} /></AppLayout>;

  const campaign = report.summary || report.campaign || {};
  const metrics = report.metrics || {};
  const rates = metrics.rates || {};
  const isEmail = campaign.type?.toLowerCase() === 'email';

  const audienceCount = metrics.audienceSize ?? metrics.audience ?? campaign.audience ?? 0;
  const openRate = rates.openRate ?? metrics.openRate ?? 0;
  const ctr = rates.clickThroughRate ?? metrics.ctr ?? 0;
  const ctor = rates.clickToOpenRate ?? metrics.ctor ?? 0;
  const bounceRate = rates.bounceRate ?? metrics.bounceRate ?? 0;
  const unsubscribeRate = rates.unsubscribeRate ?? metrics.unsubscribeRate ?? 0;

  return (
    <AppLayout role="client">
      {/* HEADER BAR */}
      <div className="mb-4">
        <Link href="/client/campaigns" className="text-decoration-none text-muted small fw-semibold">
          <i className="bi bi-arrow-left me-1"></i> Back to Campaigns
        </Link>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mt-2 gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h2 className="fw-bold text-dark m-0">{campaign.name || "Campaign Analytics"}</h2>
              <Badge bg={isEmail ? 'primary' : 'success'} className="px-3 py-2 text-uppercase">
                <i className={`bi bi-${isEmail ? 'envelope' : 'telephone'} me-1`}></i>
                {campaign.type}
              </Badge>
              <Badge bg={
                campaign.status?.toLowerCase() === 'completed' ? 'success' :
                campaign.status?.toLowerCase() === 'active' ? 'primary' : 'secondary'
              } className="px-3 py-2 text-uppercase">
                {campaign.status}
              </Badge>
            </div>
            <p className="text-muted small mt-1 mb-0">
              Approved Date: {campaign.approvedAt ? new Date(campaign.approvedAt).toLocaleDateString() : 'N/A'}
              {campaign.sequence && (
                <span className="ms-3 badge bg-info text-dark">
                  Part of Sequence: {campaign.sequence.name}
                </span>
              )}
            </p>
          </div>

          <div className="d-flex gap-2">
            <Button 
              variant="outline-danger" 
              className="fw-medium rounded-pill px-3"
              onClick={() => downloadFile('pdf')}
              disabled={downloading}
            >
              <i className="bi bi-file-pdf me-2"></i> Download PDF
            </Button>
            <Button 
              variant="outline-success" 
              className="fw-medium rounded-pill px-3"
              onClick={() => downloadFile('excel')}
              disabled={downloading}
            >
              <i className="bi bi-file-excel me-2"></i> Export Excel
            </Button>
          </div>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <Row className="mb-4 g-4">
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm rounded-3 text-center">
            <Card.Body className="p-4">
              <div className="text-muted small text-uppercase fw-bold mb-1">Audience Size</div>
              <div className="display-6 fw-bold text-primary">{audienceCount}</div>
              <div className="text-muted small mt-1">Leads assigned to campaign</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm rounded-3 text-center">
            <Card.Body className="p-4">
              <div className="text-muted small text-uppercase fw-bold mb-1">
                {isEmail ? "Emails Dispatched" : "Calls Logged"}
              </div>
              <div className="display-6 fw-bold text-info">
                {isEmail ? (metrics.sent || 0) : (metrics.callsLogged ?? metrics.totalCalls ?? 0)}
              </div>
              <div className="text-muted small mt-1">Total activity count</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm rounded-3 text-center">
            <Card.Body className="p-4">
              <div className="text-muted small text-uppercase fw-bold mb-1">
                {isEmail ? "Emails Opened" : "Calls Answered"}
              </div>
              <div className="display-6 fw-bold text-warning">
                {isEmail ? (metrics.opened || 0) : (metrics.outcomes?.Answered ?? metrics.funnel?.reached ?? 0)}
              </div>
              <div className="text-muted small mt-1">
                {isEmail ? `Open Rate: ${openRate}%` : "Direct connections"}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm rounded-3 text-center bg-success text-white">
            <Card.Body className="p-4">
              <div className="small text-uppercase fw-bold mb-1 opacity-75">Secured Conversions</div>
              <div className="display-6 fw-bold">{metrics.converted ?? metrics.funnel?.converted ?? 0}</div>
              <div className="small mt-1 opacity-75">
                {isEmail ? "Final Conversions" : "Final Conversion Confirmed By Manager"}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* DETAILED CHANNEL ANALYTICS */}
      {isEmail ? (
        <Card className="border-0 shadow-sm rounded-3 mb-4">
          <Card.Header className="bg-white border-0 pt-4 px-4 pb-2 fw-bold">
            <i className="bi bi-bar-chart text-primary me-2"></i> Email Engagement Funnel & Rates
          </Card.Header>
          <Card.Body className="p-4 pt-0">
            <Row className="g-4 mb-4">
              <Col md={6}>
                <div className="p-3 bg-light rounded-3">
                  <div className="d-flex justify-content-between fw-bold mb-1">
                    <span>Delivered</span>
                    <span>{metrics.delivered || 0} / {metrics.sent || 0}</span>
                  </div>
                  <ProgressBar variant="primary" now={metrics.sent ? ((metrics.delivered || 0) / metrics.sent) * 100 : 0} />
                </div>
              </Col>
              <Col md={6}>
                <div className="p-3 bg-light rounded-3">
                  <div className="d-flex justify-content-between fw-bold mb-1">
                    <span>Unique Opens (Rate: {openRate}%)</span>
                    <span>{metrics.opened || 0}</span>
                  </div>
                  <ProgressBar variant="info" now={openRate} />
                </div>
              </Col>
              <Col md={6}>
                <div className="p-3 bg-light rounded-3">
                  <div className="d-flex justify-content-between fw-bold mb-1">
                    <span>Unique Clicks (CTR: {ctr}%)</span>
                    <span>{metrics.clicked || 0}</span>
                  </div>
                  <ProgressBar variant="warning" now={ctr} />
                </div>
              </Col>
              <Col md={6}>
                <div className="p-3 bg-light rounded-3">
                  <div className="d-flex justify-content-between fw-bold mb-1">
                    <span>Click-to-Open (CTOR: {ctor}%)</span>
                    <span>{ctor}%</span>
                  </div>
                  <ProgressBar variant="success" now={ctor} />
                </div>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <div className="d-flex justify-content-between align-items-center p-3 border rounded-3">
                  <span className="text-muted fw-medium"><i className="bi bi-exclamation-triangle text-danger me-2"></i> Bounced Emails</span>
                  <span className="fw-bold text-danger">{metrics.bounced || 0} ({bounceRate}%)</span>
                </div>
              </Col>
              <Col md={6}>
                <div className="d-flex justify-content-between align-items-center p-3 border rounded-3">
                  <span className="text-muted fw-medium"><i className="bi bi-dash-circle text-secondary me-2"></i> Unsubscribes</span>
                  <span className="fw-bold text-secondary">{metrics.unsubscribed || 0} ({unsubscribeRate}%)</span>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm rounded-3 mb-4">
          <Card.Header className="bg-white border-0 pt-4 px-4 pb-2 fw-bold">
            <i className="bi bi-telephone-outbound text-success me-2"></i> Call Outcome Breakdown
          </Card.Header>
          <Card.Body className="p-4 pt-0">
            <Row className="g-3">
              {metrics.outcomes ? Object.entries(metrics.outcomes).map(([outcome, count]) => (
                <Col md={4} key={outcome}>
                  <div className="p-3 border rounded-3 d-flex justify-content-between align-items-center">
                    <span className="fw-medium text-dark">{outcome}</span>
                    <Badge bg={
                      outcome === 'Converted' ? 'success' :
                      outcome === 'Answered' ? 'primary' :
                      outcome === 'Callback Requested' ? 'info text-dark' : 'secondary'
                    } className="fs-6 px-3 py-1">
                      {count}
                    </Badge>
                  </div>
                </Col>
              )) : (
                <div className="text-muted text-center py-4">No call outcome data recorded yet.</div>
              )}
            </Row>
          </Card.Body>
        </Card>
      )}
      <ToastNotification show={toast.show} onClose={() => setToast(t => ({ ...t, show: false }))} message={toast.message} variant={toast.variant} />
    </AppLayout>
  );
}
