"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Fan, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { diagnoseRtuAhu, type ComplaintType, type FieldAnswer, type UnitType } from "@/lib/rtu-ahu-checkout";

const unitTypes: { value: UnitType; label: string }[] = [
  { value: "rtu", label: "RTU" },
  { value: "ahu", label: "AHU" },
];

const complaints: { value: ComplaintType; label: string }[] = [
  { value: "no-cooling", label: "No cooling / warm supply" },
  { value: "no-heating", label: "No heating / cold supply" },
  { value: "fan-not-running", label: "Fan not running" },
  { value: "poor-airflow", label: "Poor airflow" },
];

const answers: { value: FieldAnswer; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export default function RtuAhuCheckoutPage() {
  const [unitType, setUnitType] = useState<UnitType>("rtu");
  const [complaint, setComplaint] = useState<ComplaintType>("no-cooling");
  const [fanRunning, setFanRunning] = useState<FieldAnswer>("unknown");
  const [callPresent, setCallPresent] = useState<FieldAnswer>("unknown");
  const [safetyClosed, setSafetyClosed] = useState<FieldAnswer>("unknown");
  const [supplyTemp, setSupplyTemp] = useState("");
  const [returnTemp, setReturnTemp] = useState("");
  const result = diagnoseRtuAhu({ unitType, complaint, fanRunning, callPresent, safetyClosed, supplyTemp, returnTemp });
  const invalidReading = result.readingNote?.includes("decimal numbers") || false;

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
          <h1>RTU/AHU Checkout Tool</h1>
          <p>Use fan status, BAS call, safeties and air temperatures to choose the first diagnostic path.</p>
        </div></div>
        <section className="voltage-workspace hvac-tool-panels" aria-label="RTU/AHU checkout">
          <div className="hvac-tool-heading"><h2><Fan aria-hidden="true" className="voltage-icon" /> Unit readings</h2>
            <p>Enter what you know from the unit. Leave unknown items blank or unknown and the checklist will include them.</p>
          </div>
          <div className="hvac-calculator-grid">
            <div>
              <div className="hvac-field">
                <label htmlFor="unit-type">Unit type</label>
                <select id="unit-type" value={unitType} onChange={(event) => setUnitType(event.target.value as UnitType)}>
                  {unitTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="unit-complaint">Complaint</label>
                <select id="unit-complaint" value={complaint} onChange={(event) => setComplaint(event.target.value as ComplaintType)}>
                  {complaints.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="fan-running">Supply fan running?</label>
                <select id="fan-running" value={fanRunning} onChange={(event) => setFanRunning(event.target.value as FieldAnswer)}>
                  {answers.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="call-present">BAS call present?</label>
                <select id="call-present" value={callPresent} onChange={(event) => setCallPresent(event.target.value as FieldAnswer)}>
                  {answers.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="safety-closed">Safety chain closed?</label>
                <select id="safety-closed" value={safetyClosed} onChange={(event) => setSafetyClosed(event.target.value as FieldAnswer)}>
                  {answers.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="supply-temp">Supply air temp (F)</label>
                <Input id="supply-temp" type="text" inputMode="decimal" value={supplyTemp}
                  placeholder="e.g. 55" autoComplete="off" spellCheck={false}
                  onChange={(event) => setSupplyTemp(event.target.value)}
                  aria-invalid={invalidReading || undefined}
                  aria-describedby="temp-note" />
              </div>
              <div className="hvac-field">
                <label htmlFor="return-temp">Return air temp (F)</label>
                <Input id="return-temp" type="text" inputMode="decimal" value={returnTemp}
                  placeholder="e.g. 74" autoComplete="off" spellCheck={false}
                  onChange={(event) => setReturnTemp(event.target.value)}
                  aria-invalid={invalidReading || undefined}
                  aria-describedby="temp-note" />
                <small id="temp-note">{result.readingNote ?? "Use stabilized supply and return readings after the fan has been running."}</small>
              </div>
              <div className="hvac-actions">
                <Button type="button" variant="outline" onClick={() => { setComplaint("no-cooling"); setFanRunning("yes"); setCallPresent("yes"); setSafetyClosed("yes"); setSupplyTemp("55"); setReturnTemp("74"); }}>Good cooling example</Button>
                <Button type="button" variant="ghost" onClick={() => { setUnitType("rtu"); setComplaint("no-cooling"); setFanRunning("unknown"); setCallPresent("unknown"); setSafetyClosed("unknown"); setSupplyTemp(""); setReturnTemp(""); }}>Reset</Button>
              </div>
            </div>
            <div className="hvac-result" role="status" aria-live="polite" aria-atomic="true"
              data-out-of-range={result.severity === "Stop" || undefined}>
              <span>{result.severity}</span>
              <div className="voltage-status">{result.status}</div>
              {result.temperatureDelta !== null && <div className="voltage-command">
                <p><strong>{Number(result.temperatureDelta.toFixed(1))} F</strong> calculated air temperature delta</p>
                <meter min="0" max="80" value={Math.min(80, Math.max(0, Math.abs(result.temperatureDelta)))} aria-label="Air temperature delta" />
              </div>}
              {result.severity === "Stop" && <div className="voltage-warning"><TriangleAlert aria-hidden="true" /><strong>Resolve the open safety before forcing operation.</strong></div>}
              <p>{result.summary}</p>
              <div className="voltage-checks"><h3>Best diagnostic path</h3>
                <ol>{result.checks.map((check) => <li key={check}>{check}</li>)}</ol>
              </div>
            </div>
          </div>
          <div className="hvac-guidance">
            <h2>Field reminder</h2>
            <p>Prove fan operation before judging cooling or heating. Temperature split is useful only after airflow, mode command and safeties are confirmed.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
