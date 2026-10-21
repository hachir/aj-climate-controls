"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Flame, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { diagnoseBoilerIgnition, type BoilerRole, type FieldAnswer } from "@/lib/boiler-ignition-checkout";

const answers: { value: FieldAnswer; label: string }[] = [
  { value: "unknown", label: "Unknown / not observed" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const roles: { value: BoilerRole; label: string }[] = [
  { value: "leader", label: "Cascade leader" },
  { value: "member", label: "Cascade member" },
  { value: "standalone", label: "Standalone boiler" },
];

export default function BoilerIgnitionCheckoutPage() {
  const [role, setRole] = useState<BoilerRole>("member");
  const [enablePresent, setEnablePresent] = useState<FieldAnswer>("unknown");
  const [callForHeat, setCallForHeat] = useState<FieldAnswer>("unknown");
  const [lockoutActive, setLockoutActive] = useState<FieldAnswer>("unknown");
  const [prePurgeObserved, setPrePurgeObserved] = useState<FieldAnswer>("unknown");
  const [ignitionAttemptObserved, setIgnitionAttemptObserved] = useState<FieldAnswer>("unknown");
  const [flameProven, setFlameProven] = useState<FieldAnswer>("unknown");
  const [gasPressureVerified, setGasPressureVerified] = useState<FieldAnswer>("unknown");
  const result = diagnoseBoilerIgnition({ role, enablePresent, callForHeat, lockoutActive, prePurgeObserved, ignitionAttemptObserved, flameProven, gasPressureVerified });

  const reset = () => {
    setRole("member"); setEnablePresent("unknown"); setCallForHeat("unknown"); setLockoutActive("unknown");
    setPrePurgeObserved("unknown"); setIgnitionAttemptObserved("unknown"); setFlameProven("unknown"); setGasPressureVerified("unknown");
  };

  return <main className="dashboard-app">
    <header className="main-navbar"><div className="navbar-inner hvac-navbar">
      <Link className="dashboard-brand" href="/" aria-label="AJ Climate Controls dashboard">
        <img className="brand-mark" src="/logo-mark.svg" alt="" width="48" height="48" />
        <div><strong>AJ Climate</strong><small>Operations Dashboard</small></div>
      </Link>
      <Link className="hvac-back-link" href="/tools"><ArrowLeft aria-hidden="true" /><span>Back to tools</span></Link>
    </div></header>
    <div className="dashboard-content hvac-page voltage-page">
      <div className="page-heading"><div><span className="page-eyebrow">Service toolkit</span>
        <h1>Boiler Ignition Checkout Tool</h1>
        <p>Follow enable, demand, pre-purge, ignition and flame proving to identify the first failed step.</p>
      </div></div>
      <section className="voltage-workspace hvac-tool-panels" aria-label="Boiler ignition checkout">
        <div className="hvac-tool-heading"><h2><Flame aria-hidden="true" className="voltage-icon" /> Ignition sequence</h2>
          <p>Observe one controlled cycle. Use the exact manufacturer manual and qualified combustion personnel for fuel adjustments.</p>
        </div>
        <div className="hvac-calculator-grid"><div>
          <div className="hvac-field"><label htmlFor="boiler-role">Boiler role</label><select id="boiler-role" value={role} onChange={(event) => setRole(event.target.value as BoilerRole)}>{roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
          {([
            ["enable-present", "Enable/interlock satisfied at boiler?", enablePresent, setEnablePresent],
            ["heat-call", "Controller shows a call for heat?", callForHeat, setCallForHeat],
            ["lockout-active", "Lockout active?", lockoutActive, setLockoutActive],
            ["pre-purge", "Pre-purge / combustion blower observed?", prePurgeObserved, setPrePurgeObserved],
            ["ignition-attempt", "Spark / ignition attempt observed?", ignitionAttemptObserved, setIgnitionAttemptObserved],
            ["flame-proven", "Flame established and proven?", flameProven, setFlameProven],
            ["gas-pressure", "Gas pressure verified under firing load?", gasPressureVerified, setGasPressureVerified],
          ] as const).map(([id, label, value, setter]) => <div className="hvac-field" key={id}><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={(event) => setter(event.target.value as FieldAnswer)}>{answers.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>)}
          <div className="hvac-actions">
            <Button type="button" variant="outline" onClick={() => { setEnablePresent("yes"); setCallForHeat("yes"); setLockoutActive("yes"); setPrePurgeObserved("yes"); setIgnitionAttemptObserved("yes"); setFlameProven("no"); setGasPressureVerified("unknown"); }}>Flame failure example</Button>
            <Button type="button" variant="ghost" onClick={reset}>Reset</Button>
          </div>
        </div>
        <div className="hvac-result" role="status" aria-live="polite" aria-atomic="true" data-out-of-range={result.severity === "Stop" || undefined}>
          <span>{result.severity}</span><div className="voltage-status">{result.status}</div>
          {result.severity === "Stop" && <div className="voltage-warning"><TriangleAlert aria-hidden="true" /><strong>Do not bypass safeties or make unverified gas adjustments.</strong></div>}
          <p>{result.summary}</p>
          <div className="voltage-checks"><h3>Best diagnostic path</h3><ol>{result.checks.map((check) => <li key={check}>{check}</li>)}</ol></div>
        </div></div>
        <div className="hvac-guidance"><h2>Safety reminder</h2><p>Record the exact fault before reset. Gas pressure and combustion settings are model-specific and must be measured under load by qualified personnel using the manufacturer procedure.</p></div>
      </section>
    </div>
  </main>;
}
