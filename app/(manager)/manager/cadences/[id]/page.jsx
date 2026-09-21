"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";

import AppLayout from "@/components/layout/AppLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

export default function CadenceDetailsPage({ params }) {
  const unwrappedParams = use(params);
  const cadenceId = unwrappedParams.id;
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCadence = async () => {
      try {
        const res = await api.get(`/sequences/${cadenceId}`);
        setData(res.data.data);
        setError("");
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load cadence details."));
      } finally {
        setLoading(false);
      }
    };
    loadCadence();
  }, [cadenceId]);

  const formatCurrency = (amount) => {
    if (amount == null) return "—";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "draft": return "secondary";
      case "active": return "success";
      case "paused": return "warning";
      case "completed": return "info";
      default: return "secondary";
    }
  };

  if (loading) {
    return (
      <AppLayout role="manager">
        <div className="p-5 d-flex justify-content-center"><LoadingSpinner /></div>
      </AppLayout>
    );
  }

  if (error && !data) {
    return (
      <AppLayout role="manager">
        <AlertMessage message={error} />
        <Button variant="outline-primary" onClick={() => router.back()}>Go Back</Button>
      </AppLayout>
    );
  }

  const { sequence, steps, totals, billing } = data;

  return (
    <AppLayout role="manager">
      <div className="mb-3">
        <Link href="/manager/cadences" className="text-decoration-none text-secondary small fw-bold">
          <i className="bi bi-arrow-left me-1"></i> Back to Cadences
        </Link>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bolder mb-1 text-dark tracking-tight d-flex align-items-center">
            {sequence.name}
          </h3>
          <p className="text-secondary mb-0">{sequence.description || "No description provided."}</p>
        </div>
        <Link 
          href={`/manager/campaigns/create?sequenceId=${sequence.id}&clientId=${sequence.clientId}&leadListId=${sequence.leadListId}`} 
          className="btn btn-primary px-4 fw-medium shadow-sm rounded-pill d-flex align-items-center"
        >
          <i className="bi bi-plus-lg me-2"></i> Add Campaign Step
        </Link>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <Card className="border-0 shadow-sm h-100 rounded-4">
            <Card.Body className="p-4 d-flex flex-column justify-content-center align-items-center text-center">
              <div className="text-secondary fw-bold text-uppercase small mb-2">Unique Leads Reached</div>
              <h2 className="mb-0 fw-bold text-dark display-6">{totals.uniqueLeadsReached}</h2>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="border-0 shadow-sm h-100 rounded-4">
            <Card.Body className="p-4 d-flex flex-column justify-content-center align-items-center text-center">
              <div className="text-secondary fw-bold text-uppercase small mb-2">Engagements</div>
              <div className="d-flex gap-4">
                <div>
                  <h4 className="mb-0 fw-bold text-primary">{totals.emailsSent}</h4>
                  <div className="small text-muted fw-medium">Emails</div>
                </div>
                <div>
                  <h4 className="mb-0 fw-bold text-success">{totals.callsLogged}</h4>
                  <div className="small text-muted fw-medium">Calls</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="border-0 shadow-sm h-100 rounded-4">
            <Card.Body className="p-4 d-flex flex-column justify-content-center align-items-center text-center">
              <div className="text-secondary fw-bold text-uppercase small mb-2">Billable Conversions</div>
              <h2 className="mb-0 fw-bold text-success display-6">{totals.convertedLeads}</h2>
              <div className="small text-muted mt-1">Deduplicated per lead</div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="border-0 shadow-sm h-100 rounded-4" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)' }}>
            <Card.Body className="p-4 d-flex flex-column justify-content-center align-items-center text-center">
              <div className="text-primary fw-bold text-uppercase small mb-2">Accrued Billing</div>
              <h2 className="mb-0 fw-bold text-primary display-6">{formatCurrency(billing?.accruedAmount)}</h2>
              <div className="small text-muted fw-medium mt-1">
                {billing?.pricingModel === 'cost_per_lead' 
                  ? `Cost Per Lead (${formatCurrency(billing?.ratePerLead)})`
                  : billing?.pricingModel === 'flat_retainer'
                    ? `Flat Retainer (${formatCurrency(billing?.retainerAmount)})`
                    : 'Unpriced'}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Header className="bg-white border-bottom py-3">
          <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-layer-forward me-2 text-primary"></i>Campaign Steps</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {steps.length > 0 ? (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light text-muted">
                <tr>
                  <th className="px-4 py-3 fw-semibold border-bottom-0" style={{width: '80px'}}>Step</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Campaign Name</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Type</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Status</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step) => (
                  <tr key={step.id}>
                    <td className="px-4 py-3 fw-bold text-muted">
                      #{step.stepOrder || '?'}
                    </td>
                    <td className="px-4 py-3 fw-bold">
                      <Link href={`/manager/campaigns/${step.id}`} className="text-decoration-none text-dark hover-text-primary">
                        {step.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-capitalize fw-medium">
                      {step.type === 'email' ? <i className="bi bi-envelope text-primary me-2"></i> : <i className="bi bi-telephone text-success me-2"></i>}
                      {step.type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge bg-${getStatusBadgeVariant(step.status)} bg-opacity-10 text-${getStatusBadgeVariant(step.status)} text-uppercase px-3 py-2 rounded-pill fw-bold tracking-wide`} style={{ fontSize: '0.7rem' }}>
                        {step.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Link href={`/manager/campaigns/${step.id}`} className="btn btn-light text-primary fw-bold btn-sm rounded-pill px-3 shadow-sm">
                        Manage <i className="bi bi-arrow-right ms-1"></i>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center text-muted py-5">
              <i className="bi bi-diagram-3 fs-1 d-block mb-3 opacity-25"></i>
              No campaigns have been added to this cadence yet.
            </div>
          )}
        </Card.Body>
      </Card>
    </AppLayout>
  );
}
