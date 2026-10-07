export type MstpSymptom = "all-offline" | "one-offline" | "intermittent" | "slow-token";
export type FieldAnswer = "yes" | "no" | "unknown";
export type TerminationAnswer = "0" | "1" | "2" | "unknown";

export type MstpDiagnosisInput = {
  symptom: MstpSymptom;
  idleBiasVoltage: string;
  terminationCount: TerminationAnswer;
  baudMatches: FieldAnswer;
  duplicateMac: FieldAnswer;
};

export type MstpDiagnosis = {
  status: string;
  severity: "Critical" | "Warning" | "Guided check";
  summary: string;
  checks: string[];
  readingNote: string | null;
};

const decimalPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;

function parseOptionalVoltage(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (!decimalPattern.test(trimmed) || trimmed.length > 40) return Number.NaN;
  return Number(trimmed);
}

export function diagnoseMstp(input: MstpDiagnosisInput): MstpDiagnosis {
  const idleBiasVoltage = parseOptionalVoltage(input.idleBiasVoltage);
  const checks: string[] = [];
  let status = "Follow MS/TP checkout";
  let severity: MstpDiagnosis["severity"] = "Guided check";
  let summary = "Use the checklist to separate wiring, addressing and controller configuration issues.";
  let readingNote: string | null = null;

  if (Number.isNaN(idleBiasVoltage)) {
    readingNote = "Idle bias voltage must be a decimal number, or leave it blank if you have not measured it yet.";
  } else if (idleBiasVoltage !== null) {
    if (idleBiasVoltage < 0) {
      status = "Meter polarity or wiring check";
      severity = "Warning";
      summary = "A negative idle reading usually means the meter leads are reversed or the pair polarity is not what you expect.";
      readingNote = "Swap meter leads and confirm +, -, and shield are landed consistently end to end.";
    } else if (idleBiasVoltage < 0.2) {
      status = "No idle bias observed";
      severity = "Critical";
      summary = "The trunk may be shorted, unpowered, missing bias, or held down by a failed device.";
      readingNote = "With traffic idle, a very low differential reading is a strong reason to isolate trunk sections.";
    } else if (idleBiasVoltage > 5) {
      status = "Unexpected high bias";
      severity = "Warning";
      summary = "The reading is higher than expected for a normal RS-485 idle differential.";
      readingNote = "Verify the meter range, measure directly at the controller and confirm no supply voltage is on the data pair.";
    } else {
      readingNote = "Idle bias is present. Continue with addressing, baud rate, polarity and termination checks.";
    }
  }

  if (input.duplicateMac === "yes") {
    status = "Duplicate MAC likely";
    severity = "Critical";
    summary = "Two devices using the same MAC address can knock devices offline or make the token unstable.";
    checks.push("Disconnect or readdress one duplicate device, then power-cycle or rediscover the trunk.");
  }

  if (input.baudMatches === "no") {
    status = "Baud mismatch likely";
    severity = "Critical";
    summary = "A device at the wrong baud rate will not communicate even when polarity and wiring are correct.";
    checks.push("Set every device on the trunk to the same baud rate, then restart the controller or trunk.");
  }

  if (input.terminationCount !== "2") {
    severity = severity === "Critical" ? severity : "Warning";
    if (input.terminationCount === "unknown") {
      checks.push("Find both physical ends of the MS/TP trunk and verify where termination is enabled.");
    } else {
      status = "Termination issue likely";
      summary = "MS/TP trunks normally need termination only at the two physical ends.";
      checks.push(`Correct termination count from ${input.terminationCount} to 2 end-of-line terminations.`);
    }
  }

  if (input.symptom === "all-offline") {
    checks.push("Start at the controller: verify 24 VAC power, BACnet port enabled, correct protocol and trunk polarity.");
    checks.push("Measure the data pair at the controller, then halfway down the trunk to locate the first bad section.");
  }
  if (input.symptom === "one-offline") {
    checks.push("Check the missing device power, MAC address, baud rate and polarity before changing the controller program.");
    checks.push("Temporarily connect that device close to the controller to separate device failure from field wiring.");
  }
  if (input.symptom === "intermittent") {
    checks.push("Look for loose shield/drain contact, water in junction boxes, mixed polarity splices and excessive stubs.");
    checks.push("Watch error counters or token retries while gently moving suspect wiring sections.");
  }
  if (input.symptom === "slow-token") {
    checks.push("Confirm max master is not set much higher than the highest MAC address actually used.");
    checks.push("Check for duplicate MACs and devices repeatedly dropping off the trunk.");
  }

  if (input.baudMatches === "unknown") checks.push("Record the baud rate at the controller and at two field devices before replacing parts.");
  if (input.duplicateMac === "unknown") checks.push("Scan or list MAC addresses and confirm every device address is unique.");
  if (idleBiasVoltage === null) checks.push("Measure idle differential voltage across the MS/TP + and - terminals when traffic is quiet.");

  return { status, severity, summary, checks: [...new Set(checks)], readingNote };
}
