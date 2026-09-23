"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";
import { ToastNotification } from "@/components/ui/ToastNotification";

export default function ClientSequenceDetailPage({ params }) {
  const unwrappedParams = use(params);
  const sequenceId = unwrappedParams.id;

  const [sequence, setSequence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", variant: "danger" });

  useEffect(() => {
    let mounted = true;
    const fetchSequenceDetail = async () => {
      try {
        const res = await api.get(`/portal/sequences/${sequenceId}`);
        if (mounted) {
          setSequence(res.data.data);
          setError("");
        }
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Failed to load sequence details."));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSequenceDetail();
    return () => { mounted = false; };
  }, [sequenceId]);

  const downloadFile = async (format) => {
    try {
      setDownloading(true);
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const name = sequence?.name || "Sequence";
      const url = `/reports/sequences/${sequenceId}/${format}`;
      const res = await api.get(url, { responseType: 'blob' });
      
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${name.replace(/\s+/g, '_')}_Motion_Report.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setToast({ show: true, message: `Failed to download sequence ${format.toUpperCase()} report.`, variant: "danger" });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <AppLayout role="client"><LoadingSpinner /></AppLayout>;
  if (error || !sequence) return <AppLayout role="client"><AlertMessage message={error || "Sequence motion not found."} /></AppLayout>;

  const totals = sequence.totals || {};
  const billing = sequence.billing || {};
  const steps = sequence.steps || [];

  const getConversionsForStep = (stepOrder) => {
    if (Array.isArray(sequence.conversionsByStep)) {
      const match = sequence.conversionsByStep.find(c => c.stepOrder === stepOrder);
      return match ? match.conversions : 0;
    }
    if (sequence.conversionsByStep && typeof sequence.conversionsByStep === 'object') {
      const val = sequence.conversionsByStep[stepOrder];
      if (typeof val === 'number') return val;
      if (typeof val === 'object' && val !== null) return val.conversions || 0;
    }
    return 0;
  };

  return (
    <AppLayout role="client">
      {/* HEADER BAR */}
      <div className="mb-4">
        <Link href="/client/sequences" className="text-decoration-none text-muted small fw-semibold">
          <i className="bi bi-arrow-left me-1"></i> Back to Sequences
        </Link>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mt-2 gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h2 className="fw-bold text-dark m-0">{sequence.name}</h2>
              <Badge bg={billing.pricingModel === 'cost_per_lead' ? 'primary' : 'success'} className="px-3 py-2 text-uppercase">
                {billing.pricingModel ? billing.pricingModel.replace('_', ' ') : 'Unpriced'}
              </Badge>
            </div>
            <p className="text-muted small mt-1 mb-0">{sequence.description || "Multi-step outreach motion."}</p>
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
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm rounded-3 text-center">
            <Card.Body className="p-4">
              <div className="text-muted small text-uppercase fw-bold mb-1">Unique Prospects Reached</div>
              <div className="display-6 fw-bold text-primary">{totals.uniqueLeadsReached || 0}</div>
              <div className="text-muted small mt-1">Deduplicated across motion</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm rounded-3 text-center">
            <Card.Body className="p-4">
              <div className="text-muted small text-uppercase fw-bold mb-1">Total Conversions</div>
              <div className="display-6 fw-bold text-success">{totals.convertedLeads || totals.conversions || 0}</div>
              <div className="text-muted small mt-1">Confirmed conversions</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* STEP PIPELINE BREAKDOWN */}
      <Card className="border-0 shadow-sm rounded-3 mb-4">
        <Card.Header className="bg-white border-0 pt-4 px-4 pb-2 fw-bold">
          <i className="bi bi-diagram-3 text-primary me-2"></i> Sequence Step Pipeline
        </Card.Header>
        <Card.Body className="p-4 pt-0">
          {steps.length > 0 ? (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="text-center" style={{ width: '80px' }}>Step #</th>
                  <th>Step Name</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th className="text-end">Conversions Generated</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((st) => (
                  <tr key={st.stepOrder}>
                    <td className="text-center">
                      <Badge bg="dark" pill className="px-3 py-2 fs-6">{st.stepOrder}</Badge>
                    </td>
                    <td className="fw-bold text-dark">{st.name}</td>
                    <td>
                      <Badge bg={st.type === 'email' ? 'primary' : 'success'} className="px-2 py-1 text-uppercase">
                        <i className={`bi bi-${st.type === 'email' ? 'envelope' : 'telephone'} me-1`}></i>
                        {st.type}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={st.status === 'completed' ? 'success' : st.status === 'active' ? 'primary' : 'secondary'} className="text-uppercase">
                        {st.status}
                      </Badge>
                    </td>
                    <td className="text-end fw-bold text-success fs-6">
                      {getConversionsForStep(st.stepOrder)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center text-muted py-4">No active steps in this sequence motion.</div>
          )}
        </Card.Body>
      </Card>

      {/* BILLING & COMMERCIALS SECTION */}
      {billing && billing.pricingModel && (
        <Card className="border-0 shadow-sm rounded-3 mb-4">
          <Card.Header className="bg-white border-0 pt-4 px-4 pb-2 fw-bold d-flex justify-content-between align-items-center">
            <div>
              <i className="bi bi-receipt text-success me-2"></i> Billing & Commercials
            </div>
          </Card.Header>
          <Card.Body className="p-4 pt-0">
            <Row className="g-4 mt-1">
              <Col md={6}>
                <div className="p-4 border rounded-3 bg-light h-100 d-flex flex-column justify-content-center">
                  <div className="text-muted small text-uppercase fw-bold mb-1">Contract Rate / Retainer</div>
                  <div className="display-6 fw-bold text-dark">
                    {billing.pricingModel === 'cost_per_lead' ? `$${billing.ratePerLead || 0}` :
                     billing.pricingModel === 'flat_retainer' ? `$${billing.retainerAmount || 0}` : 'N/A'}
                  </div>
                  <div className="text-muted small mt-1">
                    {billing.pricingModel === 'cost_per_lead' ? "Per confirmed conversion" : "Fixed retainer amount"}
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="p-4 border rounded-3 bg-success bg-opacity-10 border-success border-opacity-25 h-100 d-flex flex-column justify-content-center">
                  <div className="text-success small text-uppercase fw-bold mb-1">Accrued Billing</div>
                  <div className="display-6 fw-bold text-success">
                    ${billing.pricingModel === 'cost_per_lead' ? (billing.amountAccrued || 0).toFixed(2) :
                      billing.pricingModel === 'flat_retainer' ? (billing.retainerAmount || 0).toFixed(2) : '0.00'}
                  </div>
                  <div className="text-success small mt-1 opacity-75">
                    {billing.pricingModel === 'cost_per_lead' ? 
                      `Based on ${billing.billableConversions ?? billing.confirmedConversions ?? 0} billable conversion(s)` : 
                      "Fixed amount billed per agreement"}
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <ToastNotification show={toast.show} onClose={() => setToast(t => ({ ...t, show: false }))} message={toast.message} variant={toast.variant} />
    </AppLayout>
  );
}
