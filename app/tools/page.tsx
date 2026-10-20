import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ToolDirectory } from "@/components/tool-directory";
import { HvacTools } from "@/components/hvac-tools";

export const metadata = {
  title: "HVAC Tools | AJ Climate Controls",
  description: "Field calculators for temperature split, superheat, subcooling, duct airflow, HVAC capacity conversions, fire alarm shutdown checkout, RTU/AHU checkout, VFD checkout, BACnet MS/TP checkout, control signal conversion and 0–10 VDC output troubleshooting.",
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
        <ToolDirectory />
        <section id="field-calculators" aria-label="Field calculators" style={{ scrollMarginTop: 100 }}>
          <HvacTools />
        </section>
      </div>
    </main>
  );
}
