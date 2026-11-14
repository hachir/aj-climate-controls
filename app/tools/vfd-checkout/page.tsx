"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Settings2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildVfdReport, diagnoseVfdCheckout, driveFamilyLabels, driveModeLabels, fieldAnswerLabels, type DriveFamily, type DriveMode, type FieldAnswer, type VfdReportDetails } from "@/lib/vfd-checkout";

const blankDetails: VfdReportDetails = { project: "", equipment: "", testDate: "", faultCode: "", notes: "", example: false };
const reportFields = [
  { key: "project", label: "Site / project", type: "text" },
  { key: "equipment", label: "Equipment / drive tag", type: "text" },
  { key: "testDate", label: "Test date", type: "date" },
  { key: "faultCode", label: "Fault or alarm code", type: "text" },
] as const;

export default function VfdCheckoutPage() {
  const [driveFamily, setDriveFamily] = useState<DriveFamily>("yaskawa-j1000");
  const [mode, setMode] = useState<DriveMode>("unknown");
  const [runCommand, setRunCommand] = useState<FieldAnswer>("unknown");
  const [speedReference, setSpeedReference] = useState("");
  const [faulted, setFaulted] = useState<FieldAnswer>("unknown");
  const [permissiveClosed, setPermissiveClosed] = useState<FieldAnswer>("unknown");
  const [details, setDetails] = useState(blankDetails);
  const [copyStatus, setCopyStatus] = useState("");
  const reportRef = useRef<HTMLTextAreaElement>(null);
  const copyAttempt = useRef(0);
  const input = { driveFamily, mode, runCommand, speedReference, faulted, permissiveClosed };
  const result = diagnoseVfdCheckout(input);
  const report = buildVfdReport(input, details);
  const invalidReading = result.readingNote?.includes("decimal voltage") || false;

  function clearCopyStatus() {
    copyAttempt.current += 1;
    setCopyStatus("");
  }

  async function copyReport() {
    const attempt = ++copyAttempt.current;
    try {
      await navigator.clipboard.writeText(report);
      if (attempt === copyAttempt.current) setCopyStatus("Report copied. Paste it into your work order or field notes.");
    } catch {
      if (attempt !== copyAttempt.current) return;
      reportRef.current?.focus();
      reportRef.current?.select();
      setCopyStatus("Automatic copy unavailable. Select or copy the text from the report preview.");
    }
  }

  function loadExample() {
    clearCopyStatus();
    setMode("auto");
    setRunCommand("yes");
    setSpeedReference("4.8");
    setFaulted("no");
    setPermissiveClosed("yes");
    setDetails((current) => ({ ...current, example: true }));
  }

  function reset() {
    clearCopyStatus();
    setDriveFamily("yaskawa-j1000");
    setMode("unknown");
    setRunCommand("unknown");
    setSpeedReference("");
    setFaulted("unknown");
    setPermissiveClosed("unknown");
    setDetails(blankDetails);
  }

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
          <p>Record drive observations, review the command path and copy a field report.</p>
        </div></div>
        <section className="voltage-workspace hvac-tool-panels" aria-label="VFD checkout" onChange={clearCopyStatus}>
          <div className="hvac-tool-heading"><h2><Settings2 aria-hidden="true" className="voltage-icon" /> Drive readings</h2>
            <p>Use this before changing parameters. It keeps the first checks focused on command, reference and safety circuits.</p>
          </div>
          <div className="hvac-calculator-grid">
            <div>
              <div className="hvac-field">
                <label htmlFor="vfd-family">Drive family</label>
                <select id="vfd-family" value={driveFamily} onChange={(event) => setDriveFamily(event.target.value as DriveFamily)}>
                  {Object.entries(driveFamilyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="vfd-mode">Keypad mode</label>
                <select id="vfd-mode" value={mode} onChange={(event) => setMode(event.target.value as DriveMode)}>
                  {Object.entries(driveModeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="vfd-run">Run command present at drive?</label>
                <select id="vfd-run" value={runCommand} onChange={(event) => setRunCommand(event.target.value as FieldAnswer)}>
                  {Object.entries(fieldAnswerLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="vfd-reference">Speed reference at drive input (VDC)</label>
                <Input id="vfd-reference" type="text" inputMode="decimal" value={speedReference}
                  placeholder="optional, e.g. 4.8" autoComplete="off" spellCheck={false} maxLength={40}
                  onChange={(event) => setSpeedReference(event.target.value)}
                  aria-invalid={invalidReading || undefined}
                  aria-describedby="vfd-reference-note" />
                <small id="vfd-reference-note">{result.readingNote ?? "Enter an observed reading only for a configured direct 0–10 VDC input."}</small>
              </div>
              <div className="hvac-field">
                <label htmlFor="vfd-fault">Fault or alarm active?</label>
                <select id="vfd-fault" value={faulted} onChange={(event) => setFaulted(event.target.value as FieldAnswer)}>
                  {Object.entries(fieldAnswerLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="vfd-permissive">Safety/permissive circuit closed?</label>
                <select id="vfd-permissive" value={permissiveClosed} onChange={(event) => setPermissiveClosed(event.target.value as FieldAnswer)}>
                  {Object.entries(fieldAnswerLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="hvac-actions">
                <Button type="button" variant="outline" onClick={loadExample}>Load Auto example</Button>
                <Button type="button" variant="ghost" onClick={reset}>Reset checkout</Button>
              </div>
            </div>
            <div className="hvac-result" role="status" aria-live="polite" aria-atomic="true"
              data-out-of-range={result.severity === "Stop" || undefined}>
              <span>{result.severity}</span>
              <div className="voltage-status">{result.status}</div>
              {result.referencePercent !== null && <div className="voltage-command">
                <p><strong>{Number(result.referencePercent.toFixed(1))}%</strong> of direct 0–10 VDC span (not motor speed)</p>
                <meter min="0" max="100" value={result.referencePercent} aria-label="VFD speed reference percent" />
              </div>}
              {result.severity === "Stop" && <div className="voltage-warning"><TriangleAlert aria-hidden="true" /><strong>Do not reset or restart based on this screen.</strong></div>}
              <p>{result.summary}</p>
              <div className="voltage-checks"><h3>Best diagnostic path</h3>
                <ol>{result.checks.map((check) => <li key={check}>{check}</li>)}</ol>
              </div>
            </div>
          </div>
          <section className="hvac-guidance space-y-4" aria-labelledby="vfd-report-heading">
            <div>
              <h2 id="vfd-report-heading">VFD field checkout report</h2>
              <p>Enter optional job details and copy the report into your work order. Entries stay on this page until reset or reload; nothing is submitted by this tool.</p>
            </div>
            {details.example && <p role="status"><strong>Example only.</strong> Reset the checkout before recording an actual test.</p>}
            <div className="hvac-fields">
              {reportFields.map(({ key, label, type }) => <div className="hvac-field" key={key}>
                <label htmlFor={`vfd-report-${key}`}>{label}</label>
                <Input id={`vfd-report-${key}`} type={type} value={details[key]} maxLength={type === "text" ? 100 : undefined}
                  autoComplete="off" onChange={(event) => setDetails((current) => ({ ...current, [key]: event.target.value }))} />
              </div>)}
            </div>
            <div className="hvac-field">
              <label htmlFor="vfd-report-notes">Technician notes / follow-up</label>
              <Textarea id="vfd-report-notes" rows={3} maxLength={1500} value={details.notes}
                placeholder="Example: recorded the drive display; check approved sequence before follow-up."
                onChange={(event) => setDetails((current) => ({ ...current, notes: event.target.value }))} />
            </div>
            <div className="hvac-field">
              <label htmlFor="vfd-report-preview">Report preview</label>
              <Textarea ref={reportRef} id="vfd-report-preview" className="field-sizing-fixed font-mono" rows={10} readOnly value={report} />
            </div>
            <div className="hvac-actions"><Button type="button" onClick={copyReport}><Copy aria-hidden="true" /> Copy field report</Button></div>
            <p role="status" aria-live="polite">{copyStatus}</p>
          </section>
          <div className="hvac-guidance">
            <h2>Field reminder</h2>
            <p>This tool records observations only. Follow the drive manual and your site’s hazardous-energy control procedures before servicing. Do not bypass a safety circuit or use this result to authorize a restart.</p>
            <p><a href="https://www.osha.gov/control-hazardous-energy/">OSHA hazardous-energy reference</a>{driveFamily === "yaskawa-j1000" && <> · <a href="https://www.yaskawa.com/downloads/search-index/details?docnum=SIEPC71060631&amp;showType=details">Yaskawa J1000 technical manual</a></>}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
