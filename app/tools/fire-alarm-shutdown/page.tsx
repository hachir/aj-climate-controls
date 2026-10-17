"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Siren, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildFireAlarmReport, diagnoseFireAlarmShutdown, type ContactAction, type DriveMode, type FieldAnswer, type InputState } from "@/lib/fire-alarm-shutdown";

const contactActions: { value: ContactAction; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "opens-on-alarm", label: "Opens on alarm" },
  { value: "closes-on-alarm", label: "Closes on alarm" },
];

const inputStates: { value: InputState; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "on", label: "Input ON" },
  { value: "off", label: "Input OFF" },
];

const answers: { value: FieldAnswer; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const driveModes: { value: DriveMode; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "auto", label: "Auto / Remote" },
  { value: "hand", label: "Hand / Local" },
];

export default function FireAlarmShutdownPage() {
  const [contactAction, setContactAction] = useState<ContactAction>("unknown");
  const [normalInputState, setNormalInputState] = useState<InputState>("unknown");
  const [alarmInputState, setAlarmInputState] = useState<InputState>("unknown");
  const [shutdownObserved, setShutdownObserved] = useState<FieldAnswer>("unknown");
  const [allDrivesMatched, setAllDrivesMatched] = useState<FieldAnswer>("unknown");
  const [programmedInput, setProgrammedInput] = useState<FieldAnswer>("unknown");
  const [driveMode, setDriveMode] = useState<DriveMode>("unknown");
  const [details, setDetails] = useState({ site: "", equipment: "", technician: "", testDate: "", inputNumber: "", notes: "", example: false });
  const [copyStatus, setCopyStatus] = useState("");
  const reportRef = useRef<HTMLTextAreaElement>(null);
  const input = { contactAction, normalInputState, alarmInputState, shutdownObserved, allDrivesMatched, programmedInput, driveMode };
  const result = diagnoseFireAlarmShutdown(input);
  const report = buildFireAlarmReport(input, details);

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report);
      setCopyStatus("Report copied. Paste it into your field notes or email.");
    } catch {
      reportRef.current?.focus();
      reportRef.current?.select();
      setCopyStatus("Automatic copy is unavailable. The report is selected; copy it manually.");
    }
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
          <h1>Fire Alarm Shutdown Checkout Tool</h1>
          <p>Verify dry contact action, VFD input state, shutdown response and matching behavior across all drives.</p>
        </div></div>
        <section className="voltage-workspace hvac-tool-panels" aria-label="Fire alarm shutdown checkout">
          <div className="hvac-tool-heading"><h2><Siren aria-hidden="true" className="voltage-icon" /> Shutdown test</h2>
            <p>Use this during setup or a witnessed alarm test to separate wiring from programming.</p>
          </div>
          <div className="hvac-calculator-grid">
            <div>
              <div className="hvac-field">
                <label htmlFor="contact-action">Fire alarm dry contact action</label>
                <select id="contact-action" value={contactAction} onChange={(event) => setContactAction(event.target.value as ContactAction)}>
                  {contactActions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="normal-state">VFD input monitor in normal condition</label>
                <select id="normal-state" value={normalInputState} onChange={(event) => setNormalInputState(event.target.value as InputState)}>
                  {inputStates.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="alarm-state">VFD input monitor during alarm/test</label>
                <select id="alarm-state" value={alarmInputState} onChange={(event) => setAlarmInputState(event.target.value as InputState)}>
                  {inputStates.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="programmed-input">Dedicated VFD input programmed?</label>
                <select id="programmed-input" value={programmedInput} onChange={(event) => setProgrammedInput(event.target.value as FieldAnswer)}>
                  {answers.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="shutdown-observed">Drive shutdown observed during test?</label>
                <select id="shutdown-observed" value={shutdownObserved} onChange={(event) => setShutdownObserved(event.target.value as FieldAnswer)}>
                  {answers.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="all-drives">All VFDs responded the same?</label>
                <select id="all-drives" value={allDrivesMatched} onChange={(event) => setAllDrivesMatched(event.target.value as FieldAnswer)}>
                  {answers.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-field">
                <label htmlFor="drive-mode">Drive mode during test</label>
                <select id="drive-mode" value={driveMode} onChange={(event) => setDriveMode(event.target.value as DriveMode)}>
                  {driveModes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="hvac-actions">
                <Button type="button" variant="outline" onClick={() => { setDetails((current) => ({ ...current, example: true })); setCopyStatus(""); setContactAction("opens-on-alarm"); setNormalInputState("on"); setAlarmInputState("off"); setProgrammedInput("yes"); setShutdownObserved("yes"); setAllDrivesMatched("yes"); setDriveMode("auto"); }}>Verified test example</Button>
                <Button type="button" variant="ghost" onClick={() => { setDetails({ site: "", equipment: "", technician: "", testDate: "", inputNumber: "", notes: "", example: false }); setCopyStatus(""); setContactAction("unknown"); setNormalInputState("unknown"); setAlarmInputState("unknown"); setProgrammedInput("unknown"); setShutdownObserved("unknown"); setAllDrivesMatched("unknown"); setDriveMode("unknown"); }}>Reset</Button>
              </div>
            </div>
            <div className="hvac-result" role="status" aria-live="polite" aria-atomic="true"
              data-out-of-range={result.severity === "Stop" || undefined}>
              <span>{result.severity}</span>
              <div className="voltage-status">{result.status}</div>
              {result.severity === "Stop" && <div className="voltage-warning"><TriangleAlert aria-hidden="true" /><strong>Do not sign off until shutdown works on every required VFD.</strong></div>}
              <p>{result.summary}</p>
              <div className="voltage-checks"><h3>Best diagnostic path</h3>
                <ol>{result.checks.map((check) => <li key={check}>{check}</li>)}</ol>
              </div>
            </div>
          </div>
          <section className="hvac-guidance" aria-labelledby="field-report-heading" onChange={() => setCopyStatus("")}>
            <h2 id="field-report-heading">Field checkout report</h2>
            <p>Add the job details, then copy the report into your closeout notes. Details stay on this page until reset or reload.</p>
            {details.example && <p role="status">Example data is active. Reset before recording an actual field test.</p>}
            <div className="hvac-fields">
              {([
                ["site", "Site / project", "text"],
                ["equipment", "Equipment / VFD tags", "text"],
                ["technician", "Technician", "text"],
                ["testDate", "Test date", "date"],
                ["inputNumber", "VFD input / terminal numbers", "text"],
              ] as const).map(([key, label, type]) => <div className="hvac-field" key={key}>
                <label htmlFor={`report-${key}`}>{label}</label>
                <input id={`report-${key}`} type={type} value={details[key]} onChange={(event) => setDetails((current) => ({ ...current, [key]: event.target.value }))} />
              </div>)}
              <div className="hvac-field">
                <label htmlFor="report-notes">Technician notes / outstanding work</label>
                <textarea id="report-notes" rows={4} value={details.notes} onChange={(event) => setDetails((current) => ({ ...current, notes: event.target.value }))} style={{ width: "100%", padding: 12, border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
              </div>
            </div>
            <div className="hvac-field" style={{ marginTop: 20 }}>
              <label htmlFor="checkout-report">Report preview</label>
              <textarea ref={reportRef} id="checkout-report" readOnly value={report} rows={14} style={{ width: "100%", padding: 12, border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: 16 }} />
            </div>
            <div className="hvac-actions"><Button type="button" onClick={copyReport}>Copy field report</Button></div>
            <p role="status" aria-live="polite">{copyStatus}</p>
          </section>
          <div className="hvac-guidance">
            <h2>Field reminder</h2>
            <p>A dry contact should not bring external voltage from the fire alarm panel unless the design specifically calls for it. Prove the contact with a meter, then prove the VFD input monitor changes before changing drive logic.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
