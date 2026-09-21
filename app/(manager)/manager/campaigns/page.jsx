"use client";

import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  const loadCampaigns = async (clientFilter = "") => {
    try {
      setLoading(true);
      const url = clientFilter ? `/campaigns?clientId=${clientFilter}` : "/campaigns";
      const res = await api.get(url);
      setCampaigns(res.data.data);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load campaigns."));
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const res = await api.get("/clients");
      setClients(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadClients();
    loadCampaigns();
  }, []);

  const handleClientFilterChange = (e) => {
    const val = e.target.value;
    setSelectedClientId(val);
    loadCampaigns(val);
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

  return (
    <AppLayout role="manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bolder mb-1 text-dark tracking-tight">Campaigns</h3>
          <p className="text-secondary small mb-0">Manage individual outreach steps and standalone campaigns.</p>
        </div>
        <Link href="/manager/campaigns/create" className="btn btn-primary px-4 fw-medium shadow-sm rounded-pill d-flex align-items-center">
          <i className="bi bi-plus-lg me-2"></i> Create Campaign
        </Link>
      </div>

      {error && <AlertMessage message={error} />}

      <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Card.Header className="bg-white border-bottom py-3">
          <Form.Group className="mb-0 d-flex align-items-center">
            <i className="bi bi-filter text-primary me-2 fs-5"></i>
            <Form.Label className="fw-semibold mb-0 me-3 text-nowrap text-dark">Filter by Client:</Form.Label>
            <Form.Select 
              value={selectedClientId} 
              onChange={handleClientFilterChange}
              className="bg-light border-0 shadow-none fw-medium"
              style={{ maxWidth: "300px", borderRadius: '8px' }}
            >
              <option value="">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="p-5 d-flex justify-content-center">
              <LoadingSpinner />
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light text-muted">
                <tr>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Campaign Name</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Client</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Type</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Status</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0">Cadence Link</th>
                  <th className="px-4 py-3 fw-semibold border-bottom-0 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length > 0 ? (
                  campaigns.map((camp) => (
                    <tr key={camp.id}>
                      <td className="px-4 py-3 fw-bold">
                        <Link href={`/manager/campaigns/${camp.id}`} className="text-decoration-none text-dark">
                          {camp.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-secondary fw-medium">
                        {clients.find(c => c.id === camp.clientId)?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 align-middle text-capitalize fw-medium">
                        {camp.type === 'email' ? <i className="bi bi-envelope text-primary me-2"></i> : <i className="bi bi-telephone text-success me-2"></i>}
                        {camp.type}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className={`badge bg-${getStatusBadgeVariant(camp.status)} bg-opacity-10 text-${getStatusBadgeVariant(camp.status)} text-uppercase px-3 py-2 rounded-pill fw-bold tracking-wide`} style={{ fontSize: '0.7rem' }}>
                          {camp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {camp.sequenceId ? (
                          <Link href={`/manager/cadences/${camp.sequenceId}`} className="text-decoration-none fw-medium text-primary">
                            <i className="bi bi-diagram-3 me-1"></i> View Cadence
                          </Link>
                        ) : (
                          <span className="text-muted fw-medium"><span className="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1 rounded">Standalone</span></span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle text-end">
                        <Link href={`/manager/campaigns/${camp.id}`} className="btn btn-light text-primary fw-bold btn-sm rounded-pill px-3 shadow-sm">
                          Manage <i className="bi bi-arrow-right ms-1"></i>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-5">
                      <i className="bi bi-megaphone fs-1 d-block mb-3 opacity-25"></i>
                      No campaigns found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </AppLayout>
  );
}
