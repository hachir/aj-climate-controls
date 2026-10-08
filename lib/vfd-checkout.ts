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
  let status = "Follow VFD checkout";
  let severity: VfdCheckout["severity"] = "Guided check";
  let summary = "Use the readings to separate BAS command, permissive, drive setup and motor-side issues.";
  let referencePercent: number | null = null;
  let readingNote: string | null = null;

  if (Number.isNaN(speedReference)) {
    readingNote = "Speed reference must be a decimal voltage, or leave it blank if it has not been measured.";
  } else if (speedReference !== null) {
    referencePercent = speedReference * 10;
    if (speedReference < 0 || speedReference > 10) {
      status = "Reference out of range";
      severity = "Warning";
      summary = "The analog speed command is outside the normal 0-10 VDC range.";
      referencePercent = null;
      readingNote = "Check meter polarity, signal common, controller output type and whether supply voltage is touching the analog input.";
    } else if (speedReference < 0.5) {
      status = "No speed reference";
      severity = "Warning";
      summary = "The drive may be allowed to run, but the BAS is not sending enough speed command to start airflow.";
      readingNote = "A near-zero reference can be normal only if the controller is intentionally commanding minimum or off.";
    } else {
      readingNote = `${Number(referencePercent.toFixed(1))}% speed command if the drive uses a direct 0-10 VDC reference.`;
    }
  }

  if (input.faulted === "yes") {
    status = "Drive fault must be cleared";
    severity = "Stop";
    summary = "Do not chase BAS wiring until the active VFD fault or alarm is identified and corrected.";
    checks.push("Record the exact fault code before resetting the drive.");
    checks.push("Check incoming power, motor leads, overload, phase loss, ground fault and mechanical load before restarting.");
  }

  if (input.mode === "local") {
    status = "Drive left in Local";
    severity = severity === "Stop" ? severity : "Warning";
    summary = "A drive in Local/Hand can ignore the BAS run command or speed reference.";
    checks.push("Put the drive back in Remote/Auto after confirming it is safe to run.");
  }

  if (input.permissiveClosed === "no") {
    status = "Safety or permissive open";
    severity = severity === "Stop" ? severity : "Warning";
    summary = "The drive may be protected by an open smoke shutdown, safety relay, freezestat, overload or enable circuit.";
    checks.push("Verify smoke shutdown, freezestat, overload and the enable/safety circuit are closed before forcing a run command.");
    checks.push("Do not bypass a safety except for a controlled temporary test with approval and observation.");
  }

  if (input.runCommand === "no") {
    status = "No run command";
    severity = severity === "Stop" ? severity : "Warning";
    summary = "The BAS or relay circuit is not proving a start command at the drive.";
    checks.push("Measure the run input at the drive terminal while the controller is commanding the fan on.");
    checks.push("Check the BAS output relay, interposing relay, HOA switch and common wiring.");
  }

  if (input.runCommand === "yes" && speedReference !== null && !Number.isNaN(speedReference) && speedReference >= 0.5 && speedReference <= 10 && input.faulted !== "yes" && input.mode !== "local" && input.permissiveClosed !== "no") {
    status = "Command path looks ready";
    summary = "The run command and speed reference look usable. Continue into drive parameters, output status and motor-side checks.";
    checks.push("Confirm the drive display shows run enabled and a nonzero output frequency.");
    checks.push("If output frequency stays at 0 Hz, verify command source, reference source and minimum frequency parameters.");
    checks.push("If output frequency rises but the fan does not move, inspect belt, motor disconnect, overload and motor wiring.");
  }

  if (input.runCommand === "unknown") checks.push("Measure the run input at the drive while the BAS calls for fan operation.");
  if (input.permissiveClosed === "unknown") checks.push("Confirm smoke shutdown, safety relay, overload and enable contacts are closed.");
  if (input.mode === "unknown") checks.push("Confirm the keypad shows Remote/Auto, not Local/Hand.");
  if (input.faulted === "unknown") checks.push("Check the keypad or drive monitor for an active fault, alarm or inhibit.");
  if (speedReference === null) checks.push("Measure the speed reference at the drive analog input and common.");

  checks.push(...driveParameterTips[input.driveFamily]);

  return { status, severity, summary, referencePercent, readingNote, checks: [...new Set(checks)] };
}
