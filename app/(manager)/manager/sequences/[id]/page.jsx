"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

export default function SequenceDetailPage() {
  const params = useParams();
  const sequenceId = params.id;
  
  const [rollup, setRollup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSequence = async () => {
      try {
        const res = await api.get(`/sequences/${sequenceId}`);
        setRollup(res.data.data);
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load sequence details."));
      } finally {
        setLoading(false);
      }
    };
    loadSequence();
  }, [sequenceId]);

  if (loading) {
    return <AppLayout role="manager"><LoadingSpinner /></AppLayout>;
  }

  if (error || !rollup) {
    return (
      <AppLayout role="manager">
        <AlertMessage message={error || "Sequence not found"} />
        <Link href="/manager/sequences" className="btn btn-outline-secondary mt-3">Back to Sequences</Link>
      </AppLayout>
    );
  }

  const seq = rollup.sequence;
  const metrics = rollup.metrics;
  const billing = rollup.billing;

  return (
    <AppLayout role="manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <PageHeader 
            title={seq.name} 
            subtitle={`Sequence for ${seq.client?.name || "Unknown"} (Targeting: ${seq.leadList?.name || "Unknown"})`} 
          />
        </div>
        <div className="d-flex gap-2">
          <Link href={`/manager/campaigns/create?sequenceId=${seq.id}&clientId=${seq.clientId}&leadListId=${seq.leadListId}`} className="btn btn-primary fw-medium shadow-sm rounded-pill px-4 d-flex align-items-center">
            <i className="bi bi-plus-lg me-2"></i> Add Step
          </Link>
          <a href={`${process.env.NEXT_PUBLIC_API_URL}/reports/sequences/${seq.id}/pdf`} className="btn btn-outline-secondary fw-medium shadow-sm rounded-pill px-4 d-flex align-items-center bg-white" target="_blank" rel="noopener noreferrer">
            <i className="bi bi-file-pdf me-2 text-danger"></i> Report
          </a>
        </div>
      </div>

      <Row className="mb-4 g-4">
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '12px', background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)' }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="text-secondary small fw-bold text-uppercase tracking-wide">Unique Leads</div>
                <div className="bg-primary bg-opacity-10 text-primary rounded d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                  <i className="bi bi-people-fill"></i>
                </div>
              </div>
              <div className="fs-1 fw-bolder text-dark">{metrics.uniqueLeadsReached}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '12px', background: 'linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)' }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="text-success small fw-bold text-uppercase tracking-wide">Conversions</div>
                <div className="bg-success bg-opacity-10 text-success rounded d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                  <i className="bi bi-bullseye"></i>
                </div>
              </div>
              <div className="fs-1 fw-bolder text-success">{metrics.totalConversions}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '12px', background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)' }}>
            <Card.Body className="p-4 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="text-secondary small fw-bold text-uppercase tracking-wide">Billing Ledger</div>
                <div className="bg-secondary bg-opacity-10 text-secondary rounded d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                  <i className="bi bi-receipt"></i>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-end mt-auto">
                <div>
                  <div className="fw-bolder text-dark mb-1">
                    {billing?.pricingModel === 'cost_per_lead' ? 'Cost Per Lead (CPL)' : billing?.pricingModel === 'flat_retainer' ? 'Flat Retainer' : 'Unpriced'}
                  </div>
                  <div className="text-muted small fw-medium">
                    {billing?.pricingModel === 'cost_per_lead' && `Rate: $${billing.ratePerLead}`}
                    {billing?.pricingModel === 'flat_retainer' && `Retainer Amount: $${billing.retainerAmount}`}
                    {billing?.pricingModel === 'unpriced' && `Internal Motion`}
                  </div>
                </div>
                <div className="text-end">
                  <div className="text-secondary small fw-bold mb-1">Total Accrued</div>
                  <div className="fs-2 fw-bolder text-dark">${billing?.amountAccrued?.toLocaleString() || "0"}</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Card.Header className="bg-white border-bottom py-3 d-flex align-items-center">
          <i className="bi bi-diagram-3 text-primary me-2 fs-5"></i>
          <span className="fw-bold text-dark fs-5">Sequence Steps</span>
        </Card.Header>
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0 align-middle">
            <thead className="bg-light text-muted">
              <tr>
                <th className="px-4 py-3 fw-semibold border-bottom-0 text-center" style={{ width: '80px' }}>Step</th>
                <th className="px-4 py-3 fw-semibold border-bottom-0">Campaign Name</th>
                <th className="px-4 py-3 fw-semibold border-bottom-0">Type</th>
                <th className="px-4 py-3 fw-semibold border-bottom-0">Status</th>
                <th className="px-4 py-3 fw-semibold border-bottom-0 text-center">Audience</th>
                <th className="px-4 py-3 fw-semibold border-bottom-0 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rollup.steps && rollup.steps.length > 0 ? (
                rollup.steps.map((step) => (
                  <tr key={step.id}>
                    <td className="px-4 py-3 text-center">
                      <div className="bg-light rounded d-inline-flex align-items-center justify-content-center fw-bold text-secondary shadow-sm" style={{ width: '32px', height: '32px' }}>
                        {step.sequenceStepOrder ?? "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 fw-bold">
                      <Link href={`/manager/campaigns/${step.id}`} className="text-decoration-none text-dark">
                        {step.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-capitalize fw-medium">
                      {step.type === 'email' ? <i className="bi bi-envelope text-primary me-2"></i> : <i className="bi bi-telephone text-success me-2"></i>}
                      {step.type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge bg-${step.status === 'active' ? 'success' : step.status === 'draft' ? 'secondary' : 'info'} bg-opacity-10 text-${step.status === 'active' ? 'success' : step.status === 'draft' ? 'secondary' : 'info'} px-3 py-2 rounded-pill fw-bold text-uppercase tracking-wide`} style={{ fontSize: '0.7rem' }}>
                        {step.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center fw-bold text-dark">{step.audienceCount || 0}</td>
                    <td className="px-4 py-3 text-end">
                      <Link href={`/manager/campaigns/${step.id}`} className="btn btn-light text-primary fw-bold btn-sm rounded-pill px-3 shadow-sm">
                        Manage <i className="bi bi-arrow-right ms-1"></i>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-5">
                    <i className="bi bi-list-task fs-1 d-block mb-3 opacity-25"></i>
                    No steps added to this sequence yet. Click "Add Step" to create one.
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
