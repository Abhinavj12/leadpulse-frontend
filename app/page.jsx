"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import { useAuth } from "@/hooks/useAuth";
import { roleHome } from "@/lib/constants/roles";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("manager");

  const dashboardPath = user ? roleHome(user.role) : "/login";

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* NAVBAR */}
      <Navbar bg="white" expand="lg" sticky="top" className="shadow-sm py-3 border-bottom">
        <Container>
          <Navbar.Brand href="/" className="d-flex align-items-center gap-2 fw-bold fs-4 text-primary">
            <div className="bg-primary text-white rounded-3 p-2 d-inline-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
              <i className="bi bi-lightning-charge-fill fs-5"></i>
            </div>
            <span>LeadPulse</span>
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="landing-navbar" />
          
          <Navbar.Collapse id="landing-navbar">
            <Nav className="mx-auto my-2 my-lg-0 fw-medium">
              <Nav.Link href="#features" className="px-3">Features</Nav.Link>
              <Nav.Link href="#solutions" className="px-3">Solutions</Nav.Link>
              <Nav.Link href="#pricing" className="px-3">Pricing Models</Nav.Link>
            </Nav>
            
            <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0">
              {!loading && user ? (
                <Link href={dashboardPath}>
                  <Button variant="primary" className="fw-semibold px-4 rounded-pill shadow-sm">
                    <i className="bi bi-speedometer2 me-2"></i> Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline-primary" className="fw-semibold px-4 rounded-pill me-2">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" className="fw-semibold px-4 rounded-pill shadow-sm">
                      <i className="bi bi-person-plus-fill me-2"></i> Register as Campaign Manager
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* HERO SECTION */}
      <section className="py-5 text-dark position-relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f8fafd 0%, #eef2f7 100%)" }}>
        <Container className="py-5">
          <Row className="align-items-center g-5">
            <Col lg={7}>
              <div className="d-inline-flex align-items-center gap-2 bg-white px-3 py-2 rounded-pill shadow-sm border mb-3">
                <Badge bg="primary" pill>New</Badge>
                <span className="small fw-semibold text-muted">Unified Multi-Channel Outreach & Client Reporting</span>
              </div>
              
              <h1 className="display-4 fw-extrabold text-dark tracking-tight mb-3">
                Scale B2B Outreach with Automated Sequences & Telemarketing Queues
              </h1>
              
              <p className="lead text-secondary mb-4 me-lg-4" style={{ fontSize: "1.15rem", lineHeight: "1.7" }}>
                LeadPulse brings Campaign Managers, Executive Callers, and Clients together in one platform.
                Execute multi-touch email sequences, power dialer call campaigns, and deliver transparent client portals with verified conversion metrics.
              </p>
              
              <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
                <Link href="/register">
                  <Button variant="primary" size="lg" className="fw-bold px-4 py-3 rounded-pill shadow">
                    Get Started as Campaign Manager <i className="bi bi-arrow-right ms-2"></i>
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline-dark" size="lg" className="fw-semibold px-4 py-3 rounded-pill">
                    Sign In to Portal
                  </Button>
                </Link>
              </div>

              <div className="d-flex flex-wrap gap-4 text-muted small fw-medium border-top pt-4">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-success fs-5"></i>
                  <span>Email Engagement Engine</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-success fs-5"></i>
                  <span>Power Dialer Terminal</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-success fs-5"></i>
                  <span>Instant PDF & Excel Reports</span>
                </div>
              </div>
            </Col>

            <Col lg={5}>
              <Card className="border-0 shadow-lg rounded-4 bg-white overflow-hidden p-2">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                    <div>
                      <h6 className="fw-bold text-dark m-0">Live Campaign Motion</h6>
                      <small className="text-muted">Enterprise Lead Generation</small>
                    </div>
                    <Badge bg="success" className="px-3 py-2 text-uppercase">Active Motion</Badge>
                  </div>

                  {/* MINI PREVIEW WIDGET */}
                  <div className="vstack gap-3">
                    <div className="p-3 bg-light rounded-3 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary text-white p-2 rounded-circle">
                          <i className="bi bi-envelope-check fs-5"></i>
                        </div>
                        <div>
                          <div className="fw-bold text-dark small">Step 1: Automated Email Dispatch</div>
                          <div className="text-muted extra-small">245 Dispatched · 48% Open Rate</div>
                        </div>
                      </div>
                      <Badge bg="primary">Completed</Badge>
                    </div>

                    <div className="p-3 bg-light rounded-3 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-success text-white p-2 rounded-circle">
                          <i className="bi bi-telephone-outbound fs-5"></i>
                        </div>
                        <div>
                          <div className="fw-bold text-dark small">Step 2: Executive Dialer Queue</div>
                          <div className="text-muted extra-small">18 Direct Connections Logged</div>
                        </div>
                      </div>
                      <Badge bg="success">In Progress</Badge>
                    </div>

                    <div className="p-3 bg-light rounded-3 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-warning text-dark p-2 rounded-circle">
                          <i className="bi bi-trophy fs-5"></i>
                        </div>
                        <div>
                          <div className="fw-bold text-dark small">Secured Conversions</div>
                          <div className="text-muted extra-small">12 Verified Qualified Leads</div>
                        </div>
                      </div>
                      <Badge bg="dark">Verified</Badge>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 bg-primary text-white rounded-3 p-3 text-center">
                    <div className="small opacity-75">Client Portal Status</div>
                    <div className="fw-bold fs-5 mt-1">100% Real-Time Transparency</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* STATS HIGHLIGHT COUNTER */}
      <section className="py-4 bg-primary text-white shadow-sm">
        <Container>
          <Row className="text-center g-4">
            <Col md={3} xs={6}>
              <div className="display-6 fw-bold">Multi-Touch</div>
              <div className="small opacity-75 mt-1">Email & Telemarketing Sequences</div>
            </Col>
            <Col md={3} xs={6}>
              <div className="display-6 fw-bold">1-Click</div>
              <div className="small opacity-75 mt-1">Power Dialer & Call Outcome Logging</div>
            </Col>
            <Col md={3} xs={6}>
              <div className="display-6 fw-bold">Verified</div>
              <div className="small opacity-75 mt-1">Click-to-Convert CTA Tracking</div>
            </Col>
            <Col md={3} xs={6}>
              <div className="display-6 fw-bold">PDF / XLSX</div>
              <div className="small opacity-75 mt-1">SRS Standard Automated Reports</div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* SOLUTIONS FOR EACH ROLE */}
      <section id="solutions" className="py-5 bg-white">
        <Container className="py-4">
          <div className="text-center max-width-700 mx-auto mb-5">
            <Badge bg="primary" className="px-3 py-2 text-uppercase mb-2">Tailored Workspaces</Badge>
            <h2 className="fw-bold text-dark">Built for Every Stakeholder in B2B Outreach</h2>
            <p className="text-muted">LeadPulse provides dedicated interfaces engineered specifically for agency managers, sales callers, and account clients.</p>
          </div>

          {/* ROLE SELECTOR TABS */}
          <div className="d-flex justify-content-center mb-4 gap-2 flex-wrap">
            <Button 
              variant={activeTab === 'manager' ? 'primary' : 'outline-secondary'} 
              className="rounded-pill px-4 fw-semibold"
              onClick={() => setActiveTab('manager')}
            >
              <i className="bi bi-briefcase me-2"></i> Campaign Managers
            </Button>
            <Button 
              variant={activeTab === 'executive' ? 'primary' : 'outline-secondary'} 
              className="rounded-pill px-4 fw-semibold"
              onClick={() => setActiveTab('executive')}
            >
              <i className="bi bi-headset me-2"></i> Sales Executive Callers
            </Button>
            <Button 
              variant={activeTab === 'client' ? 'primary' : 'outline-secondary'} 
              className="rounded-pill px-4 fw-semibold"
              onClick={() => setActiveTab('client')}
            >
              <i className="bi bi-building me-2"></i> Account Clients
            </Button>
          </div>

          {/* TAB CONTENT */}
          <Card className="border-0 shadow-sm rounded-4 p-4 bg-light">
            {activeTab === 'manager' && (
              <Row className="align-items-center g-4">
                <Col lg={6}>
                  <Badge bg="primary" className="mb-2">Manager Portal</Badge>
                  <h3 className="fw-bold text-dark">Full Outreach & Operations Control</h3>
                  <p className="text-muted">Create campaigns, segment lead lists with filters, build automated multi-step cadences, and manage caller allocations with real-time conversion billing.</p>
                  <ul className="list-unstyled vstack gap-2 text-dark small fw-medium">
                    <li><i className="bi bi-check2-circle text-primary me-2 fs-5"></i> Flexible pricing models: Cost-per-lead (CPL) or Flat Monthly Retainer</li>
                    <li><i className="bi bi-check2-circle text-primary me-2 fs-5"></i> Ready-made subject line & HTML email template builder</li>
                    <li><i className="bi bi-check2-circle text-primary me-2 fs-5"></i> Trust Loop & Compliance verification for claimed conversions</li>
                  </ul>
                  <Link href="/register" className="btn btn-primary rounded-pill px-4 mt-3">
                    Register as Manager
                  </Link>
                </Col>
                <Col lg={6}>
                  <div className="p-4 bg-white rounded-3 shadow-sm border">
                    <div className="fw-bold mb-3 text-dark d-flex justify-content-between">
                      <span>Agency Dashboard Overview</span>
                      <Badge bg="info" className="text-dark">Manager View</Badge>
                    </div>
                    <div className="p-3 bg-light rounded-3 mb-2 d-flex justify-content-between align-items-center">
                      <span>Active Client Accounts</span>
                      <strong className="text-primary">14 Clients</strong>
                    </div>
                    <div className="p-3 bg-light rounded-3 mb-2 d-flex justify-content-between align-items-center">
                      <span>Live Outreach Motions</span>
                      <strong className="text-success">28 Sequences</strong>
                    </div>
                    <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                      <span>Confirmed Billable Conversions</span>
                      <strong className="text-dark">142 Leads</strong>
                    </div>
                  </div>
                </Col>
              </Row>
            )}

            {activeTab === 'executive' && (
              <Row className="align-items-center g-4">
                <Col lg={6}>
                  <Badge bg="success" className="mb-2">Executive Caller Terminal</Badge>
                  <h3 className="fw-bold text-dark">High-Velocity Power Dialer</h3>
                  <p className="text-muted">Eliminate friction for telemarketing callers with an interactive dialer, queue management, structured outcome tagging, and follow-up scheduling.</p>
                  <ul className="list-unstyled vstack gap-2 text-dark small fw-medium">
                    <li><i className="bi bi-check2-circle text-success me-2 fs-5"></i> Single-click outcome logging (Answered, Interested, Callback, Converted)</li>
                    <li><i className="bi bi-check2-circle text-success me-2 fs-5"></i> Call duration tracking and detailed prospect notes</li>
                    <li><i className="bi bi-check2-circle text-success me-2 fs-5"></i> Automated queue progression to maximize dials per hour</li>
                  </ul>
                  <Link href="/login" className="btn btn-success rounded-pill px-4 mt-3">
                    Sign In to Dialer Terminal
                  </Link>
                </Col>
                <Col lg={6}>
                  <div className="p-4 bg-white rounded-3 shadow-sm border">
                    <div className="fw-bold mb-3 text-dark d-flex justify-content-between">
                      <span>Power Dialer Interface</span>
                      <Badge bg="success">Executive View</Badge>
                    </div>
                    <div className="p-3 bg-success bg-opacity-10 border border-success rounded-3 mb-3 text-center">
                      <div className="text-uppercase small fw-bold text-success">Active Lead Queue</div>
                      <div className="fs-3 fw-bold text-dark mt-1">John Doe - VP of Sales</div>
                      <div className="small text-muted">Acme Corp · (555) 234-5678</div>
                    </div>
                    <div className="d-flex gap-2">
                      <Button variant="outline-success" size="sm" className="w-100">Answered</Button>
                      <Button variant="outline-primary" size="sm" className="w-100">Callback</Button>
                      <Button variant="success" size="sm" className="w-100 fw-bold">Converted</Button>
                    </div>
                  </div>
                </Col>
              </Row>
            )}

            {activeTab === 'client' && (
              <Row className="align-items-center g-4">
                <Col lg={6}>
                  <Badge bg="info" className="text-dark mb-2">Client Transparency Portal</Badge>
                  <h3 className="fw-bold text-dark">Real-Time Performance & Reports</h3>
                  <p className="text-muted">Give your clients complete confidence with dedicated dashboard views showing email funnel metrics, call outcome breakdowns, and instant PDF/Excel report downloads.</p>
                  <ul className="list-unstyled vstack gap-2 text-dark small fw-medium">
                    <li><i className="bi bi-check2-circle text-info me-2 fs-5"></i> Verified contact access for qualified and converted leads</li>
                    <li><i className="bi bi-check2-circle text-info me-2 fs-5"></i> Instant 1-click PDF and Excel lead manifest export</li>
                    <li><i className="bi bi-check2-circle text-info me-2 fs-5"></i> Clear breakdown of email open rates, CTR, CTOR, and dials</li>
                  </ul>
                  <Link href="/login" className="btn btn-dark rounded-pill px-4 mt-3">
                    Client Portal Sign In
                  </Link>
                </Col>
                <Col lg={6}>
                  <div className="p-4 bg-white rounded-3 shadow-sm border">
                    <div className="fw-bold mb-3 text-dark d-flex justify-content-between">
                      <span>Client Campaign Report</span>
                      <Badge bg="dark">Client View</Badge>
                    </div>
                    <div className="row g-2 text-center">
                      <div className="col-6">
                        <div className="p-3 bg-light rounded-3">
                          <div className="small text-muted">Emails Dispatched</div>
                          <div className="fs-4 fw-bold text-primary">1,450</div>
                          <div className="extra-small text-success">Open Rate: 42.5%</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-3 bg-light rounded-3">
                          <div className="small text-muted">Secured Conversions</div>
                          <div className="fs-4 fw-bold text-success">38</div>
                          <div className="extra-small text-muted">Confirmed Events</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            )}
          </Card>
        </Container>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="py-5 bg-light">
        <Container className="py-4">
          <div className="text-center max-width-700 mx-auto mb-5">
            <h2 className="fw-bold text-dark">Engineered for Lead Generation Success</h2>
            <p className="text-muted">Everything you need to plan, execute, analyze, and monetize outreach campaigns.</p>
          </div>

          <Row className="g-4">
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm rounded-4 p-3">
                <Card.Body>
                  <div className="bg-primary text-white rounded-3 p-3 d-inline-flex mb-3">
                    <i className="bi bi-diagram-3 fs-4"></i>
                  </div>
                  <h5 className="fw-bold text-dark">Multi-Touch Motion Sequences</h5>
                  <p className="text-muted small">
                    Chain email outreach with scheduled telemarketing call steps in automated sequences for maximum response rates.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm rounded-4 p-3">
                <Card.Body>
                  <div className="bg-success text-white rounded-3 p-3 d-inline-flex mb-3">
                    <i className="bi bi-bar-chart-line fs-4"></i>
                  </div>
                  <h5 className="fw-bold text-dark">Email Engagement Funnels</h5>
                  <p className="text-muted small">
                    Track unique opens, CTR, Click-to-Open (CTOR), bounce thresholds, and unsubscribe rates with instant domain protection.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm rounded-4 p-3">
                <Card.Body>
                  <div className="bg-info text-dark rounded-3 p-3 d-inline-flex mb-3">
                    <i className="bi bi-link-45deg fs-4"></i>
                  </div>
                  <h5 className="fw-bold text-dark">Click-to-Convert CTA Links</h5>
                  <p className="text-muted small">
                    Generate unique interest links (`/public/convert`) that automatically convert leads when clicked and trigger notifications.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm rounded-4 p-3">
                <Card.Body>
                  <div className="bg-warning text-dark rounded-3 p-3 d-inline-flex mb-3">
                    <i className="bi bi-journal-check fs-4"></i>
                  </div>
                  <h5 className="fw-bold text-dark">Verified Lead CRM</h5>
                  <p className="text-muted small">
                    Centralized lead list management with state tracking (New, Attempted, Contacted, Qualified, Converted).
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm rounded-4 p-3">
                <Card.Body>
                  <div className="bg-danger text-white rounded-3 p-3 d-inline-flex mb-3">
                    <i className="bi bi-file-earmark-pdf fs-4"></i>
                  </div>
                  <h5 className="fw-bold text-dark">1-Click PDF & Excel Reports</h5>
                  <p className="text-muted small">
                    Download clean SRS 4.9 formatted PDF summaries and detailed Excel lead manifests for client billing and review.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm rounded-4 p-3">
                <Card.Body>
                  <div className="bg-dark text-white rounded-3 p-3 d-inline-flex mb-3">
                    <i className="bi bi-shield-check fs-4"></i>
                  </div>
                  <h5 className="fw-bold text-dark">Trust Loop & Compliance</h5>
                  <p className="text-muted small">
                    Built-in manager verification for claimed conversions, suppression lists, and CAN-SPAM compliant unsubscribe handling.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* PRICING MODELS SECTION */}
      <section id="pricing" className="py-5 bg-white">
        <Container className="py-4">
          <div className="text-center max-width-700 mx-auto mb-5">
            <Badge bg="success" className="px-3 py-2 text-uppercase mb-2">Flexible Monetization</Badge>
            <h2 className="fw-bold text-dark">Built to Support Your Agency Billing</h2>
            <p className="text-muted">LeadPulse natively tracks two primary B2B lead generation pricing models.</p>
          </div>

          <Row className="g-4 justify-content-center">
            <Col lg={5}>
              <Card className="h-100 border-2 border-primary shadow-sm rounded-4 p-4 text-center">
                <Card.Body>
                  <Badge bg="primary" className="mb-2 px-3 py-2">Performance Billing</Badge>
                  <h3 className="fw-bold text-dark mt-2">Cost-Per-Lead (CPL)</h3>
                  <p className="text-muted small">Pay only for confirmed conversions secured through outreach.</p>
                  <div className="my-4 p-3 bg-light rounded-3">
                    <div className="display-6 fw-bold text-primary">Custom Rate / Lead</div>
                    <div className="small text-muted mt-1">Automatic accrual based on verified conversions</div>
                  </div>
                  <ul className="list-unstyled text-start vstack gap-2 small">
                    <li><i className="bi bi-check-lg text-primary me-2"></i> Zero billing for unconfirmed claims</li>
                    <li><i className="bi bi-check-lg text-primary me-2"></i> Automatic conversion calculation</li>
                    <li><i className="bi bi-check-lg text-primary me-2"></i> Real-time client revenue tracking</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={5}>
              <Card className="h-100 border-2 border-success shadow-sm rounded-4 p-4 text-center">
                <Card.Body>
                  <Badge bg="success" className="mb-2 px-3 py-2">Retainer Billing</Badge>
                  <h3 className="fw-bold text-dark mt-2">Flat Monthly Retainer</h3>
                  <p className="text-muted small">Fixed campaign retainer with effective cost-per-conversion analytics.</p>
                  <div className="my-4 p-3 bg-light rounded-3">
                    <div className="display-6 fw-bold text-success">Flat Retainer</div>
                    <div className="small text-muted mt-1">Calculates effective cost per acquired lead</div>
                  </div>
                  <ul className="list-unstyled text-start vstack gap-2 small">
                    <li><i className="bi bi-check-lg text-success me-2"></i> Predictable monthly client retainer</li>
                    <li><i className="bi bi-check-lg text-success me-2"></i> Full channel utilization reports</li>
                    <li><i className="bi bi-check-lg text-success me-2"></i> Volume & efficiency tracking</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA BANNER */}
      <section className="py-5 bg-primary text-white text-center position-relative">
        <Container className="py-4">
          <h2 className="display-5 fw-bold mb-3">Ready to Launch Your Next Outreach Motion?</h2>
          <p className="lead opacity-75 max-width-700 mx-auto mb-4">
            Register as a Campaign Manager to start building sequences, assigning lead queues, and delivering transparent reports to your clients today.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link href="/register">
              <Button variant="light" size="lg" className="fw-bold text-primary px-4 py-3 rounded-pill shadow">
                Register as Campaign Manager
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline-light" size="lg" className="fw-semibold px-4 py-3 rounded-pill">
                Sign In to Workspace
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-4 bg-dark text-white-50 border-top border-secondary">
        <Container>
          <Row className="align-items-center g-3">
            <Col md={6}>
              <div className="d-flex align-items-center gap-2 fw-bold text-white fs-5">
                <i className="bi bi-lightning-charge-fill text-primary"></i> LeadPulse
              </div>
              <p className="small text-muted m-0 mt-1">
                Multi-Channel B2B Outreach & Telemarketing Campaign Acceleration Platform.
              </p>
            </Col>
            <Col md={6} className="text-md-end">
              <div className="d-inline-flex gap-3 small fw-medium">
                <Link href="/login" className="text-white-50 text-decoration-none hover-white">Sign In</Link>
                <Link href="/register" className="text-white-50 text-decoration-none hover-white">Register Manager</Link>
                <Link href="/public/unsubscribe" className="text-white-50 text-decoration-none hover-white">Unsubscribe</Link>
              </div>
              <div className="extra-small text-muted mt-2">
                © {new Date().getFullYear()} LeadPulse. All rights reserved.
              </div>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}
