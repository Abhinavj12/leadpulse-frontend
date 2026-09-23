"use client";

import { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import api from "@/lib/api/axios";
import { ToastNotification } from "@/components/ui/ToastNotification";
import { PaginationControl } from "@/components/ui/PaginationControl";

export default function ReportsPage() {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  
  const [sequences, setSequences] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", variant: "danger" });

  // Pagination states
  const [seqPage, setSeqPage] = useState(1);
  const [seqPageSize, setSeqPageSize] = useState(10);
  const [campPage, setCampPage] = useState(1);
  const [campPageSize, setCampPageSize] = useState(10);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const res = await api.get("/clients");
        setClients(res.data.data);
      } catch (err) {
        setError("Failed to load clients.");
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    setSeqPage(1);
    setCampPage(1);
    if (!selectedClientId) {
      setSequences([]);
      setCampaigns([]);
      return;
    }
    const loadClientData = async () => {
      try {
        const [seqRes, campRes] = await Promise.all([
          api.get(`/sequences?clientId=${selectedClientId}`),
          api.get(`/campaigns?clientId=${selectedClientId}`)
        ]);
        setSequences(seqRes.data.data);
        // Only show non-draft campaigns for reporting
        setCampaigns(campRes.data.data.filter(c => c.status !== 'draft'));
      } catch (err) {
        console.error(err);
      }
    };
    loadClientData();
  }, [selectedClientId]);

  // Sliced arrays and pagination calculations
  const seqTotalItems = sequences.length;
  const seqTotalPages = Math.ceil(seqTotalItems / seqPageSize) || 1;
  const paginatedSequences = sequences.slice((seqPage - 1) * seqPageSize, seqPage * seqPageSize);

  const campTotalItems = campaigns.length;
  const campTotalPages = Math.ceil(campTotalItems / campPageSize) || 1;
  const paginatedCampaigns = campaigns.slice((campPage - 1) * campPageSize, campPage * campPageSize);

  const downloadReport = async (url, filename) => {
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setToast({ show: true, message: "Failed to download report.", variant: "danger" });
    }
  };

  return (
    <AppLayout role="manager">
      <PageHeader title="Reports & Exports" subtitle="Download deliverables for your clients." />

      {error && <AlertMessage message={error} />}

      <Card className="border mb-4">
        <Card.Body>
          <Form.Group>
            <Form.Label className="fw-semibold">Select Client to view deliverables</Form.Label>
            <Form.Select 
              value={selectedClientId} 
              onChange={(e) => setSelectedClientId(e.target.value)}
              style={{ maxWidth: "400px" }}
            >
              <option value="">-- Choose a Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>

      {selectedClientId && (
        <>
          <Card className="border mb-4">
            <Card.Header className="bg-light fw-semibold p-3">Sequence Level Reports</Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Sequence Name</th>
                    <th>Pricing Model</th>
                    <th className="text-end">Downloads</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSequences.length > 0 ? paginatedSequences.map(seq => (
                    <tr key={seq.id}>
                      <td className="align-middle fw-medium">{seq.name}</td>
                      <td className="align-middle">{seq.pricingModel.replace('_', ' ')}</td>
                      <td className="align-middle text-end">
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          className="me-2"
                          onClick={() => downloadReport(`/reports/sequences/${seq.id}/pdf`, `Sequence_Report_${seq.name.replace(/\s+/g, '_')}.pdf`)}
                        >
                          <i className="bi bi-file-pdf me-1"></i> PDF
                        </Button>
                        <Button 
                          variant="outline-success" 
                          size="sm" 
                          onClick={() => downloadReport(`/reports/sequences/${seq.id}/excel`, `Sequence_Report_${seq.name.replace(/\s+/g, '_')}.xlsx`)}
                        >
                          <i className="bi bi-file-excel me-1"></i> Excel
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" className="text-center text-muted py-4">No sequences found for this client.</td></tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
            <PaginationControl
              currentPage={seqPage}
              totalPages={seqTotalPages}
              totalItems={seqTotalItems}
              pageSize={seqPageSize}
              onPageChange={setSeqPage}
              onPageSizeChange={(size) => {
                setSeqPageSize(size);
                setSeqPage(1);
              }}
              itemName="sequence reports"
            />
          </Card>

          <Card className="border">
            <Card.Header className="bg-light fw-semibold p-3">Campaign Level Reports</Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Campaign Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th className="text-end">Downloads</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCampaigns.length > 0 ? paginatedCampaigns.map(camp => (
                    <tr key={camp.id}>
                      <td className="align-middle fw-medium">{camp.name}</td>
                      <td className="align-middle text-capitalize">{camp.type}</td>
                      <td className="align-middle text-uppercase small">{camp.status}</td>
                      <td className="align-middle text-end">
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          className="me-2"
                          onClick={() => downloadReport(`/reports/campaigns/${camp.id}/pdf`, `Campaign_Report_${camp.name.replace(/\s+/g, '_')}.pdf`)}
                        >
                          <i className="bi bi-file-pdf me-1"></i> PDF
                        </Button>
                        <Button 
                          variant="outline-success" 
                          size="sm" 
                          onClick={() => downloadReport(`/reports/campaigns/${camp.id}/excel`, `Campaign_Leads_${camp.name.replace(/\s+/g, '_')}.xlsx`)}
                        >
                          <i className="bi bi-file-excel me-1"></i> Excel
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="text-center text-muted py-4">No active/completed campaigns found.</td></tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
            <PaginationControl
              currentPage={campPage}
              totalPages={campTotalPages}
              totalItems={campTotalItems}
              pageSize={campPageSize}
              onPageChange={setCampPage}
              onPageSizeChange={(size) => {
                setCampPageSize(size);
                setCampPage(1);
              }}
              itemName="campaign reports"
            />
          </Card>
        </>
      )}

      <ToastNotification show={toast.show} onClose={() => setToast(t => ({ ...t, show: false }))} message={toast.message} variant={toast.variant} />
    </AppLayout>
  );
}
