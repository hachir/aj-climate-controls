export type FieldAnswer = "yes" | "no" | "unknown";

export type BoilerFlowInput = {
  callForHeat: FieldAnswer;
  boilerFiring: FieldAnswer;
  pumpCommand: FieldAnswer;
  pumpRunning: FieldAnswer;
  isolationValvesOpen: FieldAnswer;
  flowProven: FieldAnswer;
  highLimitActive: FieldAnswer;
  supplyTemp: string;
  returnTemp: string;
};

export type BoilerFlowDiagnosis = {
  status: string;
  severity: "Stop" | "Warning" | "Guided check" | "Verified";
  summary: string;
  temperatureDelta: number | null;
  readingNote: string | null;
  checks: string[];
};

const decimalPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;

function parseTemperature(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!decimalPattern.test(trimmed) || trimmed.length > 20) return Number.NaN;
  return Number(trimmed);
}

export function diagnoseBoilerFlow(input: BoilerFlowInput): BoilerFlowDiagnosis {
  const supply = parseTemperature(input.supplyTemp);
  const ret = parseTemperature(input.returnTemp);
  const checks: string[] = [];
  let status = "Follow the boiler water path";
  let severity: BoilerFlowDiagnosis["severity"] = "Guided check";
  let summary = "Confirm demand, burner operation, pump operation, open valves and actual water flow in sequence.";
  let temperatureDelta: number | null = null;
  let readingNote: string | null = null;

  if (Number.isNaN(supply) || Number.isNaN(ret)) {
    readingNote = "Supply and return temperatures must be decimal numbers, or leave unknown readings blank.";
  } else if (supply !== null && ret !== null) {
    temperatureDelta = Number((supply - ret).toFixed(1));
    readingNote = `${temperatureDelta} F water temperature difference, calculated as supply minus return.`;
    if (temperatureDelta < -2) {
      checks.push("Return reads warmer than supply; verify sensor labels, sensor placement and calibration before using the temperature difference.");
    }
  }

  if (input.highLimitActive === "yes") {
    status = "High limit or over-temperature lockout active";
    severity = "Stop";
    summary = "Stop repeated firing attempts until water circulation and the temperature measurement are proven.";
    checks.push("Record the exact limit or lockout text and controller temperature before resetting.");
    checks.push("Compare the boiler sensor reading with an independent pipe-temperature measurement; the displayed system temperature may not be the temperature seen by the limit sensor.");
    checks.push("Prove pump operation and water flow, then check closed valves, air, strainers and sensor installation.");
  } else if (input.callForHeat === "no") {
    status = "No heat demand";
    severity = "Guided check";
    summary = "The boiler water system is not being requested to heat, so begin with the operating control and sequence.";
    checks.push("Check schedule, water-temperature setpoint, outdoor reset, cascade demand and enable/interlocks.");
  } else if (input.boilerFiring === "no") {
    status = "Boiler not firing";
    severity = "Warning";
    summary = "A demand exists, but the boiler is not producing heat. Resolve the firing sequence before judging loop temperature.";
    checks.push("Check boiler enable, active status, safeties and ignition lockout using the Boiler Ignition Checkout Tool.");
  } else if (input.pumpCommand === "no") {
    status = "No pump command";
    severity = "Warning";
    summary = "The boiler is firing or requested, but the controls are not commanding the circulation pump.";
    checks.push("Check pump enable logic, lead/lag selection, interlocks, relay/output state and BAS schedule.");
  } else if (input.pumpRunning === "no") {
    status = "Pump commanded but not running";
    severity = "Stop";
    summary = "Do not continue firing without confirmed circulation. The pump command is present, but pump operation is not proven.";
    checks.push("Check disconnect, overload, starter/VFD status, voltage, rotation and motor current using approved procedures.");
  } else if (input.isolationValvesOpen === "no") {
    status = "Closed valve blocking circulation";
    severity = "Stop";
    summary = "A closed isolation or service valve can stop boiler flow even when the pump is running.";
    checks.push("Verify the approved operating position of boiler supply, return and pump isolation valves before firing.");
    checks.push("Do not move an unidentified valve until its function and system impact are confirmed.");
  } else if (input.flowProven === "no") {
    status = "Pump running but flow not proven";
    severity = "Stop";
    summary = "The pump appears to run, but circulation through the boiler is not established.";
    checks.push("Check air lock, plugged strainer, check valve, balancing valve, pump rotation, differential pressure and closed branches.");
    checks.push("Measure differential pressure or flow using the approved balancing method; motor noise alone does not prove water flow.");
  } else if (
    input.callForHeat === "yes" && input.boilerFiring === "yes" && input.pumpCommand === "yes" &&
    input.pumpRunning === "yes" && input.isolationValvesOpen === "yes" && input.flowProven === "yes"
  ) {
    status = "Boiler flow path verified";
    severity = "Verified";
    summary = "Demand, burner, pump, valve position and circulation are all responding during this check.";
    checks.push("Record supply/return temperatures, pump status and differential pressure or flow reading after the system stabilizes.");
  }

  if (input.highLimitActive === "unknown") checks.push("Check active limits and recent lockout history before resetting the boiler.");
  if (input.callForHeat === "unknown") checks.push("Confirm an active boiler or cascade demand.");
  if (input.boilerFiring === "unknown") checks.push("Confirm flame status and firing rate at the boiler display.");
  if (input.pumpCommand === "unknown") checks.push("Verify the pump command at the controller output and starter/VFD input.");
  if (input.pumpRunning === "unknown") checks.push("Prove pump operation using status, current, differential pressure or observed rotation where safe.");
  if (input.isolationValvesOpen === "unknown") checks.push("Identify and verify the operating position of supply, return and pump isolation valves.");
  if (input.flowProven === "unknown") checks.push("Prove circulation with differential pressure, flow measurement and stabilized supply/return temperatures.");
  if (supply === null || ret === null) checks.push("Measure boiler supply and return pipe temperatures after circulation is established.");

  return { status, severity, summary, temperatureDelta, readingNote, checks: [...new Set(checks)] };
}
