"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import ProgressBar from "react-bootstrap/ProgressBar";
import Row from "react-bootstrap/Row";
import Table from "react-bootstrap/Table";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import AlertMessage from "@/components/ui/AlertMessage";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

export default function ManagerDashboardPage() {
  const [data, setData] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const url = selectedClientId
          ? `/reports/agency-dashboard?clientId=${selectedClientId}`
          : "/reports/agency-dashboard";
        const response = await api.get(url);
        if (mounted) setData(response.data.data);
      } catch (requestError) {
        if (mounted) setError(getApiErrorMessage(requestError, "Unable to load dashboard metrics."));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [selectedClientId]);

  const renderStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge bg="success">Active</Badge>;
      case "completed":
        return <Badge bg="primary">Completed</Badge>;
      case "paused":
        return <Badge bg="warning" text="dark">Paused</Badge>;
      case "completed_with_errors":
        return <Badge bg="warning" text="dark">With Errors</Badge>;
      case "failed":
        return <Badge bg="danger">Failed</Badge>;
      case "processing":
      case "queued":
        return <Badge bg="info" text="dark">Processing</Badge>;
      default:
        return <Badge bg="secondary">{status || "Draft"}</Badge>;
    }
  };

  return (
    <AppLayout role="manager">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <PageHeader title="Agency Dashboard" subtitle="Campaign Manager workspace operations & analytics." />
        {data?.clients?.length > 0 && (
          <div style={{ minWidth: "220px" }}>
            <Form.Select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="shadow-sm border-secondary-subtle fw-medium"
            >
              <option value="">All Clients</option>
              {data.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Form.Select>
          </div>
        )}
      </div>

      {error && <AlertMessage message={error} />}

      {loading ? (
        <LoadingSpinner />
      ) : data ? (
        <>
          {/* 6 KPI Cards Grid */}
          <Row className="g-3 mb-4">
            <Col xs={12} sm={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm rounded-3">
                <Card.Body className="p-3 d-flex align-items-center">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "52px", height: "52px" }}>
                    <i className="bi bi-folder2-open fs-3"></i>
                  </div>
                  <div>
                    <div className="text-uppercase text-muted small fw-bold tracking-wide">Total Campaigns</div>
                    <div className="fs-3 fw-bolder text-dark">{data.totalCampaigns ?? 0}</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm rounded-3">
                <Card.Body className="p-3 d-flex align-items-center">
                  <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "52px", height: "52px" }}>
                    <i className="bi bi-megaphone fs-3"></i>
                  </div>
                  <div>
                    <div className="text-uppercase text-muted small fw-bold tracking-wide">Active Campaigns</div>
                    <div className="fs-3 fw-bolder text-dark">{data.activeCampaigns ?? 0}</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm rounded-3">
                <Card.Body className="p-3 d-flex align-items-center">
                  <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "52px", height: "52px" }}>
                    <i className="bi bi-people fs-3"></i>
                  </div>
                  <div>
                    <div className="text-uppercase text-muted small fw-bold tracking-wide">Leads Contacted</div>
                    <div className="fs-3 fw-bolder text-dark">{data.totalLeadsContacted ?? 0}</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm rounded-3">
                <Card.Body className="p-3 d-flex align-items-center">
                  <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "52px", height: "52px" }}>
                    <i className="bi bi-envelope-paper-heart fs-3"></i>
                  </div>
                  <div>
                    <div className="text-uppercase text-muted small fw-bold tracking-wide">Avg Email Open Rate</div>
                    <div className="fs-3 fw-bolder text-dark">{data.avgEmailOpenRate ?? 0}%</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm rounded-3">
                <Card.Body className="p-3 d-flex align-items-center">
                  <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "52px", height: "52px" }}>
                    <i className="bi bi-telephone-outbound fs-3"></i>
                  </div>
                  <div>
                    <div className="text-uppercase text-muted small fw-bold tracking-wide">Calls Logged</div>
                    <div className="fs-3 fw-bolder text-dark">{data.totalCallsLogged ?? 0}</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm rounded-3">
                <Card.Body className="p-3 d-flex align-items-center">
                  <div className="bg-dark bg-opacity-10 text-dark rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "52px", height: "52px" }}>
                    <i className="bi bi-currency-dollar fs-3"></i>
                  </div>
                  <div>
                    <div className="text-uppercase text-muted small fw-bold tracking-wide">Est. Monthly Revenue</div>
                    <div className="fs-3 fw-bolder text-dark">
                      ${(data.estimatedMonthlyRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Campaigns Table & Recent Lead Imports */}
          <Row className="g-4 mb-4">
            <Col xs={12}>
              <Card className="border-0 shadow-sm rounded-3 h-100">
                <Card.Header className="bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-bar-chart-line text-primary me-2 fs-5"></i>
                    <h6 className="mb-0 fw-bold">Recent Campaigns</h6>
                  </div>
                  <Link href="/manager/campaigns" className="small text-decoration-none fw-semibold">
                    View All <i className="bi bi-arrow-right"></i>
                  </Link>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table hover responsive className="mb-0 align-middle">
                    <thead className="bg-light text-muted">
                      <tr>
                        <th className="px-3 py-2 border-bottom-0 small">Name</th>
                        <th className="px-3 py-2 border-bottom-0 small">Client</th>
                        <th className="px-3 py-2 border-bottom-0 small text-center">Type</th>
                        <th className="px-3 py-2 border-bottom-0 small text-center">Target Leads</th>
                        <th className="px-3 py-2 border-bottom-0 small text-end">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentCampaigns?.length > 0 ? (
                        data.recentCampaigns.map((cmp) => (
                          <tr key={cmp.id}>
                             <td className="px-3 py-2">
                               <Link href={`/manager/campaigns/${cmp.id}`} className="fw-medium text-dark text-decoration-none">
                                 {cmp.name}
                               </Link>
                             </td>
                             <td className="px-3 py-2 text-muted small">{cmp.clientName}</td>
                             <td className="px-3 py-2 text-center">
                               <Badge bg={cmp.type === "email" ? "info" : "secondary"} text={cmp.type === "email" ? "dark" : undefined}>
                                 {cmp.type === "email" ? "Email" : "Call"}
                               </Badge>
                             </td>
                             <td className="px-3 py-2 text-center fw-medium">{cmp.audienceCount}</td>
                             <td className="px-3 py-2 text-end">{renderStatusBadge(cmp.status)}</td>
                           </tr>
                         ))
                       ) : (
                         <tr>
                           <td colSpan="5" className="text-center text-muted py-4 small">
                             No recent campaigns found.
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </Table>
                 </Card.Body>
               </Card>
             </Col>
 
             <Col xs={12}>
               <Card className="border-0 shadow-sm rounded-3 h-100">
                 <Card.Header className="bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
                   <div className="d-flex align-items-center">
                     <i className="bi bi-cloud-arrow-up text-primary me-2 fs-5"></i>
                     <h6 className="mb-0 fw-bold">Recent Lead Imports</h6>
                   </div>
                   <Link href="/manager/lead-lists" className="small text-decoration-none fw-semibold">
                     Manage Lists <i className="bi bi-arrow-right"></i>
                   </Link>
                 </Card.Header>
                 <Card.Body className="p-0">
                   <Table hover responsive className="mb-0 align-middle">
                     <thead className="bg-light text-muted">
                       <tr>
                         <th className="px-3 py-2 border-bottom-0 small">Filename</th>
                         <th className="px-3 py-2 border-bottom-0 small text-center">Progress</th>
                         <th className="px-3 py-2 border-bottom-0 small text-end">Status</th>
                       </tr>
                     </thead>
                     <tbody>
                       {data.recentImports?.length > 0 ? (
                         data.recentImports.map((job) => (
                           <tr key={job.id}>
                             <td className="px-3 py-2">
                               <div className="fw-medium text-dark text-truncate" style={{ maxWidth: "160px" }} title={job.originalFilename}>
                                 {job.originalFilename}
                               </div>
                               <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                                 {job.clientName}
                               </div>
                             </td>
                             <td className="px-3 py-2 text-center" style={{ width: "120px" }}>
                               <div className="small fw-semibold mb-1">{job.progressPercentage}%</div>
                               <ProgressBar
                                 now={job.progressPercentage}
                                 variant={job.status === "failed" ? "danger" : "success"}
                                 style={{ height: "5px" }}
                               />
                             </td>
                             <td className="px-3 py-2 text-end">{renderStatusBadge(job.status)}</td>
                           </tr>
                         ))
                       ) : (
                         <tr>
                           <td colSpan="3" className="text-center text-muted py-4 small">
                             No recent lead imports.
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </Table>
                 </Card.Body>
               </Card>
             </Col>
           </Row>
        </>
      ) : null}
    </AppLayout>
  );
}
