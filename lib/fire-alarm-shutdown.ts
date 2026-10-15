export type ContactAction = "opens-on-alarm" | "closes-on-alarm" | "unknown";
export type InputState = "on" | "off" | "unknown";
export type FieldAnswer = "yes" | "no" | "unknown";
export type DriveMode = "auto" | "hand" | "unknown";

export type FireAlarmShutdownInput = {
  contactAction: ContactAction;
  normalInputState: InputState;
  alarmInputState: InputState;
  shutdownObserved: FieldAnswer;
  allDrivesMatched: FieldAnswer;
  programmedInput: FieldAnswer;
  driveMode: DriveMode;
};

export type FireAlarmShutdownDiagnosis = {
  status: string;
  severity: "Verified" | "Warning" | "Stop";
  summary: string;
  checks: string[];
};

function stateChanged(normal: InputState, alarm: InputState) {
  return normal !== "unknown" && alarm !== "unknown" && normal !== alarm;
}

export function diagnoseFireAlarmShutdown(input: FireAlarmShutdownInput): FireAlarmShutdownDiagnosis {
  const checks: string[] = [];
  let status = "Follow fire alarm shutdown checkout";
  let severity: FireAlarmShutdownDiagnosis["severity"] = "Warning";
  let summary = "Confirm the fire alarm dry contact changes the programmed VFD input and that every drive shuts down during the test.";

  if (input.programmedInput === "no") {
    status = "Input not programmed";
    severity = "Stop";
    summary = "The VFD input must be programmed for fire alarm shutdown before the installer test.";
    checks.push("Program the dedicated fire alarm digital input and record the input number used on every VFD.");
    checks.push("Confirm the input polarity matches the dry contact action before landing the final alarm wires.");
  }

  if (input.normalInputState !== "unknown" && input.alarmInputState !== "unknown" && input.normalInputState === input.alarmInputState) {
    status = "Input state did not change";
    severity = "Stop";
    summary = "The VFD input is not seeing a different normal and alarm condition.";
    checks.push("Check the fire alarm dry contact, jumper, common, 24 V source and input terminal wiring.");
    checks.push("Have the fire alarm installer prove the contact with a meter while you watch the VFD input monitor.");
  }

  if (stateChanged(input.normalInputState, input.alarmInputState) && input.shutdownObserved === "no") {
    status = "Programming or polarity mismatch";
    severity = "Stop";
    summary = "The VFD input changes, but the drive did not shut down. The issue is likely input function, polarity or mode behavior.";
    checks.push("Verify the selected digital input function is assigned to fire alarm, external fault or run permissive shutdown as intended.");
    checks.push("Reverse the programmed input logic only if the monitored normal/alarm states prove it is backwards.");
  }

  if (input.programmedInput === "yes" && stateChanged(input.normalInputState, input.alarmInputState) && input.shutdownObserved === "yes" && input.allDrivesMatched === "yes") {
    status = "Shutdown verified";
    severity = "Verified";
    summary = "The fire alarm input changed state and the drives shut down consistently during the test.";
    checks.push("Record normal input state, alarm input state, input number and final VFD mode for the closeout note.");
  }

  if (input.allDrivesMatched === "no") {
    status = "Drives are not consistent";
    severity = "Stop";
    summary = "At least one VFD responded differently. Do not call the test complete until every drive reacts the same way.";
    checks.push("Compare the fire alarm input number, input function, polarity, common wiring and mode on each VFD.");
  }

  if (input.driveMode === "hand") {
    severity = severity === "Verified" ? "Warning" : severity;
    status = status === "Shutdown verified" ? "Verify Hand mode behavior" : status;
    checks.push("Test whether the fire alarm shutdown works in Hand/Local as well as Auto if the project requires shutdown in every mode.");
  }

  if (input.contactAction === "opens-on-alarm") {
    checks.push("For an opens-on-alarm contact, normal should usually prove the circuit made, and alarm should remove the permissive.");
  } else if (input.contactAction === "closes-on-alarm") {
    checks.push("For a closes-on-alarm contact, alarm should energize the shutdown input or trigger the programmed alarm function.");
  } else {
    checks.push("Confirm whether the fire alarm contact opens or closes on alarm before final programming.");
  }

  if (input.programmedInput === "unknown") checks.push("Verify the exact VFD digital input number and assigned function in the drive parameters.");
  if (input.normalInputState === "unknown" || input.alarmInputState === "unknown") checks.push("Use the VFD input monitor to capture normal and alarm/test state.");
  if (input.shutdownObserved === "unknown") checks.push("Run a witnessed test and confirm fan shutdown, alarm indication and reset behavior.");
  if (input.allDrivesMatched === "unknown") checks.push("Check every VFD, not only the first one, before signing off.");
  if (input.driveMode === "unknown") checks.push("Record whether each VFD was in Auto/Remote or Hand/Local during the test.");

  return { status, severity, summary, checks: [...new Set(checks)] };
}
