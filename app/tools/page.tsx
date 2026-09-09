import Link from "next/link";
import { ArrowLeft, ArrowRight, Zap } from "lucide-react";
import { HvacTools } from "@/components/hvac-tools";

export const metadata = {
  title: "HVAC Tools | AJ Climate Controls",
  description: "Field calculators for temperature split, superheat, subcooling, duct airflow, HVAC capacity conversions and 0–10 VDC output troubleshooting.",
};

export default function ToolsPage() {
  return (
    <main className="dashboard-app">
      <header className="main-navbar">
        <div className="navbar-inner hvac-navbar">
          <Link className="dashboard-brand" href="/" aria-label="AJ Climate Controls dashboard">
            <img className="brand-mark" src="/logo-mark.svg" alt="" width="48" height="48" />
            <div><strong>AJ Climate</strong><small>Operations Dashboard</small></div>
          </Link>
          <Link className="hvac-back-link" href="/"><ArrowLeft aria-hidden="true" /><span>Back to dashboard</span></Link>
        </div>
      </header>
      <div className="dashboard-content hvac-page">
        <div className="page-heading"><div>
          <span className="page-eyebrow">Service toolkit</span>
          <h1>HVAC tools</h1>
          <p>Enter your field readings. Get clear calculations in the units you use.</p>
        </div></div>
        <Link className="voltage-tool-link" href="/tools/voltage-troubleshooter">
          <Zap aria-hidden="true" />
          <span><strong>0–10 VDC Output Troubleshooting Tool</strong><small>Check a control signal reading and see its output range.</small></span>
          <ArrowRight aria-hidden="true" />
        </Link>
        <HvacTools />
      </div>
    </main>
  );
}
