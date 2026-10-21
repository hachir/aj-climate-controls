export type FieldAnswer = "yes" | "no" | "unknown";
export type BoilerRole = "leader" | "member" | "standalone";

export type BoilerIgnitionInput = {
  role: BoilerRole;
  enablePresent: FieldAnswer;
  callForHeat: FieldAnswer;
  lockoutActive: FieldAnswer;
  prePurgeObserved: FieldAnswer;
  ignitionAttemptObserved: FieldAnswer;
  flameProven: FieldAnswer;
  gasPressureVerified: FieldAnswer;
};

export type BoilerIgnitionDiagnosis = {
  status: string;
  severity: "Stop" | "Warning" | "Guided check" | "Running";
  summary: string;
  checks: string[];
};

export function diagnoseBoilerIgnition(input: BoilerIgnitionInput): BoilerIgnitionDiagnosis {
  const checks: string[] = [];
  let status = "Follow ignition sequence";
  let severity: BoilerIgnitionDiagnosis["severity"] = "Guided check";
  let summary = "Observe the boiler sequence from enable through flame proving and record the first step that does not occur.";

  if (input.flameProven === "yes") {
    status = "Flame proven";
    severity = "Running";
    summary = "The boiler completed ignition and proved flame. Continue watching operation and confirm stable flame signal, outlet temperature and normal staging.";
    checks.push("Monitor the burner through a complete cycle and confirm it does not recycle or return to lockout.");
  }

  if (input.enablePresent === "no") {
    status = "No enable at boiler";
    severity = "Warning";
    summary = "The boiler cannot begin its firing sequence until the local enable/interlock circuit is satisfied.";
    checks.push(input.role === "member"
      ? "Confirm the member is available in the cascade and verify its enable/interlock terminals against the approved wiring diagram."
      : "Trace the enable from the BAS or operating control through the approved interlock circuit.");
    checks.push("Do not install or move a jumper unless the manufacturer wiring diagram and project sequence specifically require it.");
  } else if (input.callForHeat === "no") {
    status = "No heat demand";
    severity = "Guided check";
    summary = "Enable is present, but the controller is not requesting burner operation.";
    checks.push("Check operating setpoint, outdoor reset, schedule, water temperature and cascade lead/lag demand.");
  } else if (input.prePurgeObserved === "no") {
    status = "Sequence stops before pre-purge";
    severity = "Stop";
    summary = "The boiler has a call but is not starting the combustion-air proving sequence.";
    checks.push("Read the active status and fault history before resetting power or clearing the lockout.");
    checks.push("Check limits, blocked-drain or pressure switches, fan feedback and other manufacturer safeties.");
  } else if (input.ignitionAttemptObserved === "no") {
    status = "No ignition attempt after pre-purge";
    severity = "Stop";
    summary = "Pre-purge occurs, but the sequence does not advance to spark or ignition.";
    checks.push("Verify air-proving status and inspect the ignition command, igniter connection and ignition module indications.");
    checks.push("Use the manufacturer service procedure; do not bypass air, vent or flame-safeguard devices.");
  } else if (input.flameProven === "no") {
    status = "Ignition attempted; flame not proven";
    severity = "Stop";
    summary = "The boiler reaches ignition but does not establish or prove flame. A qualified combustion technician should check fuel and flame-safeguard conditions.";
    checks.push("With fuel isolated as required, inspect igniter, flame rod/sensor, grounds, connectors and wiring condition.");
    checks.push("Have a qualified technician verify inlet and manifold gas pressure under firing load against the exact boiler nameplate and manufacturer manual.");
    checks.push("Confirm gas valves and upstream regulators are operating correctly; do not adjust gas pressure by guess or from another model's value.");
  }

  if (input.lockoutActive === "yes") {
    if (severity !== "Running") severity = "Stop";
    checks.unshift("Record the exact lockout text/code and ignition-cycle history before performing the permitted reset.");
  }

  if (input.gasPressureVerified === "no") {
    checks.push("Stop repeated ignition attempts until a qualified technician measures dynamic gas pressure and confirms it meets the exact model specification.");
    if (input.flameProven !== "yes") severity = "Stop";
  } else if (input.gasPressureVerified === "unknown" && input.ignitionAttemptObserved === "yes" && input.flameProven !== "yes") {
    checks.push("Gas pressure is not yet verified; measure it under load with approved instruments before changing combustion settings.");
  }

  if (input.role === "member") {
    checks.push("Compare the member's cascade status, enable, setpoint and demand to the leader; BACnet monitoring alone may not be the firing enable.");
  }
  if (input.enablePresent === "unknown") checks.push("Verify the boiler's local enable/interlock input with the approved wiring diagram.");
  if (input.callForHeat === "unknown") checks.push("Confirm the controller shows an active heat demand and the current target temperature.");
  if (input.prePurgeObserved === "unknown") checks.push("Observe whether the combustion blower starts and the air-proving step completes.");
  if (input.ignitionAttemptObserved === "unknown") checks.push("Observe one controlled ignition cycle and note whether spark/ignition begins.");
  if (input.flameProven === "unknown") checks.push("Check whether flame is established and whether the controller reports a stable flame signal.");

  return { status, severity, summary, checks: [...new Set(checks)] };
}
