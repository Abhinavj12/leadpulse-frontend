"use client";

import { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

export default function ClientBillingLedger() {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchBilling = async () => {
      try {
        const res = await api.get("/portal/billing");
        if (mounted) {
          setBilling(res.data.data);
          setError("");
        }
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Failed to load billing ledger."));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchBilling();
    return () => { mounted = false; };
  }, []);

  if (loading) return <AppLayout role="client"><LoadingSpinner /></AppLayout>;
  if (error || !billing) return <AppLayout role="client"><AlertMessage message={error || "Billing statement unavailable."} /></AppLayout>;

  const costPerLeadSubtotal = (billing.costPerLead || []).reduce((acc, curr) => acc + (curr.conversions * curr.rate), 0);
  const flatRetainerSubtotal = (billing.flatRetainer || []).reduce((acc, curr) => acc + curr.retainerAmount, 0);

  return (
    <AppLayout role="client">
      <PageHeader 
        title="Financial Billing Ledger" 
        subtitle="Transparent breakdown of accrued performance charges and contracted retainers." 
      />

      {/* SUMMARY CARDS */}
      <Row className="mb-4 g-4">
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm rounded-3">
            <Card.Body className="p-4 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small text-uppercase fw-bold mb-1">Cost-Per-Lead Accrued Subtotal</div>
                <div className="display-6 fw-bold text-primary">${costPerLeadSubtotal.toFixed(2)}</div>
                <div className="text-muted small mt-1">{(billing.costPerLead || []).length} Active Agreements</div>
              </div>
              <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-3 fs-2">
                <i className="bi bi-currency-dollar"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm rounded-3">
            <Card.Body className="p-4 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small text-uppercase fw-bold mb-1">Flat Retainer Subtotal</div>
                <div className="display-6 fw-bold text-success">${flatRetainerSubtotal.toFixed(2)}</div>
                <div className="text-muted small mt-1">{(billing.flatRetainer || []).length} Fixed Retainers</div>
              </div>
              <div className="bg-success bg-opacity-10 text-success rounded-circle p-3 fs-2">
                <i className="bi bi-wallet2"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* COST PER LEAD SECTION */}
      <Card className="border-0 shadow-sm rounded-3 mb-5">
        <Card.Header className="bg-white border-0 pt-4 px-4 pb-2 fw-bold d-flex justify-content-between align-items-center">
          <span className="fs-5 text-primary"><i className="bi bi-graph-up-arrow me-2"></i> Cost-Per-Lead Models</span>
          <Badge bg="primary" pill>{(billing.costPerLead || []).length} Items</Badge>
        </Card.Header>
        <Card.Body className="p-0">
          {billing.costPerLead && billing.costPerLead.length > 0 ? (
            <Table responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th>Item / Motion Name</th>
                  <th className="text-center">Billable Conversions</th>
                  <th className="text-center">Contracted Rate</th>
                  <th className="text-end fw-bold">Total Accrued</th>
                </tr>
              </thead>
              <tbody>
                {billing.costPerLead.map((item, idx) => (
                  <tr key={idx}>
                    <td className="fw-bold text-dark">
                      {item.name}
                    </td>
                    <td className="text-center fw-semibold">{item.conversions}</td>
                    <td className="text-center">${item.rate?.toFixed(2)} / lead</td>
                    <td className="text-end fw-bold text-primary">
                      ${(item.conversions * item.rate).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-light">
                <tr>
                  <td colSpan="3" className="text-end fw-bold">Cost-Per-Lead Subtotal:</td>
                  <td className="text-end fw-bold fs-5 text-primary">
                    ${costPerLeadSubtotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </Table>
          ) : (
            <div className="text-center text-muted py-4">No active cost-per-lead agreements found.</div>
          )}
        </Card.Body>
      </Card>

      {/* FLAT RETAINER SECTION */}
      <Card className="border-0 shadow-sm rounded-3 mb-4">
        <Card.Header className="bg-white border-0 pt-4 px-4 pb-2 fw-bold d-flex justify-content-between align-items-center">
          <span className="fs-5 text-success"><i className="bi bi-shield-check me-2"></i> Flat Retainer Models</span>
          <Badge bg="success" pill>{(billing.flatRetainer || []).length} Items</Badge>
        </Card.Header>
        <Card.Body className="p-0">
          {billing.flatRetainer && billing.flatRetainer.length > 0 ? (
            <Table responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th>Item / Motion Name</th>
                  <th className="text-center">Commitment Date</th>
                  <th className="text-end fw-bold">Retainer Amount</th>
                </tr>
              </thead>
              <tbody>
                {billing.flatRetainer.map((item, idx) => (
                  <tr key={idx}>
                    <td className="fw-bold text-dark">{item.name}</td>
                    <td className="text-center text-muted">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="text-end fw-bold text-success">
                      ${item.retainerAmount?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-light">
                <tr>
                  <td colSpan="2" className="text-end fw-bold">Flat Retainer Subtotal:</td>
                  <td className="text-end fw-bold fs-5 text-success">
                    ${flatRetainerSubtotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </Table>
          ) : (
            <div className="text-center text-muted py-4">No active flat retainer agreements found.</div>
          )}
        </Card.Body>
      </Card>

      <div className="text-center text-muted small mt-4">
        <i className="bi bi-info-circle me-1"></i> Note: Financial subtotals for performance-based (Cost-Per-Lead) and fixed retainer models are calculated separately to prevent blending distinct commercial structures.
      </div>
    </AppLayout>
  );
}
