"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gauge, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { convertSignal, signalRanges, type SignalRangeKey } from "@/lib/signal-converter";

const rangeOptions = Object.entries(signalRanges) as [SignalRangeKey, typeof signalRanges[SignalRangeKey]][];

function formatNumber(value: number) {
  return Number(value.toFixed(2));
}

export default function SignalConverterPage() {
  const [range, setRange] = useState<SignalRangeKey>("0-10v");
  const [reading, setReading] = useState("");
  const result = convertSignal(reading, range);
  const invalid = reading.trim() !== "" && result === null;
  const examples = useMemo(() => {
    const selected = signalRanges[range];
    return [selected.min, selected.min + (selected.max - selected.min) / 2, selected.max];
  }, [range]);

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
          <h1>Control Signal Converter</h1>
          <p>Convert field readings into command percent and matching 0-10 VDC, 2-10 VDC and 4-20 mA values.</p>
        </div></div>
        <section className="voltage-workspace hvac-tool-panels" aria-label="Control signal conversion">
          <div className="hvac-tool-heading"><h2><Gauge aria-hidden="true" className="voltage-icon" /> Signal reading</h2>
            <p>Select the signal type you are measuring, then enter the reading from the meter.</p>
          </div>
          <div className="hvac-calculator-grid">
            <div>
              <div className="hvac-field">
                <label htmlFor="signal-range">Signal range</label>
                <select id="signal-range" value={range} onChange={(event) => setRange(event.target.value as SignalRangeKey)}>
                  {rangeOptions.map(([key, option]) => <option key={key} value={key}>{option.label}</option>)}
                </select>
                <small>{signalRanges[range].hint}</small>
              </div>
              <div className="hvac-field">
                <label htmlFor="signal-reading">Measured reading ({signalRanges[range].unit})</label>
                <Input id="signal-reading" type="text" inputMode="decimal" value={reading}
                  placeholder={`e.g. ${signalRanges[range].min + (signalRanges[range].max - signalRanges[range].min) / 2}`}
                  autoComplete="off" spellCheck={false}
                  onChange={(event) => setReading(event.target.value)}
                  aria-invalid={invalid || undefined}
                  aria-describedby={invalid ? "signal-hint signal-error" : "signal-hint"} />
                {invalid && <small id="signal-error">Enter a finite decimal number, such as 5, 12 or 7.5.</small>}
              </div>
              <p id="signal-hint" className="voltage-hint">Out-of-range readings are accepted so the tool can flag wiring or configuration problems.</p>
              <div className="hvac-actions" aria-label="Example signal readings">
                {examples.map((value) => <Button key={value} type="button" variant="outline"
                  onClick={() => setReading(String(formatNumber(value)))}>{formatNumber(value)} {signalRanges[range].unit}</Button>)}
                <Button type="button" variant="ghost" onClick={() => setReading("")}>Clear reading</Button>
              </div>
            </div>
            <div className="hvac-result" role="status" aria-live="polite" aria-atomic="true"
              data-out-of-range={result?.status !== "Valid signal" && result !== null || undefined}>
              <span>Signal conversion</span>
              <div className="voltage-status">{result?.status ?? (invalid ? "Invalid reading" : "Awaiting reading")}</div>
              {result ? <><p className="voltage-value">{formatNumber(result.value)} {result.unit}</p>
                {result.warning && <div className="voltage-warning"><TriangleAlert aria-hidden="true" /><strong>{result.warning}</strong></div>}
                <div className="voltage-command">
                  <p><strong>{formatNumber(result.clampedPercent)}%</strong> command reference</p>
                  <meter min="0" max="100" value={result.clampedPercent} aria-label="Signal command percent" />
                  <p>{formatNumber(result.percent)}% raw span from {result.label}. Out-of-range readings are clamped only for equivalent signal display.</p>
                </div>
                <div className="hvac-guidance">
                  <h2>Equivalent signals</h2>
                  <dl className="voltage-ranges">
                    <div><dt>0-10 VDC</dt><dd>{formatNumber(result.equivalents.zeroToTenV)} V</dd></div>
                    <div><dt>2-10 VDC</dt><dd>{formatNumber(result.equivalents.twoToTenV)} V</dd></div>
                    <div><dt>4-20 mA</dt><dd>{formatNumber(result.equivalents.fourToTwentyMa)} mA</dd></div>
                  </dl>
                </div></>
                : <p>{invalid ? "Enter a valid number to convert the signal." : "Enter a reading or choose an example to see the conversion."}</p>}
            </div>
          </div>
          <div className="hvac-guidance">
            <h2>Field reminder</h2>
            <p>Voltage signals are normally measured from signal output to signal common. Current loop signals are measured in series with the loop using the correct meter jack and setting. Confirm the controller and receiver use the same signal range before changing wiring or parameters.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
