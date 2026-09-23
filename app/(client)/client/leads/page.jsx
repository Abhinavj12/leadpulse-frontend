"use client";

import { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ProgressBar from "react-bootstrap/ProgressBar";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertMessage from "@/components/ui/AlertMessage";
import { PaginationControl } from "@/components/ui/PaginationControl";
import api from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/auth/auth";

export default function ClientLeadsCRM() {
  const [activeTab, setActiveTab] = useState("Insights"); // "Insights", "Qualified", "Converted"

  // States for Stats
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsData, setStatsData] = useState({ industryStats: [], totalTargeted: 0 });
  const [statsError, setStatsError] = useState("");

  // States for Leads
  const [leads, setLeads] = useState([]);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (activeTab === "Insights") {
      fetchStats();
    } else {
      fetchLeads(1, pageSize, activeTab);
    }
  }, [activeTab, pageSize]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/portal/leads/stats');
      setStatsData(res.data.data || { industryStats: [], totalTargeted: 0 });
      setStatsError("");
    } catch (err) {
      setStatsError(getApiErrorMessage(err, "Failed to load audience insights."));
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchLeads = async (page = 1, currentSize = pageSize, status) => {
    try {
      setLoading(true);
      let url = `/portal/leads?page=${page}&pageSize=${currentSize}&status=${status}`;

      const res = await api.get(url);
      setLeads(res.data.data?.leads || []);
      setPagination(res.data.data?.pagination || { page: 1, pageSize: currentSize, total: 0, totalPages: 1 });
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load leads."));
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    fetchLeads(newPage, pageSize, activeTab);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
  };

  const filteredLeads = leads.filter(l => {
    if (!search) return true;
    const term = search.toLowerCase();
    const company = (l.company || "").toLowerCase();
    const title = (l.jobTitle || "").toLowerCase();
    const industry = (l.industry || "").toLowerCase();
    const name = l.firstName !== 'Hidden' ? `${l.firstName} ${l.lastName}`.toLowerCase() : '';
    return company.includes(term) || title.includes(term) || industry.includes(term) || name.includes(term);
  });

  return (
    <AppLayout role="client">
      <PageHeader 
        title="Prospects & Conversions" 
        subtitle="Audience insights and unlocked qualified leads." 
      />

      <Card className="border-0 shadow-sm rounded-3 mb-4">
        <Card.Body className="p-3 d-flex justify-content-between align-items-center">
          <Nav variant="pills" activeKey={activeTab} onSelect={(selectedKey) => setActiveTab(selectedKey)}>
            <Nav.Item>
              <Nav.Link eventKey="Insights" className="rounded-pill px-4 py-2 fw-bold">
                <i className="bi bi-pie-chart-fill me-2"></i>Target Audience Insights
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="Qualified" className={`rounded-pill px-4 py-2 fw-bold ${activeTab === 'Qualified' ? 'text-white' : 'text-primary'}`}>
                <i className="bi bi-person-check-fill me-2"></i>Qualified Leads
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="Converted" className={`rounded-pill px-4 py-2 fw-bold ${activeTab === 'Converted' ? 'text-white' : 'text-success'}`}>
                <i className="bi bi-trophy-fill me-2"></i>Converted Leads
              </Nav.Link>
            </Nav.Item>
          </Nav>
          
          {activeTab !== "Insights" && (
            <InputGroup style={{ maxWidth: "300px" }}>
              <InputGroup.Text className="bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search leads..."
                className="border-start-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          )}
        </Card.Body>
      </Card>

      {/* TAB: INSIGHTS */}
      {activeTab === "Insights" && (
        <>
          {statsLoading ? (
            <LoadingSpinner />
          ) : statsError ? (
            <AlertMessage message={statsError} />
          ) : (
            <Row className="g-4">
              <Col xs={12}>
                <Card className="border-0 shadow-sm rounded-3">
                  <Card.Header className="bg-white border-0 pt-4 px-4 pb-0 fw-bold">
                    <h5 className="mb-0 text-dark tracking-tight">Industries Targeted Overview</h5>
                    <p className="text-muted small fw-normal mt-1">
                      A breakdown of your overall prospect audience by industry sector. Your total targeted audience spans <strong className="text-dark">{statsData.totalTargeted}</strong> leads.
                    </p>
                  </Card.Header>
                  <Card.Body className="p-4">
                    {statsData.industryStats && statsData.industryStats.length > 0 ? (
                      <Row className="g-4">
                        {statsData.industryStats.map((stat, idx) => (
                          <Col xs={12} md={6} lg={4} key={idx}>
                            <Card className="border shadow-none h-100 rounded-3 bg-light">
                              <Card.Body className="p-4">
                                <h6 className="fw-bolder text-dark mb-3 text-truncate" title={stat.industry}>
                                  {stat.industry}
                                </h6>
                                <div className="mb-3">
                                  <div className="d-flex justify-content-between mb-1 small">
                                    <span className="text-muted fw-medium">Audience Pool</span>
                                    <span className="fw-bold">{stat.targeted} Prospects</span>
                                  </div>
                                  <ProgressBar 
                                    now={100} 
                                    variant="secondary" 
                                    className="opacity-25"
                                    style={{ height: '6px' }} 
                                  />
                                </div>
                                <div className="d-flex gap-3 mt-4 pt-3 border-top border-secondary-subtle">
                                  <div className="flex-fill">
                                    <div className="text-primary fs-4 fw-bolder tracking-tight">{stat.qualified}</div>
                                    <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Qualified</div>
                                  </div>
                                  <div className="flex-fill border-start border-secondary-subtle ps-3">
                                    <div className="text-success fs-4 fw-bolder tracking-tight">{stat.converted}</div>
                                    <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Converted</div>
                                  </div>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <div className="text-center py-5 text-muted">
                        <i className="bi bi-bar-chart fs-1 opacity-25 d-block mb-3"></i>
                        No industry statistics available yet.
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}

      {/* TAB: LEADS TABLE (QUALIFIED / CONVERTED) */}
      {activeTab !== "Insights" && (
        <>
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <AlertMessage message={error} />
          ) : (
            <Card className="border-0 shadow-sm rounded-3">
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-4 py-3 border-bottom-0">Status</th>
                      <th className="px-4 py-3 border-bottom-0">Prospect Identity</th>
                      <th className="px-4 py-3 border-bottom-0">Professional Info</th>
                      <th className="px-4 py-3 border-bottom-0">Contact Details</th>
                      <th className="px-4 py-3 border-bottom-0">Source List</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length > 0 ? (
                      filteredLeads.map((lead, idx) => (
                        <tr key={lead.membershipId || `${lead.id}-${idx}`}>
                          <td className="px-4 py-3">
                            <Badge bg={lead.status === 'Converted' ? 'success' : 'primary'} className="text-uppercase px-3 py-2 rounded-pill tracking-wide" style={{ fontSize: '0.7rem' }}>
                              {lead.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="fw-bolder text-dark fs-6 d-flex align-items-center">
                              <i className="bi bi-unlock-fill text-success me-2 fs-6"></i>
                              {lead.firstName} {lead.lastName}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="fw-bold text-dark">{lead.jobTitle || 'Decision Maker'}</div>
                            <div className="text-muted small">
                              <i className="bi bi-building me-1 opacity-50"></i>
                              <span className="fw-medium">{lead.company || 'Target Organization'}</span> 
                              <span className="opacity-75 ms-1">({lead.industry || 'Industry N/A'})</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="small">
                              <div className="text-dark mb-1">
                                <i className="bi bi-envelope-fill me-2 text-primary opacity-75"></i>
                                {lead.email}
                              </div>
                              {lead.phone && (
                                <div className="text-dark">
                                  <i className="bi bi-telephone-fill me-2 text-primary opacity-75"></i>
                                  {lead.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-secondary small fw-medium">
                            <i className="bi bi-folder-fill me-2 opacity-50"></i>
                            {lead.listName || 'Campaign Audience'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-5">
                          <i className="bi bi-search fs-1 opacity-25 d-block mb-3"></i>
                          No {activeTab.toLowerCase()} leads found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>

              <PaginationControl
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                itemName={`${activeTab.toLowerCase()} leads`}
              />
            </Card>
          )}
        </>
      )}
    </AppLayout>
  );
}
