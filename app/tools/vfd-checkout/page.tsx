"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Settings2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { diagnoseVfdCheckout, type DriveFamily, type DriveMode, type FieldAnswer } from "@/lib/vfd-checkout";

const driveFamilies: { value: DriveFamily; label: string }[] = [
  { value: "yaskawa-j1000", label: "Yaskawa J1000" },
  { value: "yaskawa-ga500", label: "Yaskawa GA500" },
  { value: "generic", label: "Generic VFD" },
];

const answers: { value: FieldAnswer; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const modes: { value: DriveMode; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "auto", label: "Remote / Auto" },
  { value: "local", label: "Local / Hand" },
];

export default function VfdCheckoutPage() {
  const [driveFamily, setDriveFamily] = useState<DriveFamily>("yaskawa-j1000");
  const [mode, setMode] = useState<DriveMode>("unknown");
  const [runCommand, setRunCommand] = useState<FieldAnswer>("unknown");
  const [speedReference, setSpeedReference] = useState("");
  const [faulted, setFaulted] = useState<FieldAnswer>("unknown");
  const [permissiveClosed, setPermissiveClosed] = useState<FieldAnswer>("unknown");
  const result = diagnoseVfdCheckout({ driveFamily, mode, runCommand, speedReference, faulted, permissiveClosed });
  const invalidReading = result.readingNote?.includes("decimal voltage") || false;

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
          <h1>VFD Checkout Tool</h1>
          <p>Check Auto/Remote operation, run command, permissive circuit, fault status and 0-10 VDC speed reference.</p>
        </div></div>
        <section className="voltage-workspace hvac-tool-panels" aria-label="VFD checkout">
          <div className="hvac-tool-heading"><h2><Settings2 aria-hidden="true" className="voltage-icon" /> Drive readings</h2>
            <p>Use this before changing parameters. It keeps the first checks focused on command, reference and safety circuits.</p>
          </div>
          <div className="hvac-calculator-grid">
            <div>
              <div className="hvac-field">
                <label htmlFor="vfd-family">Drive family</label>
                <select id="vfd-family" value={driveFamily} onChange={(event) => setDriveFamily(event.target.value as DriveFamily)}>
                  {driveFamilies.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="vfd-mode">Keypad mode</label>
                <select id="vfd-mode" value={mode} onChange={(event) => setMode(event.target.value as DriveMode)}>
                  {modes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="vfd-run">Run command present at drive?</label>
                <select id="vfd-run" value={runCommand} onChange={(event) => setRunCommand(event.target.value as FieldAnswer)}>
                  {answers.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="vfd-reference">Speed reference at drive input (VDC)</label>
                <Input id="vfd-reference" type="text" inputMode="decimal" value={speedReference}
                  placeholder="optional, e.g. 4.8" autoComplete="off" spellCheck={false}
                  onChange={(event) => setSpeedReference(event.target.value)}
                  aria-invalid={invalidReading || undefined}
                  aria-describedby="vfd-reference-note" />
                <small id="vfd-reference-note">{result.readingNote ?? "Measure between analog input and analog common, such as A1 to AC where applicable."}</small>
              </div>
              <div className="hvac-field">
                <label htmlFor="vfd-fault">Fault or alarm active?</label>
                <select id="vfd-fault" value={faulted} onChange={(event) => setFaulted(event.target.value as FieldAnswer)}>
                  {answers.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="vfd-permissive">Safety/permissive circuit closed?</label>
                <select id="vfd-permissive" value={permissiveClosed} onChange={(event) => setPermissiveClosed(event.target.value as FieldAnswer)}>
                  {answers.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-actions">
                <Button type="button" variant="outline" onClick={() => { setMode("auto"); setRunCommand("yes"); setSpeedReference("4.8"); setFaulted("no"); setPermissiveClosed("yes"); }}>Good Auto example</Button>
                <Button type="button" variant="ghost" onClick={() => { setDriveFamily("yaskawa-j1000"); setMode("unknown"); setRunCommand("unknown"); setSpeedReference(""); setFaulted("unknown"); setPermissiveClosed("unknown"); }}>Reset</Button>
              </div>
            </div>
            <div className="hvac-result" role="status" aria-live="polite" aria-atomic="true"
              data-out-of-range={result.severity === "Stop" || undefined}>
              <span>{result.severity}</span>
              <div className="voltage-status">{result.status}</div>
              {result.referencePercent !== null && <div className="voltage-command">
                <p><strong>{Number(result.referencePercent.toFixed(1))}%</strong> 0-10 VDC speed command</p>
                <meter min="0" max="100" value={result.referencePercent} aria-label="VFD speed reference percent" />
              </div>}
              {result.severity === "Stop" && <div className="voltage-warning"><TriangleAlert aria-hidden="true" /><strong>Stop and identify the active drive fault before restarting.</strong></div>}
              <p>{result.summary}</p>
              <div className="voltage-checks"><h3>Best diagnostic path</h3>
                <ol>{result.checks.map((check) => <li key={check}>{check}</li>)}</ol>
              </div>
            </div>
          </div>
          <div className="hvac-guidance">
            <h2>Field reminder</h2>
            <p>Do not change stored parameters until you confirm the drive mode, start input, enable circuit and reference signal. Record original settings before edits so the drive can be restored.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
