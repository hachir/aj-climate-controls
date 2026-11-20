"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buildAddressPlanReport, checkAddressPlan, emptyAddressRow, MAX_PLAN_ROWS, type AddressRow } from "@/lib/mstp-address-plan";

const fields = [
  { key: "device", label: "Device tag (optional)", placeholder: "e.g. VAV-01", max: 48 },
  { key: "trunk", label: "Trunk label", placeholder: "e.g. Trunk A", max: 48 },
  { key: "mac", label: "MS/TP MAC", placeholder: "e.g. 12", max: 12 },
  { key: "instance", label: "Device instance", placeholder: "e.g. 12012", max: 12 },
] as const;

const example: AddressRow[] = [
  { device: "VAV-DEMO-1", trunk: "Trunk A", mac: "12", instance: "12012" },
  { device: "VAV-DEMO-2", trunk: "Trunk A", mac: "12", instance: "12013" },
  { device: "AHU-DEMO", trunk: "Trunk B", mac: "12", instance: "12012" },
];

export function MstpAddressPlan() {
  const [rows, setRows] = useState([{ ...emptyAddressRow, id: 0 }]);
  const [isExample, setIsExample] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const reportRef = useRef<HTMLTextAreaElement>(null);
  const copyAttempt = useRef(0);
  const nextId = useRef(1);
  const pendingFocus = useRef<string | null>(null);
  const entries = rows.map(({ device, trunk, mac, instance }) => ({ device, trunk, mac, instance }));
  const result = checkAddressPlan(entries);
  const report = buildAddressPlanReport(entries, isExample);
  const duplicates = result.issues.filter((issue) => issue.kind === "duplicate").length;
  const invalid = result.issues.filter((issue) => issue.kind === "invalid").length;
  const missing = result.issues.length - duplicates - invalid;
  const summary = result.entered === 0 ? "Enter a device to check the plan."
    : result.issues.length ? [duplicates ? `${duplicates} duplicate group(s)` : "", invalid ? `${invalid} invalid address field(s)` : "", missing ? `${missing} missing field(s)` : ""].filter(Boolean).join(" · ")
    : `No conflicts found in the ${result.entered} entered ${result.entered === 1 ? "device" : "devices"}.`;

  useEffect(() => {
    if (!pendingFocus.current) return;
    document.getElementById(pendingFocus.current)?.focus();
    pendingFocus.current = null;
  }, [rows]);

  function replaceRows(values: AddressRow[], demo = false) {
    invalidateCopy();
    setRows(values.map((value) => ({ ...value, id: nextId.current++ })));
    setIsExample(demo);
  }

  function invalidateCopy() {
    copyAttempt.current++;
    setCopyStatus("");
  }

  async function copyReport() {
    const attempt = ++copyAttempt.current;
    try {
      await navigator.clipboard.writeText(report);
      if (attempt === copyAttempt.current) setCopyStatus("Address plan copied. Paste it into your field notes.");
    } catch {
      if (attempt !== copyAttempt.current) return;
      reportRef.current?.focus();
      reportRef.current?.select();
      setCopyStatus("Automatic copy unavailable. The report is selected; copy it manually.");
    }
  }

  return (
    <section id="mstp-address-plan" className="voltage-workspace hvac-tool-panels mt-6 scroll-mt-24" aria-labelledby="mstp-plan-heading">
      <div className="hvac-tool-heading">
        <h2 id="mstp-plan-heading">MS/TP address planner</h2>
        <p>Enter devices for one BACnet internetwork. MAC addresses must be unique on each trunk; device instances must be unique across the internetwork.</p>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Use one consistent label for each trunk (including devices connected through a repeater on that trunk). Include the router’s MS/TP port if it has a MAC on that trunk. Entries stay in this page until cleared or reloaded.</p>
      {isExample && <p className="mt-3 text-sm font-semibold">Example only. Clear the plan to start a real survey.</p>}
      <div className="mt-4 grid gap-3" onChange={invalidateCopy}>
        {rows.map((row, index) => (
          <fieldset key={row.id} className="min-w-0 rounded-md border border-border px-3 pb-3">
            <legend className="px-2 text-sm font-semibold">Device {index + 1}</legend>
            <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.75fr_0.9fr_auto]">
              {fields.map(({ key, label, placeholder, max }) => {
                const id = `mstp-plan-${row.id}-${key}`;
                const hasIssue = result.issues.some((issue) => issue.field === key && issue.rows.includes(index + 1));
                return <div key={key} className="hvac-field">
                  <label htmlFor={id}>{label}</label>
                  <Input id={id} value={row[key]} placeholder={placeholder} maxLength={max}
                    autoComplete="off" spellCheck={false} inputMode={key === "mac" || key === "instance" ? "numeric" : undefined}
                    aria-invalid={hasIssue || undefined} aria-describedby={hasIssue ? "mstp-plan-summary" : undefined}
                    onChange={(event) => setRows((current) => current.map((item) => item.id === row.id ? { ...item, [key]: event.target.value } : item))} />
                </div>;
              })}
              <Button type="button" variant="outline" size="icon" className="size-11"
                aria-label={`Remove device ${index + 1}`} disabled={rows.length === 1}
                onClick={() => {
                  invalidateCopy();
                  const next = rows[index + 1] ?? rows[index - 1];
                  if (next) pendingFocus.current = `mstp-plan-${next.id}-device`;
                  setRows((current) => current.filter((item) => item.id !== row.id));
                }}><Trash2 aria-hidden="true" /></Button>
            </div>
          </fieldset>
        ))}
      </div>
      <div className="hvac-actions">
        <Button type="button" disabled={rows.length >= MAX_PLAN_ROWS} onClick={() => {
          invalidateCopy();
          const id = nextId.current++;
          pendingFocus.current = `mstp-plan-${id}-device`;
          setRows((current) => [...current, { ...emptyAddressRow, id }]);
        }}><Plus aria-hidden="true" /> Add device</Button>
        <Button type="button" variant="outline" disabled={result.entered > 0} onClick={() => replaceRows(example, true)}>Load conflict example</Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" disabled={result.entered === 0 && rows.length === 1}>Clear plan</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear this address plan?</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                This removes all {rows.length} {rows.length === 1 ? "row" : "rows"} from this page,
                including {result.entered} entered {result.entered === 1 ? "device" : "devices"}.
                There is no saved copy in the app. Choose Keep plan to go back and copy the address plan report first.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep plan</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => replaceRows([emptyAddressRow])}>Clear all rows</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="mt-4 rounded-md border border-border bg-background p-4">
        <p id="mstp-plan-summary" role="status" className="font-semibold">{summary}</p>
        {result.issues.length > 0 && <ul aria-label="Address plan issues" className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {result.issues.map((issue) => <li key={issue.message}>{issue.message}</li>)}
        </ul>}
        <p className="mt-2 text-sm text-muted-foreground">This checks only your entries, not the live network. MAC 255 is broadcast; 128–254 are for non-token-passing devices only. Verify equipment-specific address limits and the approved schedule before programming.</p>
        <a className="mt-2 inline-block text-sm text-accent-foreground underline" href="https://docs.johnsoncontrols.com/bas/r/Johnson-Controls/en-US/Portable-BACnet/IP-to-MS/TP-Router-Installation-Guide/G/Operation/Configuring-the-router">BACnet addressing reference</a>
      </div>
      <details className="mt-4 rounded-md border border-border p-4">
        <summary className="cursor-pointer font-semibold">Address plan report</summary>
        <p className="my-3 text-sm text-muted-foreground">Copy a snapshot of your entries and review findings into your field notes. Nothing is sent to a server; this does not save the plan in the app.</p>
        <label htmlFor="mstp-plan-report" className="mb-2 block text-sm font-semibold">Report preview</label>
        <Textarea ref={reportRef} id="mstp-plan-report" className="field-sizing-fixed font-mono" readOnly rows={10} value={report} />
        <div className="hvac-actions">
          <Button type="button" disabled={result.entered === 0} onClick={copyReport}><Copy aria-hidden="true" /> Copy address plan</Button>
        </div>
        <p className="mt-2 text-sm" role="status" aria-live="polite">{copyStatus}</p>
      </details>
    </section>
  );
}
