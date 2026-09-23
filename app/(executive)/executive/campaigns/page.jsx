"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
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
import { PaginationControl } from "@/components/ui/PaginationControl";

const STATUS_FILTERS = ["all", "active", "paused", "completed", "draft"];

export default function ExecutiveCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadCampaigns = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/call/my-campaigns");
      setCampaigns(res.data.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load your campaigns."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = `${c.name || ""} ${c.clientName || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [campaigns, statusFilter, search]);

  const paginatedList = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totals = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === "active").length,
    pendingLeads: campaigns.reduce((sum, c) => sum + (c.myPendingLeads || 0), 0)
  }), [campaigns]);

  if (loading) {
    return (
      <AppLayout role="executive">
        <PageHeader title="Campaigns" subtitle="Your assigned call campaigns." />
        <LoadingSpinner />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout role="executive">
        <PageHeader title="Campaigns" subtitle="Your assigned call campaigns." />
        <AlertMessage message={error} />
        <Button variant="primary" className="rounded-pill px-4" onClick={loadCampaigns}>
          Try Again
        </Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="executive">
      <PageHeader title="Campaigns" subtitle="Your assigned call campaigns." />

      <Row className="g-3 mb-4">
        <Col xs={6} md={4}>
          <Card className="border-0 shadow-sm rounded-4 text-center py-3">
            <div className="text-secondary small fw-bold text-uppercase mb-1">Total Assigned</div>
            <div className="fs-2 fw-bolder text-dark">{totals.total}</div>
          </Card>
        </Col>
        <Col xs={6} md={4}>
          <Card className="border-0 shadow-sm rounded-4 text-center py-3">
            <div className="text-secondary small fw-bold text-uppercase mb-1">Active Now</div>
            <div className="fs-2 fw-bolder text-success">{totals.active}</div>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm rounded-4 text-center py-3">
            <div className="text-secondary small fw-bold text-uppercase mb-1">Pending Leads</div>
            <div className="fs-2 fw-bolder text-primary">{totals.pendingLeads}</div>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Header className="bg-white border-bottom pt-3 pb-3 px-4">
          <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
            <div className="d-flex gap-2 flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? "primary" : "outline-secondary"}
                  className="rounded-pill px-3 text-capitalize"
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
            <Form.Control
              type="search"
              placeholder="Search by campaign or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: "260px" }}
              className="rounded-3"
            />
          </div>
        </Card.Header>
        <Card.Body className="p-4">
          {campaigns.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>
              <div className="fw-bold">You have no campaign assignments yet.</div>
              <div className="small">Your manager will assign you to a campaign when there's work ready.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-search fs-1 d-block mb-3 opacity-50"></i>
              <div className="fw-bold">No campaigns match your filters.</div>
              <Button variant="link" onClick={() => { setStatusFilter("all"); setSearch(""); }}>
                Clear filters
              </Button>
            </div>
          ) : (
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
                {paginatedList.map((camp) => {
                  const action = getCampaignQueueAction(camp.status);
                  return (
                    <tr key={camp.id} style={{ borderBottom: "1px solid #f8f9fa" }}>
                      <td className="fw-bold text-dark">{camp.name}</td>
                      <td className="text-muted fw-medium">{camp.clientName || "Unknown"}</td>
                      <td><CampaignStatusBadge status={camp.status} /></td>
                      <td>
                        <span className={`badge px-2 py-1 rounded ${camp.myPendingLeads > 0 ? "bg-primary" : "bg-secondary"}`}>
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
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
        <PaginationControl
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))}
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </AppLayout>
  );
}
