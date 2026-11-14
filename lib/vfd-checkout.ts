export type DriveFamily = "yaskawa-j1000" | "yaskawa-ga500" | "generic";
export type FieldAnswer = "yes" | "no" | "unknown";
export type DriveMode = "auto" | "local" | "unknown";

export type VfdCheckoutInput = {
  driveFamily: DriveFamily;
  mode: DriveMode;
  runCommand: FieldAnswer;
  speedReference: string;
  faulted: FieldAnswer;
  permissiveClosed: FieldAnswer;
};

export type VfdCheckout = {
  status: string;
  severity: "Stop" | "Warning" | "Guided check";
  summary: string;
  referencePercent: number | null;
  readingNote: string | null;
  checks: string[];
};

export type VfdReportDetails = {
  project: string;
  equipment: string;
  testDate: string;
  faultCode: string;
  notes: string;
  example: boolean;
};

export const driveFamilyLabels: Record<DriveFamily, string> = {
  "yaskawa-j1000": "Yaskawa J1000",
  "yaskawa-ga500": "Yaskawa GA500",
  generic: "Generic VFD",
};

export const driveModeLabels: Record<DriveMode, string> = {
  unknown: "Not verified",
  auto: "Remote / Auto",
  local: "Local / Hand",
};

export const fieldAnswerLabels: Record<FieldAnswer, string> = {
  unknown: "Not verified",
  yes: "Yes",
  no: "No",
};

const decimalPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;

function parseOptionalVoltage(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (!decimalPattern.test(trimmed) || trimmed.length > 40) return Number.NaN;
  return Number(trimmed);
}

const driveParameterTips: Record<DriveFamily, string[]> = {
  "yaskawa-j1000": [
    "For a J1000, verify b1-01 is set for terminal speed reference and b1-02 is set for terminal run command when the BAS controls the drive.",
    "Confirm the 0-10 VDC reference is measured between A1 and AC, and the run input/common wiring matches the project drawing.",
  ],
  "yaskawa-ga500": [
    "For a GA500, confirm the drive is in remote operation and the reference source and run source match the terminal wiring.",
    "Measure the analog reference at the configured input and common, then compare it to the controller command percent.",
  ],
  generic: [
    "Verify the drive command source and reference source are both set for the BAS terminals, not keypad only.",
    "Measure the analog reference at the drive input and common, then compare it to the controller output.",
  ],
};

export function diagnoseVfdCheckout(input: VfdCheckoutInput): VfdCheckout {
  const speedReference = parseOptionalVoltage(input.speedReference);
  const checks: string[] = [];
  let status: string;
  let severity: VfdCheckout["severity"] = "Guided check";
  let summary: string;
  let referencePercent: number | null = null;
  let readingNote: string | null = null;

  const invalidReference = Number.isNaN(speedReference);
  const outOfRange = speedReference !== null && (speedReference < 0 || speedReference > 10);
  const lowReference = speedReference !== null && speedReference >= 0 && speedReference < 0.5;
  if (invalidReference) {
    readingNote = "Speed reference must be a decimal voltage, or leave it blank if it has not been measured.";
  } else if (outOfRange) {
    readingNote = "Outside the 0–10 VDC span. Verify the configured signal type and compare it to the recorded reading.";
  } else if (speedReference !== null) {
    referencePercent = speedReference * 10;
    readingNote = lowReference
      ? "Below this tool’s 0.5 V screening threshold. This is not a drive start threshold; compare with the approved sequence and scaling."
      : `${Number(referencePercent.toFixed(1))}% of a direct 0–10 VDC span, not measured motor speed.`;
  }

  if (input.faulted === "yes") {
    status = "Active drive fault or alarm";
    severity = "Stop";
    summary = "Record the exact code and identify the cause using the drive manual before considering a reset or restart.";
  } else if (input.permissiveClosed === "no") {
    status = "Safety or permissive open";
    severity = "Warning";
    summary = "An open safety or enable circuit must be investigated. Do not bypass protections or force a run command.";
  } else if (input.mode === "local") {
    status = "Drive left in Local";
    severity = "Warning";
    summary = "A drive in Local/Hand can ignore the BAS run command or speed reference.";
  } else if (input.runCommand === "no") {
    status = "No run command";
    severity = "Warning";
    summary = "No start command was recorded at the drive. Check whether the BAS is actually calling for operation.";
  } else if (invalidReference) {
    status = "Invalid speed reference";
    severity = "Warning";
    summary = "Correct the voltage entry before judging the command path.";
  } else if (outOfRange) {
    status = "Reference out of range";
    severity = "Warning";
    summary = "The recorded voltage is outside the expected span for a direct 0–10 VDC input.";
  } else if (lowReference) {
    status = "Low speed reference";
    severity = "Warning";
    summary = "Compare the low reading with the intended command and configured drive scaling. It does not establish why the motor is stopped.";
  } else if (speedReference !== null && input.mode === "auto" && input.runCommand === "yes" && input.faulted === "no" && input.permissiveClosed === "yes") {
    status = "Command path looks ready";
    summary = "The recorded inputs are consistent with a run request. They do not prove motor operation or authorize a restart.";
  } else {
    status = "Checkout incomplete";
    summary = "Confirm the missing observations before drawing a conclusion about the command path.";
  }

  if (input.faulted === "yes") checks.push("Record the fault code and review the manufacturer’s troubleshooting guidance.");
  if (input.faulted === "unknown") checks.push("Confirm whether the drive monitor shows an active fault, alarm or inhibit.");
  if (input.permissiveClosed === "no") checks.push("Identify the open permissive from the approved sequence; do not bypass it.");
  if (input.permissiveClosed === "unknown") checks.push("Verify the safety/permissive state from the approved sequence and drive status.");
  if (input.mode === "local") checks.push("Record the Local/Hand state. Confirm the approved operating mode before any change.");
  if (input.mode === "unknown") checks.push("Confirm the keypad shows Remote/Auto or Local/Hand.");
  if (input.runCommand === "no") checks.push("Compare the BAS demand, BAS output relay, interposing relay and drive input status with the approved schematic.");
  if (input.runCommand === "unknown") checks.push("Record the drive run input status and the corresponding BAS demand.");
  if (speedReference === null) checks.push("Record the reference voltage per the manufacturer’s measurement and site safety procedures.");
  if (invalidReference) checks.push("Re-enter a plain decimal voltage without units.");
  if (outOfRange || lowReference) checks.push("Compare the voltage with the controller demand, configured signal type and scaling.");
  if (status === "Command path looks ready") checks.push("Record the drive’s run monitor and displayed output frequency during an authorized test.");

  if (input.faulted !== "yes" && input.permissiveClosed !== "no") checks.push(...driveParameterTips[input.driveFamily]);

  return { status, severity, summary, referencePercent, readingNote, checks };
}

function inline(value: string, fallback: string) {
  return value.replace(/\s+/g, " ").trim() || fallback;
}

export function buildVfdReport(input: VfdCheckoutInput, details: VfdReportDetails): string {
  const result = diagnoseVfdCheckout(input);
  const reading = inline(input.speedReference, "");
  const displayedVoltage = !reading ? "Not measured"
    : Number.isNaN(parseOptionalVoltage(input.speedReference)) ? `Invalid entry: ${reading}`
    : `${reading} VDC`;

  return [
    details.example ? "EXAMPLE ONLY — VFD Field Checkout Report" : "VFD Field Checkout Report",
    `Site / project: ${inline(details.project, "Not recorded")}`,
    `Equipment / drive tag: ${inline(details.equipment, "Not recorded")}`,
    `Test date: ${inline(details.testDate, "Not recorded")}`,
    "",
    "Observed at checkout",
    `Drive family: ${driveFamilyLabels[input.driveFamily]}`,
    `Keypad mode: ${driveModeLabels[input.mode]}`,
    `Run command present: ${fieldAnswerLabels[input.runCommand]}`,
    `Safety/permissive closed: ${fieldAnswerLabels[input.permissiveClosed]}`,
    `Active fault or alarm: ${fieldAnswerLabels[input.faulted]}`,
    `Recorded code: ${inline(details.faultCode, "Not recorded")}`,
    `Speed reference: ${displayedVoltage}`,
    `Direct 0–10 VDC span: ${result.referencePercent === null ? "Not calculated" : `${Number(result.referencePercent.toFixed(1))}% (not motor speed)`}`,
    ...(result.readingNote ? [`Reading note: ${result.readingNote}`] : []),
    "",
    `Assessment: ${result.severity} — ${result.status}`,
    result.summary,
    "",
    "Follow-up checks",
    ...result.checks.map((check, index) => `${index + 1}. ${check}`),
    "",
    "Technician notes",
    details.notes.trim() || "Not recorded",
    "",
    "Field observations only. Not a commissioning sign-off or authorization to run.",
  ].join("\n");
}
