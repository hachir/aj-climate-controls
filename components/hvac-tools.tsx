"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeftRight, Fan, Gauge, Snowflake, Thermometer, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  convertCapacity, convertTemperature, ductAirflow, isValidTemperature, readMeasurement,
  temperatureDifference, type CapacityUnit, type TemperatureTool, type TemperatureUnit,
} from "@/lib/hvac";

const format = (value: number, digits = 2) => new Intl.NumberFormat("en-US", {
  maximumFractionDigits: digits,
}).format(Object.is(value, -0) ? 0 : value);

const tools = [
  { id: "split", title: "Temperature split", subtitle: "Supply & return air", icon: Thermometer },
  { id: "superheat", title: "Superheat", subtitle: "Suction-side readings", icon: Gauge },
  { id: "subcooling", title: "Subcooling", subtitle: "Liquid-side readings", icon: Snowflake },
  { id: "airflow", title: "Duct airflow", subtitle: "Velocity & duct area", icon: Fan },
  { id: "capacity", title: "Capacity converter", subtitle: "BTU/h, tons & kW", icon: ArrowLeftRight },
] as const;

function NumberField({ id, label, value, onChange, min, invalid, hint }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  min?: number; invalid?: boolean; hint?: string;
}) {
  return (
    <div className="hvac-field">
      <label htmlFor={id}>{label}</label>
      <Input id={id} type="number" step="any" min={min} value={value} placeholder="Enter reading"
        onChange={(event) => onChange(event.target.value)} aria-invalid={invalid || undefined}
        aria-describedby={hint ? `${id}-hint` : undefined} />
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}

function Result({ label, value, unit, children }: {
  label: string; value: number | null; unit: string; children?: ReactNode;
}) {
  return (
    <div className="hvac-result" role="status" aria-live="polite" aria-atomic="true">
      <span>{label}</span>
      <div className="hvac-result-number">{value === null ? "—" : format(value)} <small>{unit}</small></div>
      {value === null ? <p>Enter valid readings to see the result.</p> : children}
    </div>
  );
}

const temperatureConfig = {
  split: {
    title: "Temperature split", description: "Compare return and supply dry-bulb temperatures.",
    labels: ["Return air", "Supply air"], example: [75, 55],
    note: "Compare the result with equipment specifications and current indoor conditions.",
    source: "https://www.fieldpiece.com/news-articles/lets-talk-airflow-the-often-overlooked-step-in-hvacr-diagnostics/",
    sourceLabel: "Fieldpiece measurement guidance",
  },
  superheat: {
    title: "Superheat", description: "Subtract the saturated vapor temperature from the suction-line temperature.",
    labels: ["Suction-line temperature", "Saturation temperature (dew)"], example: [52, 40],
    note: "Use the dew temperature from your refrigerant’s pressure–temperature chart at the measured suction pressure. Compare with the manufacturer’s charging procedure.",
    source: "https://www.se.com/us/en/faqs/FA168444/", sourceLabel: "Pressure–temperature chart guidance",
  },
  subcooling: {
    title: "Subcooling", description: "Subtract the liquid-line temperature from the saturated liquid temperature.",
    labels: ["Saturation temperature (bubble)", "Liquid-line temperature"], example: [105, 95],
    note: "Use the bubble temperature from your refrigerant’s pressure–temperature chart at the measured liquid-side pressure. Compare with the manufacturer’s charging procedure.",
    source: "https://www.se.com/us/en/faqs/FA168444/", sourceLabel: "Pressure–temperature chart guidance",
  },
} as const;

function TemperatureCalculator({ tool }: { tool: TemperatureTool }) {
  const config = temperatureConfig[tool];
  const [unit, setUnit] = useState<TemperatureUnit>("F");
  const [mode, setMode] = useState<"cooling" | "heating">("cooling");
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const a = readMeasurement(first);
  const b = readMeasurement(second);
  const invalidFirst = first !== "" && !isValidTemperature(a, unit);
  const invalidSecond = second !== "" && !isValidTemperature(b, unit);
  const value = temperatureDifference(tool, a, b, unit, mode);
  const formula = tool === "split" ? (mode === "cooling" ? "Return − supply" : "Supply − return") :
    tool === "superheat" ? "Suction line − saturation (dew)" : "Saturation (bubble) − liquid line";

  function changeUnit(next: TemperatureUnit) {
    const convert = (input: string) => {
      const parsed = readMeasurement(input);
      return parsed === null ? input : String(Number(convertTemperature(parsed, unit, next).toFixed(6)));
    };
    setFirst(convert(first)); setSecond(convert(second)); setUnit(next);
  }

  function loadExample() {
    const readings = tool === "split" && mode === "heating" ? [70, 115] : config.example;
    setFirst(String(Number(convertTemperature(readings[0], "F", unit).toFixed(6))));
    setSecond(String(Number(convertTemperature(readings[1], "F", unit).toFixed(6))));
  }

  return (
    <>
      <div className="hvac-tool-heading"><h2>{config.title}</h2><p>{config.description}</p></div>
      <div className="hvac-calculator-grid">
        <div>
          <div className="hvac-fields">
            <div className="hvac-field">
              <label htmlFor={`${tool}-unit`}>Temperature unit</label>
              <NativeSelect id={`${tool}-unit`} value={unit} onChange={(event) => changeUnit(event.target.value as TemperatureUnit)}>
                <option value="F">Fahrenheit (°F)</option><option value="C">Celsius (°C)</option>
              </NativeSelect>
            </div>
            {tool === "split" && <div className="hvac-field">
              <label htmlFor="split-mode">Operating mode</label>
              <NativeSelect id="split-mode" value={mode} onChange={(event) => setMode(event.target.value as "cooling" | "heating")}>
                <option value="cooling">Cooling</option><option value="heating">Heating</option>
              </NativeSelect>
            </div>}
            <NumberField id={`${tool}-first`} label={`${config.labels[0]} (°${unit})`} value={first} onChange={setFirst}
              min={unit === "F" ? -459.67 : -273.15} invalid={invalidFirst} hint={invalidFirst ? "Enter a temperature at or above absolute zero." : undefined} />
            <NumberField id={`${tool}-second`} label={`${config.labels[1]} (°${unit})`} value={second} onChange={setSecond}
              min={unit === "F" ? -459.67 : -273.15} invalid={invalidSecond} hint={invalidSecond ? "Enter a temperature at or above absolute zero." : undefined} />
          </div>
          <div className="hvac-actions"><Button type="button" variant="outline" onClick={loadExample}>Load example</Button>
            <Button type="button" variant="ghost" onClick={() => { setFirst(""); setSecond(""); }}>Clear readings</Button></div>
        </div>
        <Result label={tool === "split" ? (mode === "cooling" ? "Temperature drop" : "Temperature rise") : config.title} value={value} unit={`°${unit}`}>
          <p>{formula}</p>
          {value !== null && <p>{format(value * (unit === "F" ? 5 / 9 : 9 / 5))} °{unit === "F" ? "C" : "F"} difference</p>}
          {value !== null && value < 0 && <p className="hvac-reading-note">Negative result. Check the readings and measurement points.</p>}
        </Result>
      </div>
      <p className="hvac-guidance">{config.note} <a href={config.source} target="_blank" rel="noreferrer">{config.sourceLabel} ↗</a></p>
    </>
  );
}

function AirflowCalculator() {
  const [shape, setShape] = useState<"round" | "rectangular">("round");
  const [unit, setUnit] = useState<"imperial" | "metric">("imperial");
  const [velocity, setVelocity] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const result = ductAirflow(shape, unit, readMeasurement(velocity), readMeasurement(width), readMeasurement(height));
  const metric = unit === "metric";
  const fields = [
    { id: "velocity", label: `Average air velocity (${metric ? "m/s" : "ft/min"})`, value: velocity, set: setVelocity, positive: false },
    { id: "width", label: `${shape === "round" ? "Inside diameter" : "Inside width"} (${metric ? "mm" : "in"})`, value: width, set: setWidth, positive: true },
    ...(shape === "rectangular" ? [{ id: "height", label: `Inside height (${metric ? "mm" : "in"})`, value: height, set: setHeight, positive: true }] : []),
  ];

  function changeUnit(next: "imperial" | "metric") {
    if (unit === next) return;
    const convert = (input: string, factor: number) => {
      const parsed = readMeasurement(input);
      return parsed === null ? input : String(Number((parsed * factor).toFixed(6)));
    };
    setVelocity(convert(velocity, next === "metric" ? 0.00508 : 1 / 0.00508));
    setWidth(convert(width, next === "metric" ? 25.4 : 1 / 25.4));
    setHeight(convert(height, next === "metric" ? 25.4 : 1 / 25.4)); setUnit(next);
  }

  return <>
    <div className="hvac-tool-heading"><h2>Duct airflow</h2><p>Calculate volume flow from average air velocity and inside duct dimensions.</p></div>
    <div className="hvac-calculator-grid">
      <div><div className="hvac-fields">
        <div className="hvac-field"><label htmlFor="airflow-unit">Measurement units</label>
          <NativeSelect id="airflow-unit" value={unit} onChange={(event) => changeUnit(event.target.value as typeof unit)}>
            <option value="imperial">Imperial (in, ft/min)</option><option value="metric">Metric (mm, m/s)</option>
          </NativeSelect></div>
        <div className="hvac-field"><label htmlFor="airflow-shape">Duct shape</label>
          <NativeSelect id="airflow-shape" value={shape} onChange={(event) => setShape(event.target.value as typeof shape)}>
            <option value="round">Round</option><option value="rectangular">Rectangular</option>
          </NativeSelect></div>
        {fields.map((field) => {
          const parsed = readMeasurement(field.value);
          const invalid = field.value !== "" && (parsed === null || (field.positive ? parsed <= 0 : parsed < 0));
          return <NumberField key={field.id} id={`airflow-${field.id}`} label={field.label} value={field.value} onChange={field.set}
            min={0} invalid={invalid} hint={invalid ? (field.positive ? "Enter a dimension greater than zero." : "Enter a velocity of zero or greater.") : undefined} />;
        })}
      </div><div className="hvac-actions">
        <Button type="button" variant="outline" onClick={() => { setVelocity(metric ? "3.556" : "700"); setWidth(metric ? "304.8" : "12"); setHeight(metric ? "254" : "10"); }}>Load example</Button>
        <Button type="button" variant="ghost" onClick={() => { setVelocity(""); setWidth(""); setHeight(""); }}>Clear readings</Button>
      </div></div>
      <Result label="Estimated airflow" value={result?.cfm ?? null} unit="CFM">
        {result && <><p>{format(result.litersPerSecond)} L/s</p><p>Duct area: {format(result.area, 4)} {metric ? "m²" : "ft²"}</p><p>Airflow = average velocity × area</p></>}
      </Result>
    </div>
    <p className="hvac-guidance">Use an averaged duct traverse reading. For grilles and registers, use the manufacturer’s effective area instead of nominal dimensions. <a href="https://www.fluke.com/en-gb/learn/blog/hvac/measuring-air-velocity-with-the-fluke-975-airmeter-using-the-velocity-probe" target="_blank" rel="noreferrer">Fluke measurement guidance ↗</a></p>
  </>;
}

function CapacityCalculator() {
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<CapacityUnit>("btu");
  const result = convertCapacity(readMeasurement(value), unit);
  const invalid = value !== "" && result === null;
  return <>
    <div className="hvac-tool-heading"><h2>Capacity converter</h2><p>Convert heating or cooling capacity between BTU/h, refrigeration tons and thermal kW.</p></div>
    <div className="hvac-calculator-grid">
      <div><div className="hvac-fields">
        <div className="hvac-field"><label htmlFor="capacity-unit">Input unit</label>
          <NativeSelect id="capacity-unit" value={unit} onChange={(event) => {
            const next = event.target.value as CapacityUnit;
            if (result) setValue(String(Number(result[next].toFixed(6)))); setUnit(next);
          }}><option value="btu">BTU/h</option><option value="tons">Refrigeration tons</option><option value="kw">kW (thermal)</option></NativeSelect></div>
        <NumberField id="capacity-value" label={`Capacity (${unit === "btu" ? "BTU/h" : unit === "tons" ? "tons" : "kW thermal"})`} value={value} onChange={setValue} min={0} invalid={invalid} hint={invalid ? "Enter a finite capacity of zero or greater." : undefined} />
      </div><div className="hvac-actions">
        <Button type="button" variant="outline" onClick={() => { const sample = convertCapacity(36_000, "btu")!; setValue(String(sample[unit])); }}>Load example</Button>
        <Button type="button" variant="ghost" onClick={() => setValue("")}>Clear value</Button>
      </div></div>
      <div className="hvac-capacity-results" role="status" aria-live="polite" aria-atomic="true">
        {([{ key: "btu", label: "BTU/h" }, { key: "tons", label: "Refrigeration tons" }, { key: "kw", label: "kW (thermal)" }] as const).map((item) =>
          <div key={item.key}><span>{item.label}</span><strong>{result ? format(result[item.key], 3) : "—"}</strong></div>)}
        {!result && <p>Enter a valid capacity to see conversions.</p>}
      </div>
    </div>
    <p className="hvac-guidance">1 refrigeration ton = 12,000 BTU/h ≈ 3.51685 kW of thermal capacity. Electrical power consumption depends on equipment efficiency. <a href="https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8" target="_blank" rel="noreferrer">NIST conversion factors ↗</a></p>
  </>;
}

export function HvacTools() {
  const [active, setActive] = useState<(typeof tools)[number]["id"]>("split");
  return <section className="hvac-workspace" aria-label="HVAC field calculators">
    <div className="hvac-tool-menu" role="group" aria-label="Choose a calculator">
      <div className="hvac-menu-label"><Wrench aria-hidden="true" /> Field calculators</div>
      {tools.map(({ id, title, subtitle, icon: Icon }) => <button type="button" key={id}
        className={active === id ? "hvac-tool-button selected" : "hvac-tool-button"}
        aria-pressed={active === id} aria-controls={`hvac-panel-${id}`} onClick={() => setActive(id)}>
        <Icon aria-hidden="true" /><span><strong>{title}</strong><small>{subtitle}</small></span>
      </button>)}
    </div>
    <div className="hvac-tool-panels">
      {tools.map(({ id, title }) => <section key={id} id={`hvac-panel-${id}`} hidden={active !== id} aria-label={title}>
        {id === "airflow" ? <AirflowCalculator /> : id === "capacity" ? <CapacityCalculator /> : <TemperatureCalculator tool={id} />}
      </section>)}
    </div>
  </section>;
}
