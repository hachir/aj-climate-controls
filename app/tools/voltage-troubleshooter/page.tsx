"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TriangleAlert, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { diagnoseVoltage } from "@/lib/voltage-troubleshooter";

export default function VoltageTroubleshooterPage() {
  const [reading, setReading] = useState("");
  const result = diagnoseVoltage(reading);
  const invalid = reading.trim() !== "" && result === null;

  return (
    <main className="dashboard-app">
      <header className="main-navbar">
        <div className="navbar-inner hvac-navbar">
          <Link className="dashboard-brand" href="/" aria-label="AJ Climate Controls dashboard">
            <img className="brand-mark" src="/logo-mark.svg" alt="" width="48" height="48" />
            <div><strong>AJ Climate</strong><small>Operations Dashboard</small></div>
          </Link>
          <Link className="hvac-back-link" href="/tools"><ArrowLeft aria-hidden="true" /><span>Back to tools</span></Link>
        </div>
      </header>
      <div className="dashboard-content hvac-page voltage-page">
        <div className="page-heading"><div>
          <span className="page-eyebrow">Service toolkit</span>
          <h1>0–10 VDC Output Troubleshooting Tool</h1>
          <p>Check a measured control signal against the 0–10 VDC range.</p>
        </div></div>
        <section className="voltage-workspace hvac-tool-panels" aria-label="Voltage diagnosis">
          <div className="hvac-tool-heading"><h2><Zap aria-hidden="true" className="voltage-icon" /> Output reading</h2>
            <p>Enter the DC voltage measured between signal output and signal common.</p>
          </div>
          <div className="hvac-calculator-grid">
            <div>
              <div className="hvac-field">
                <label htmlFor="voltage-reading">Measured voltage (VDC)</label>
                <Input id="voltage-reading" type="text" inputMode="decimal" value={reading}
                  placeholder="e.g. 5.0" autoComplete="off" spellCheck={false}
                  onChange={(event) => setReading(event.target.value)}
                  aria-invalid={invalid || undefined}
                  aria-describedby={invalid ? "voltage-hint voltage-error" : "voltage-hint"} />
                {invalid && <small id="voltage-error">Enter a finite decimal number, such as 0.5 or 10.</small>}
              </div>
              <p id="voltage-hint" className="voltage-hint">Use a decimal point. Readings below 0 or above 10 are accepted for diagnosis.</p>
              <div className="hvac-actions" aria-label="Example readings">
                {[0, 0.5, 5, 10, 20].map((value) => <Button key={value} type="button" variant="outline"
                  onClick={() => setReading(String(value))}>{value} V</Button>)}
                <Button type="button" variant="ghost" onClick={() => setReading("")}>Clear reading</Button>
              </div>
            </div>
            <div className="hvac-result" role="status" aria-live="polite" aria-atomic="true"
              data-out-of-range={result?.status === "Out of range" || undefined}>
              <span>Signal diagnosis</span>
              <div className="voltage-status">{result?.status ?? (invalid ? "Invalid reading" : "Awaiting reading")}</div>
              {result ? <><p className="voltage-value">{reading.trim()} VDC</p>
                {result.warning && <div className="voltage-warning"><TriangleAlert aria-hidden="true" /><strong>{result.warning}</strong></div>}
                <p>{result.note}</p>
                {result.commandPercent !== null && <div className="voltage-command">
                  <p><strong>{Number(result.commandPercent.toFixed(2))}%</strong> of signal span</p>
                  <meter min="0" max="100" value={result.commandPercent} aria-label="Percent of 0–10 VDC signal span" />
                  <p>VDC ÷ 10 × 100. Assumes direct-acting 0–10 V; this is not measured position or speed.</p>
                </div>}
                <div className="voltage-checks"><h3>What to check next</h3>
                  <ol>{result.checks.map((check) => <li key={check}>{check}</li>)}</ol>
                </div></>
                : <p>{invalid ? "Enter a valid number to see a diagnosis." : "Enter a reading or choose an example to see the result."}</p>}
            </div>
          </div>
          <div className="hvac-guidance">
            <h2 className="voltage-ranges-heading">How readings are classified</h2>
            <dl className="voltage-ranges">
              <div><dt>0 ≤ V &lt; 2</dt><dd>Low output</dd></div>
              <div><dt>2 ≤ V &lt; 8</dt><dd>Mid-range output</dd></div>
              <div><dt>8 ≤ V &lt; 10</dt><dd>High output</dd></div>
              <div><dt>V = 10</dt><dd>Full command</dd></div>
              <div><dt>V &lt; 0 or V &gt; 10</dt><dd>Out of range</dd></div>
            </dl>
            <p>These are simplified display bands for a direct-acting 0–10 VDC signal, with no tolerance applied.
              Confirm the configured signal range and action in the equipment documentation, especially for 2–10 V or reverse-acting controls.
              An in-range reading alone does not confirm correct equipment operation.</p>
            <p>Signal ranges and wiring vary by model. <a href="https://www.belimo.com/us/en_US/blog/Understand-Control-Signal-Jargon" target="_blank" rel="noreferrer">Belimo signal reference ↗</a></p>
          </div>
        </section>
      </div>
    </main>
  );
}
