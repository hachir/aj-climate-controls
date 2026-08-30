import {
  AirVent,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CircuitBoard,
  Clock3,
  Cpu,
  Gauge,
  Mail,
  MapPin,
  Phone,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";

const company = {
  phone: "(801) 555-0148",
  phoneHref: "+18015550148",
  email: "service@ajclimatecontrols.com",
  serviceArea: "Salt Lake City & the Wasatch Front",
};

const services = [
  {
    icon: Building2,
    number: "01",
    title: "Building Automation",
    description:
      "Integrated control strategies that connect HVAC equipment, schedules, alarms, and operator graphics into one dependable system.",
  },
  {
    icon: CircuitBoard,
    number: "02",
    title: "Controls & Integration",
    description:
      "Controller programming, sensor integration, point-to-point verification, and sequence tuning for precise building performance.",
  },
  {
    icon: Gauge,
    number: "03",
    title: "VFD Optimization",
    description:
      "Drive setup, 0–10 V signal validation, motor direction checks, and performance optimization for pumps and air systems.",
  },
  {
    icon: Cpu,
    number: "04",
    title: "BACnet Troubleshooting",
    description:
      "Systematic diagnosis of BACnet/IP and MS/TP communication, addressing, wiring, and network reliability issues.",
  },
  {
    icon: SlidersHorizontal,
    number: "05",
    title: "System Commissioning",
    description:
      "Functional testing, trend review, alarm verification, and documented startup to confirm the system performs as designed.",
  },
  {
    icon: Wrench,
    number: "06",
    title: "Service & Diagnostics",
    description:
      "Clear root-cause troubleshooting for RTUs, AHUs, pumps, sensors, actuators, relays, and control sequences.",
  },
];

const steps = [
  {
    label: "Assess",
    text: "Review the equipment, controls, trends, alarms, and operator concerns.",
  },
  {
    label: "Diagnose",
    text: "Trace the system from command to response and identify the real failure point.",
  },
  {
    label: "Resolve",
    text: "Repair, program, tune, and verify every change under operating conditions.",
  },
  {
    label: "Document",
    text: "Deliver a clear record of findings, completed work, and recommended next steps.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <div className="shell header-inner">
          <a className="brand" href="#top" aria-label="AJ Climate Controls home">
            <span className="brand-mark" aria-hidden="true">AJ</span>
            <span className="brand-copy">
              <strong>AJ Climate</strong>
              <span>Controls</span>
            </span>
          </a>

          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#services">Services</a>
            <a href="#approach">Approach</a>
            <a href="#expertise">Expertise</a>
            <a href="#contact">Contact</a>
          </nav>

          <a className="header-cta" href={`tel:${company.phoneHref}`}>
            <Phone size={16} aria-hidden="true" />
            <span>{company.phone}</span>
          </a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="shell hero-layout">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" />
              Commercial HVAC Controls
            </div>
            <h1>
              Smarter buildings.
              <span>Precise control.</span>
            </h1>
            <p className="hero-lead">
              Building automation, controls integration, and advanced HVAC
              diagnostics engineered for reliable operation, energy efficiency,
              and occupant comfort.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#contact">
                Schedule a site assessment
                <ArrowRight size={18} aria-hidden="true" />
              </a>
              <a className="button button-secondary" href="#services">
                Explore capabilities
              </a>
            </div>
            <div className="protocol-row" aria-label="Technical capabilities">
              <span><Check size={15} /> BACnet/IP</span>
              <span><Check size={15} /> BACnet MS/TP</span>
              <span><Check size={15} /> 0–10 V Controls</span>
            </div>
          </div>

          <div className="control-panel" aria-label="Example building system dashboard">
            <div className="panel-topbar">
              <div>
                <span className="panel-kicker">Building System</span>
                <strong>Operations Overview</strong>
              </div>
              <span className="online-badge"><span /> Online</span>
            </div>

            <div className="system-summary">
              <div className="equipment-icon">
                <AirVent size={30} aria-hidden="true" />
              </div>
              <div>
                <span>Air Handling Unit</span>
                <strong>AHU-01 · Occupied</strong>
              </div>
              <div className="running-status">
                <CheckCircle2 size={17} /> Running
              </div>
            </div>

            <div className="metric-grid">
              <div className="metric-card">
                <span>Supply air</span>
                <strong>55.2<small>°F</small></strong>
                <em>At setpoint</em>
              </div>
              <div className="metric-card">
                <span>Static pressure</span>
                <strong>1.48<small> in.</small></strong>
                <em>Stable</em>
              </div>
              <div className="metric-card">
                <span>Space average</span>
                <strong>72.1<small>°F</small></strong>
                <em>Comfort range</em>
              </div>
            </div>

            <div className="trend-card">
              <div className="trend-heading">
                <span>System demand · 12 hours</span>
                <strong>64%</strong>
              </div>
              <div className="trend-chart" aria-hidden="true">
                {[28, 34, 42, 39, 55, 48, 67, 62, 76, 70, 64, 64].map(
                  (height, index) => (
                    <span key={index} style={{ height: `${height}%` }} />
                  ),
                )}
              </div>
              <div className="trend-times">
                <span>6 AM</span><span>12 PM</span><span>6 PM</span>
              </div>
            </div>

            <div className="panel-footer">
              <span><span className="status-dot" /> 12 of 12 controllers online</span>
              <span>Last update · now</span>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Core capabilities">
        <div className="shell trust-grid">
          <div><strong>BACnet</strong><span>Network integration</span></div>
          <div><strong>VFD</strong><span>Programming & control</span></div>
          <div><strong>RTU / AHU</strong><span>Commercial systems</span></div>
          <div><strong>DDC</strong><span>Sequence optimization</span></div>
        </div>
      </section>

      <section className="section services-section" id="services">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="section-label">Capabilities</span>
              <h2>Control every variable.</h2>
            </div>
            <p>
              Practical controls expertise from the field device to the building
              network—focused on systems that operate reliably and make sense to
              the people maintaining them.
            </p>
          </div>

          <div className="service-grid">
            {services.map(({ icon: Icon, number, title, description }) => (
              <article className="service-card" key={title}>
                <div className="service-card-top">
                  <span className="service-icon"><Icon size={24} /></span>
                  <span className="service-number">{number}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section approach-section" id="approach">
        <div className="shell approach-layout">
          <div className="approach-intro">
            <span className="section-label light-label">How we work</span>
            <h2>Find the cause.<br />Fix it right.</h2>
            <p>
              Good controls work is methodical. Every service call follows a
              clear path from evidence to verified performance.
            </p>
            <div className="assurance">
              <ShieldCheck size={24} />
              <span><strong>Verification built in</strong>Every change is tested before closeout.</span>
            </div>
          </div>

          <ol className="process-list">
            {steps.map((step, index) => (
              <li key={step.label}>
                <span className="step-number">0{index + 1}</span>
                <div><h3>{step.label}</h3><p>{step.text}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section expertise-section" id="expertise">
        <div className="shell expertise-layout">
          <div className="expertise-copy">
            <span className="section-label">Built for operators</span>
            <h2>Complex systems.<br />Clear answers.</h2>
            <p>
              Controls should help teams understand their building—not create
              another layer of confusion. Our work prioritizes clean sequences,
              meaningful alarms, accurate sensors, and straightforward reporting.
            </p>
            <ul className="check-list">
              <li><CheckCircle2 /> Root-cause focused troubleshooting</li>
              <li><CheckCircle2 /> Clear field documentation and closeout</li>
              <li><CheckCircle2 /> Practical recommendations prioritized by impact</li>
            </ul>
          </div>

          <div className="expertise-board">
            <div className="board-header">
              <span>Technical scope</span>
              <Settings2 size={20} />
            </div>
            <div className="board-row"><span>Communication</span><strong>BACnet/IP · MS/TP</strong></div>
            <div className="board-row"><span>Control signals</span><strong>0–10 V · 4–20 mA</strong></div>
            <div className="board-row"><span>Equipment</span><strong>RTU · AHU · Pumps</strong></div>
            <div className="board-row"><span>Field devices</span><strong>Sensors · Relays · Actuators</strong></div>
            <div className="board-status">
              <div><span className="status-dot" /><strong>System ready</strong></div>
              <span>Commissioned & verified</span>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="shell contact-card">
          <div className="contact-copy">
            <span className="section-label light-label">Start a conversation</span>
            <h2>Let’s make your building work smarter.</h2>
            <p>
              Tell us what the system is doing, what it should be doing, and
              where you need support. We’ll help define the next step.
            </p>
          </div>
          <div className="contact-actions">
            <a className="contact-link" href={`tel:${company.phoneHref}`}>
              <span><Phone size={20} /></span>
              <div><small>Call our team</small><strong>{company.phone}</strong></div>
              <ArrowRight size={18} />
            </a>
            <a className="contact-link" href={`mailto:${company.email}`}>
              <span><Mail size={20} /></span>
              <div><small>Email service</small><strong>{company.email}</strong></div>
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      <footer>
        <div className="shell footer-grid">
          <div className="footer-brand">
            <a className="brand" href="#top">
              <span className="brand-mark">AJ</span>
              <span className="brand-copy"><strong>AJ Climate</strong><span>Controls</span></span>
            </a>
            <p>Commercial HVAC controls and building automation expertise.</p>
          </div>
          <div className="footer-info">
            <span><MapPin size={16} /> {company.serviceArea}</span>
            <span><Clock3 size={16} /> Commercial service by appointment</span>
          </div>
        </div>
        <div className="shell footer-bottom">
          <span>© {new Date().getFullYear()} AJ Climate Controls.</span>
          <span>Precision in every point.</span>
        </div>
      </footer>
    </main>
  );
}
