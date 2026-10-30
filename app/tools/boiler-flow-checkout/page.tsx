"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gauge, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { diagnoseBoilerFlow, type FieldAnswer } from "@/lib/boiler-flow-checkout";

const answers: { value: FieldAnswer; label: string }[] = [
  { value: "unknown", label: "Unknown / not checked" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export default function BoilerFlowCheckoutPage() {
  const [callForHeat, setCallForHeat] = useState<FieldAnswer>("unknown");
  const [boilerFiring, setBoilerFiring] = useState<FieldAnswer>("unknown");
  const [pumpCommand, setPumpCommand] = useState<FieldAnswer>("unknown");
  const [pumpRunning, setPumpRunning] = useState<FieldAnswer>("unknown");
  const [isolationValvesOpen, setIsolationValvesOpen] = useState<FieldAnswer>("unknown");
  const [flowProven, setFlowProven] = useState<FieldAnswer>("unknown");
  const [highLimitActive, setHighLimitActive] = useState<FieldAnswer>("unknown");
  const [supplyTemp, setSupplyTemp] = useState("");
  const [returnTemp, setReturnTemp] = useState("");
  const result = diagnoseBoilerFlow({ callForHeat, boilerFiring, pumpCommand, pumpRunning, isolationValvesOpen, flowProven, highLimitActive, supplyTemp, returnTemp });
  const invalidReading = result.readingNote?.includes("decimal numbers") || false;

  const fields: [string, string, FieldAnswer, (value: FieldAnswer) => void][] = [
    ["heat-call", "Boiler/cascade has a call for heat?", callForHeat, setCallForHeat],
    ["boiler-firing", "Boiler firing and flame proven?", boilerFiring, setBoilerFiring],
    ["pump-command", "Circulation pump commanded on?", pumpCommand, setPumpCommand],
    ["pump-running", "Pump actually running?", pumpRunning, setPumpRunning],
    ["valves-open", "Required isolation valves open?", isolationValvesOpen, setIsolationValvesOpen],
    ["flow-proven", "Water flow through boiler proven?", flowProven, setFlowProven],
    ["high-limit", "High-limit / over-temperature lockout active?", highLimitActive, setHighLimitActive],
  ];

  const reset = () => {
    setCallForHeat("unknown"); setBoilerFiring("unknown"); setPumpCommand("unknown"); setPumpRunning("unknown");
    setIsolationValvesOpen("unknown"); setFlowProven("unknown"); setHighLimitActive("unknown"); setSupplyTemp(""); setReturnTemp("");
  };

  return <main className="dashboard-app">
    <header className="main-navbar"><div className="navbar-inner hvac-navbar">
      <Link className="dashboard-brand" href="/" aria-label="AJ Climate Controls dashboard"><img className="brand-mark" src="/logo-mark.svg" alt="" width="48" height="48" /><div><strong>AJ Climate</strong><small>Operations Dashboard</small></div></Link>
      <Link className="hvac-back-link" href="/tools"><ArrowLeft aria-hidden="true" /><span>Back to tools</span></Link>
    </div></header>
    <div className="dashboard-content hvac-page voltage-page">
      <div className="page-heading"><div><span className="page-eyebrow">Service toolkit</span><h1>Boiler Flow Checkout Tool</h1><p>Separate controls, pump, valve, circulation and temperature-sensor problems before resetting a flow or high-limit lockout.</p></div></div>
      <section className="voltage-workspace hvac-tool-panels" aria-label="Boiler flow checkout">
        <div className="hvac-tool-heading"><h2><Gauge aria-hidden="true" className="voltage-icon" /> Water circulation</h2><p>Follow the water path in order. Pump sound or a normal system temperature alone does not prove flow through the boiler.</p></div>
        <div className="hvac-calculator-grid"><div>
          {fields.map(([id, label, value, setter]) => <div className="hvac-field" key={id}><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={(event) => setter(event.target.value as FieldAnswer)}>{answers.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>)}
          <div className="hvac-field"><label htmlFor="supply-temp">Boiler supply water temp (F)</label><Input id="supply-temp" type="text" inputMode="decimal" value={supplyTemp} placeholder="e.g. 140" autoComplete="off" spellCheck={false} onChange={(event) => setSupplyTemp(event.target.value)} aria-invalid={invalidReading || undefined} aria-describedby="water-temp-note" /></div>
          <div className="hvac-field"><label htmlFor="return-temp">Boiler return water temp (F)</label><Input id="return-temp" type="text" inputMode="decimal" value={returnTemp} placeholder="e.g. 125" autoComplete="off" spellCheck={false} onChange={(event) => setReturnTemp(event.target.value)} aria-invalid={invalidReading || undefined} aria-describedby="water-temp-note" /><small id="water-temp-note">{result.readingNote ?? "Use measured pipe temperatures after circulation is established."}</small></div>
          <div className="hvac-actions"><Button type="button" variant="outline" onClick={() => { setCallForHeat("yes"); setBoilerFiring("yes"); setPumpCommand("yes"); setPumpRunning("yes"); setIsolationValvesOpen("yes"); setFlowProven("no"); setHighLimitActive("yes"); setSupplyTemp("140"); setReturnTemp("125"); }}>Flow lockout example</Button><Button type="button" variant="ghost" onClick={reset}>Reset</Button></div>
        </div>
        <div className="hvac-result" role="status" aria-live="polite" aria-atomic="true" data-out-of-range={result.severity === "Stop" || undefined}>
          <span>{result.severity}</span><div className="voltage-status">{result.status}</div>
          {result.temperatureDelta !== null && <div className="voltage-command"><p><strong>{result.temperatureDelta} F</strong> supply minus return</p></div>}
          {result.severity === "Stop" && <div className="voltage-warning"><TriangleAlert aria-hidden="true" /><strong>Do not continue firing until circulation and safeties are proven.</strong></div>}
          <p>{result.summary}</p><div className="voltage-checks"><h3>Best diagnostic path</h3><ol>{result.checks.map((check) => <li key={check}>{check}</li>)}</ol></div>
        </div></div>
        <div className="hvac-guidance"><h2>Field reminder</h2><p>A boiler limit sensor may see a local hot spot even when another display is below the limit. Record the exact fault and sensor reading, then prove circulation before resetting.</p></div>
      </section>
    </div>
  </main>;
}
