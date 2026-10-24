"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TriangleAlert, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { diagnoseHydronicTerminal, type FieldAnswer, type TerminalType } from "@/lib/hydronic-terminal-checkout";

const answers: { value: FieldAnswer; label: string }[] = [
  { value: "unknown", label: "Unknown / not checked" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const terminals: { value: TerminalType; label: string }[] = [
  { value: "unit-heater", label: "Unit heater" },
  { value: "fan-coil", label: "Fan coil" },
  { value: "fin-tube", label: "Fin-tube / baseboard" },
];

export default function HydronicTerminalCheckoutPage() {
  const [terminalType, setTerminalType] = useState<TerminalType>("unit-heater");
  const [callForHeat, setCallForHeat] = useState<FieldAnswer>("unknown");
  const [hotWaterAvailable, setHotWaterAvailable] = useState<FieldAnswer>("unknown");
  const [valveCommand, setValveCommand] = useState<FieldAnswer>("unknown");
  const [actuatorOpen, setActuatorOpen] = useState<FieldAnswer>("unknown");
  const [waterFlow, setWaterFlow] = useState<FieldAnswer>("unknown");
  const [fanRunning, setFanRunning] = useState<FieldAnswer>("unknown");
  const [spaceWarming, setSpaceWarming] = useState<FieldAnswer>("unknown");
  const result = diagnoseHydronicTerminal({ terminalType, callForHeat, hotWaterAvailable, valveCommand, actuatorOpen, waterFlow, fanRunning, spaceWarming });
  const usesFan = terminalType !== "fin-tube";

  const reset = () => {
    setTerminalType("unit-heater"); setCallForHeat("unknown"); setHotWaterAvailable("unknown");
    setValveCommand("unknown"); setActuatorOpen("unknown"); setWaterFlow("unknown");
    setFanRunning("unknown"); setSpaceWarming("unknown");
  };

  const fields: [string, string, FieldAnswer, (value: FieldAnswer) => void][] = [
    ["heat-call", "Thermostat/controller calling for heat?", callForHeat, setCallForHeat],
    ["hot-water", "Hot water available at terminal supply?", hotWaterAvailable, setHotWaterAvailable],
    ["valve-command", "Controller commanding valve open?", valveCommand, setValveCommand],
    ["actuator-open", "Actuator and valve actually open?", actuatorOpen, setActuatorOpen],
    ["water-flow", "Water flow established through terminal?", waterFlow, setWaterFlow],
    ["space-warming", "Terminal is delivering heat to space?", spaceWarming, setSpaceWarming],
  ];

  return <main className="dashboard-app">
    <header className="main-navbar"><div className="navbar-inner hvac-navbar">
      <Link className="dashboard-brand" href="/" aria-label="AJ Climate Controls dashboard"><img className="brand-mark" src="/logo-mark.svg" alt="" width="48" height="48" /><div><strong>AJ Climate</strong><small>Operations Dashboard</small></div></Link>
      <Link className="hvac-back-link" href="/tools"><ArrowLeft aria-hidden="true" /><span>Back to tools</span></Link>
    </div></header>
    <div className="dashboard-content hvac-page voltage-page">
      <div className="page-heading"><div><span className="page-eyebrow">Service toolkit</span><h1>Hydronic Terminal Checkout Tool</h1><p>Trace heat demand, hot water, valve operation, flow and heat delivery at unit heaters, fan coils and fin-tube.</p></div></div>
      <section className="voltage-workspace hvac-tool-panels" aria-label="Hydronic terminal checkout">
        <div className="hvac-tool-heading"><h2><Waves aria-hidden="true" className="voltage-icon" /> Heating path</h2><p>Start at the thermostat and follow the sequence to the terminal instead of changing several components at once.</p></div>
        <div className="hvac-calculator-grid"><div>
          <div className="hvac-field"><label htmlFor="terminal-type">Terminal type</label><select id="terminal-type" value={terminalType} onChange={(event) => setTerminalType(event.target.value as TerminalType)}>{terminals.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
          {fields.map(([id, label, value, setter]) => <div className="hvac-field" key={id}><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={(event) => setter(event.target.value as FieldAnswer)}>{answers.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>)}
          {usesFan && <div className="hvac-field"><label htmlFor="fan-running">Terminal fan running?</label><select id="fan-running" value={fanRunning} onChange={(event) => setFanRunning(event.target.value as FieldAnswer)}>{answers.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>}
          <div className="hvac-actions"><Button type="button" variant="outline" onClick={() => { setCallForHeat("yes"); setHotWaterAvailable("yes"); setValveCommand("yes"); setActuatorOpen("yes"); setWaterFlow("yes"); setFanRunning("yes"); setSpaceWarming("yes"); }}>Working example</Button><Button type="button" variant="ghost" onClick={reset}>Reset</Button></div>
        </div>
        <div className="hvac-result" role="status" aria-live="polite" aria-atomic="true" data-out-of-range={result.severity === "Warning" || undefined}>
          <span>{result.severity}</span><div className="voltage-status">{result.status}</div>
          {result.severity === "Warning" && <div className="voltage-warning"><TriangleAlert aria-hidden="true" /><strong>Correct the first failed step before adjusting downstream components.</strong></div>}
          <p>{result.summary}</p><div className="voltage-checks"><h3>Best diagnostic path</h3><ol>{result.checks.map((check) => <li key={check}>{check}</li>)}</ol></div>
        </div></div>
        <div className="hvac-guidance"><h2>Field reminder</h2><p>Confirm isolation and balancing valves are open after service. Use measured pipe and air temperatures, and allow the system time to stabilize before deciding that heat delivery is low.</p></div>
      </section>
    </div>
  </main>;
}
