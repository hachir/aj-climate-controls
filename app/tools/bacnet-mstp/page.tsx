"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Cable, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { diagnoseMstp, type FieldAnswer, type MstpSymptom, type TerminationAnswer } from "@/lib/bacnet-mstp";

const symptoms: { value: MstpSymptom; label: string }[] = [
  { value: "all-offline", label: "All devices offline" },
  { value: "one-offline", label: "One device offline" },
  { value: "intermittent", label: "Intermittent communication" },
  { value: "slow-token", label: "Slow network / token retries" },
];

const answers: { value: FieldAnswer; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const terminations: { value: TerminationAnswer; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
];

export default function BacnetMstpPage() {
  const [symptom, setSymptom] = useState<MstpSymptom>("all-offline");
  const [idleBiasVoltage, setIdleBiasVoltage] = useState("");
  const [terminationCount, setTerminationCount] = useState<TerminationAnswer>("unknown");
  const [baudMatches, setBaudMatches] = useState<FieldAnswer>("unknown");
  const [duplicateMac, setDuplicateMac] = useState<FieldAnswer>("unknown");
  const result = diagnoseMstp({ symptom, idleBiasVoltage, terminationCount, baudMatches, duplicateMac });
  const invalidReading = result.readingNote?.includes("decimal number") || false;

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
          <h1>BACnet MS/TP Checkout Tool</h1>
          <p>Use a field symptom and quick readings to choose the safest first checks on an RS-485 MS/TP trunk.</p>
        </div></div>
        <section className="voltage-workspace hvac-tool-panels" aria-label="BACnet MS/TP checkout">
          <div className="hvac-tool-heading"><h2><Cable aria-hidden="true" className="voltage-icon" /> Trunk symptoms</h2>
            <p>Enter what you know now. Leave unknown items as unknown and the tool will include them in the checklist.</p>
          </div>
          <div className="hvac-calculator-grid">
            <div>
              <div className="hvac-field">
                <label htmlFor="mstp-symptom">Symptom</label>
                <select id="mstp-symptom" value={symptom} onChange={(event) => setSymptom(event.target.value as MstpSymptom)}>
                  {symptoms.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="mstp-bias">Idle differential voltage across + and -</label>
                <Input id="mstp-bias" type="text" inputMode="decimal" value={idleBiasVoltage}
                  placeholder="optional, e.g. 0.4" autoComplete="off" spellCheck={false}
                  onChange={(event) => setIdleBiasVoltage(event.target.value)}
                  aria-invalid={invalidReading || undefined}
                  aria-describedby="mstp-bias-note" />
                <small id="mstp-bias-note">{result.readingNote ?? "Measure during a quiet moment on the trunk if possible."}</small>
              </div>
              <div className="hvac-field">
                <label htmlFor="mstp-termination">How many terminations are enabled?</label>
                <select id="mstp-termination" value={terminationCount} onChange={(event) => setTerminationCount(event.target.value as TerminationAnswer)}>
                  {terminations.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="mstp-baud">Baud rate matches on all devices?</label>
                <select id="mstp-baud" value={baudMatches} onChange={(event) => setBaudMatches(event.target.value as FieldAnswer)}>
                  {answers.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="mstp-duplicate">Any duplicate MAC address found?</label>
                <select id="mstp-duplicate" value={duplicateMac} onChange={(event) => setDuplicateMac(event.target.value as FieldAnswer)}>
                  {answers.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-actions">
                <Button type="button" variant="outline" onClick={() => { setIdleBiasVoltage("0.05"); setTerminationCount("1"); setBaudMatches("unknown"); setDuplicateMac("unknown"); }}>Weak trunk example</Button>
                <Button type="button" variant="ghost" onClick={() => { setSymptom("all-offline"); setIdleBiasVoltage(""); setTerminationCount("unknown"); setBaudMatches("unknown"); setDuplicateMac("unknown"); }}>Reset</Button>
              </div>
            </div>
            <div className="hvac-result" role="status" aria-live="polite" aria-atomic="true"
              data-out-of-range={result.severity === "Critical" || undefined}>
              <span>{result.severity}</span>
              <div className="voltage-status">{result.status}</div>
              {result.severity === "Critical" && <div className="voltage-warning"><TriangleAlert aria-hidden="true" /><strong>Fix this before leaving the trunk in service.</strong></div>}
              <p>{result.summary}</p>
              <div className="voltage-checks"><h3>Best diagnostic path</h3>
                <ol>{result.checks.map((check) => <li key={check}>{check}</li>)}</ol>
              </div>
            </div>
          </div>
          <div className="hvac-guidance">
            <h2>Field reminder</h2>
            <p>MS/TP is polarity-sensitive RS-485. Keep the daisy chain clean, avoid star wiring and long stubs, terminate only at the two physical ends and keep shield/drain practice consistent with the project standard.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
