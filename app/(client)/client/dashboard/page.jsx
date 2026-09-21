"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

export default function ClientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/portal/dashboard");
        if (mounted) {
          setData(res.data.data);
          setError("");
        }
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Failed to load dashboard data."));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDashboard();
    return () => { mounted = false; };
  }, []);

  if (loading) return <AppLayout role="client"><LoadingSpinner /></AppLayout>;
  if (error) return <AppLayout role="client"><AlertMessage message={error} /></AppLayout>;

  const totals = data?.totals || {};
  const monthlyVolume = data?.monthlyVolume || [];
  const clientName = data?.client?.name || "Your Account";

  return (
    <AppLayout role="client">
      <PageHeader 
        title={`${clientName} Dashboard`} 
        subtitle="Real-time aggregate performance metrics and outreach volume tracking." 
      />

      {/* TOP KPI STAT CARDS */}
      <Row className="mb-4 g-3 g-xl-4">
        <Col xl={3} sm={6}>
          <Card className="h-100 border-0 shadow-sm rounded-3">
            <Card.Body className="p-3 p-xl-4 text-center">
              <div className="text-muted small text-uppercase fw-bold mb-1">Prospects Reached</div>
              <div className="display-6 fw-bold text-primary">{totals.leadsTargeted || 0}</div>
              <div className="text-muted small mt-2">Deduplicated contacts</div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} sm={6}>
          <Card className="h-100 border-0 shadow-sm rounded-3">
            <Card.Body className="p-3 p-xl-4 text-center">
              <div className="text-muted small text-uppercase fw-bold mb-1">Qualified Leads</div>
              <div className="display-6 fw-bold text-info">{totals.qualifiedLeads || 0}</div>
              <div className="text-muted small mt-2">Identities unlocked</div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} sm={6}>
          <Card className="h-100 border-0 shadow-sm rounded-3 bg-success text-white">
            <Card.Body className="p-3 p-xl-4 text-center">
              <div className="small text-uppercase fw-bold mb-1 opacity-75">Secured Conversions</div>
              <div className="display-6 fw-bold">{totals.convertedLeads || 0}</div>
              <div className="small mt-2 opacity-75">Confirmed conversion events</div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} sm={6}>
          <Card className="h-100 border-0 shadow-sm rounded-3">
            <Card.Body className="p-3 p-xl-4 text-center">
              <div className="text-muted small text-uppercase fw-bold mb-1">Total Campaigns</div>
              <div className="display-6 fw-bold text-dark">{totals.campaigns || 0}</div>
              <div className="text-muted small mt-2">
                {totals.emailCampaigns || 0} Email · {totals.callCampaigns || 0} Call
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* OUTREACH ACTIVITY ROW */}
      <Row className="mb-4 g-4">
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm rounded-3">
            <Card.Header className="bg-white border-0 pt-4 px-4 pb-0 fw-bold d-flex align-items-center justify-content-between">
              <div>
                <i className="bi bi-envelope-paper text-primary me-2 fs-5"></i>
                Emailing Activity
              </div>
              <Badge bg="primary" pill>{totals.emailCampaigns || 0} Campaigns</Badge>
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="align-items-center text-center">
                <Col xs={6} className="border-end">
                  <div className="fs-2 fw-bold text-dark">{totals.emailsSent || 0}</div>
                  <div className="text-muted small text-uppercase fw-semibold">Emails Sent</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-2 fw-bold text-primary">{totals.emailCampaigns || 0}</div>
                  <div className="text-muted small text-uppercase fw-semibold">Active Campaigns</div>
                </Col>
              </Row>
              <div className="mt-4 pt-3 border-top text-center">
                <Link href="/client/campaigns">
                  <Button variant="outline-primary" size="sm" className="rounded-pill px-3">
                    View Email Campaigns <i className="bi bi-arrow-right ms-1"></i>
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm rounded-3">
            <Card.Header className="bg-white border-0 pt-4 px-4 pb-0 fw-bold d-flex align-items-center justify-content-between">
              <div>
                <i className="bi bi-telephone-outbound text-success me-2 fs-5"></i>
                Calling Activity
              </div>
              <Badge bg="success" pill>{totals.callCampaigns || 0} Campaigns</Badge>
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="align-items-center text-center">
                <Col xs={6} className="border-end">
                  <div className="fs-2 fw-bold text-dark">{totals.callsLogged || 0}</div>
                  <div className="text-muted small text-uppercase fw-semibold">Dials Logged</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-2 fw-bold text-success">{totals.callCampaigns || 0}</div>
                  <div className="text-muted small text-uppercase fw-semibold">Active Campaigns</div>
                </Col>
              </Row>
              <div className="mt-4 pt-3 border-top text-center">
                <Link href="/client/campaigns">
                  <Button variant="outline-success" size="sm" className="rounded-pill px-3">
                    View Call Campaigns <i className="bi bi-arrow-right ms-1"></i>
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* MONTHLY VOLUME CHART / BREAKDOWN (SRS §4.8.4) */}
      <Card className="border-0 shadow-sm rounded-3 mb-4">
        <Card.Header className="bg-white border-0 pt-4 px-4 pb-2 fw-bold d-flex align-items-center justify-content-between">
          <span><i className="bi bi-bar-chart-line text-primary me-2"></i> Monthly Volume Breakdown</span>
         
        </Card.Header>
        <Card.Body className="p-4 pt-0">
          {monthlyVolume.length > 0 ? (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th>Month</th>
                  <th className="text-center">Leads Targeted</th>
                  <th>Volume Distribution</th>
                </tr>
              </thead>
              <tbody>
                {monthlyVolume.map((item, idx) => {
                  const maxVal = Math.max(...monthlyVolume.map(v => v.leadsTargeted), 1);
                  const pct = Math.round((item.leadsTargeted / maxVal) * 100);
                  return (
                    <tr key={idx}>
                      <td className="fw-medium text-dark">{item.month}</td>
                      <td className="text-center fw-bold">{item.leadsTargeted}</td>
                      <td style={{ width: '50%' }}>
                        <div className="progress" style={{ height: '10px' }}>
                          <div 
                            className="progress-bar bg-primary" 
                            role="progressbar" 
                            style={{ width: `${pct}%` }}
                            aria-valuenow={pct} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          ) : (
            <div className="text-center text-muted py-4">
              No volume data recorded yet.
            </div>
          )}
        </Card.Body>
      </Card>

      {/* QUICK LINKS GRID */}
      <Row className="g-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-3 text-center h-100 p-3 hover-shadow">
            <Card.Body>
              <div className="fs-3 text-primary mb-2"><i className="bi bi-diagram-3"></i></div>
              <h6 className="fw-bold">Outreach Motions</h6>
              <p className="text-muted small">View multi-step cadences and contracted sequences.</p>
              <Link href="/client/sequences">
                <Button variant="light" size="sm" className="w-100 fw-medium">View Sequences</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-3 text-center h-100 p-3 hover-shadow">
            <Card.Body>
              <div className="fs-3 text-success mb-2"><i className="bi bi-people"></i></div>
              <h6 className="fw-bold">Funnel Leads CRM</h6>
              <p className="text-muted small">Monitor your lead funnel and unlock qualified identities.</p>
              <Link href="/client/leads">
                <Button variant="light" size="sm" className="w-100 fw-medium">Open CRM</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-3 text-center h-100 p-3 hover-shadow">
            <Card.Body>
              <div className="fs-3 text-danger mb-2"><i className="bi bi-file-earmark-bar-graph"></i></div>
              <h6 className="fw-bold">Reports & Deliverables</h6>
              <p className="text-muted small">Download PDF and Excel reports for all campaigns.</p>
              <Link href="/client/reports">
                <Button variant="light" size="sm" className="w-100 fw-medium">Download Reports</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </AppLayout>
  );
}
