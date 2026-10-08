export type UnitType = "rtu" | "ahu";
export type ComplaintType = "no-cooling" | "no-heating" | "fan-not-running" | "poor-airflow";
export type FieldAnswer = "yes" | "no" | "unknown";

export type RtuAhuCheckoutInput = {
  unitType: UnitType;
  complaint: ComplaintType;
  fanRunning: FieldAnswer;
  callPresent: FieldAnswer;
  safetyClosed: FieldAnswer;
  supplyTemp: string;
  returnTemp: string;
};

export type RtuAhuCheckout = {
  status: string;
  severity: "Stop" | "Warning" | "Guided check";
  summary: string;
  temperatureDelta: number | null;
  readingNote: string | null;
  checks: string[];
};

const decimalPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;

function parseOptionalTemp(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (!decimalPattern.test(trimmed) || trimmed.length > 40) return Number.NaN;
  return Number(trimmed);
}

function unitLabel(unitType: UnitType) {
  return unitType === "rtu" ? "RTU" : "AHU";
}

export function diagnoseRtuAhu(input: RtuAhuCheckoutInput): RtuAhuCheckout {
  const supply = parseOptionalTemp(input.supplyTemp);
  const ret = parseOptionalTemp(input.returnTemp);
  const checks: string[] = [];
  let status = "Follow RTU/AHU checkout";
  let severity: RtuAhuCheckout["severity"] = "Guided check";
  let summary = `Use the ${unitLabel(input.unitType)} readings to separate airflow, BAS command, safety and mechanical issues.`;
  let temperatureDelta: number | null = null;
  let readingNote: string | null = null;

  if (Number.isNaN(supply) || Number.isNaN(ret)) {
    readingNote = "Supply and return air temperatures must be decimal numbers, or leave unknown readings blank.";
  } else if (supply !== null && ret !== null) {
    temperatureDelta = input.complaint === "no-heating" ? supply - ret : ret - supply;
    const roundedDelta = Number(temperatureDelta.toFixed(1));
    if (input.complaint === "no-cooling") {
      if (temperatureDelta < 8) {
        status = "Low cooling split";
        severity = "Warning";
        summary = "The unit is moving air, but the cooling temperature split is lower than expected.";
        checks.push("Verify compressor/condenser stage command, economizer position, refrigerant circuit status and filter/coil condition.");
      } else if (temperatureDelta > 25) {
        status = "High cooling split";
        severity = "Warning";
        summary = "A high split can point to low airflow, dirty filters, iced coil or blower issues.";
        checks.push("Check filters, belts, blower speed, static pressure, coil ice and closed dampers.");
      } else {
        status = "Cooling split looks normal";
        summary = "The measured cooling split is in a typical field range. Continue checking capacity, airflow and controls if comfort is still poor.";
      }
      readingNote = `${roundedDelta} F cooling split, calculated as return air minus supply air.`;
    } else if (input.complaint === "no-heating") {
      if (temperatureDelta < 15) {
        status = "Low heat rise";
        severity = "Warning";
        summary = "The unit has little heat rise. Confirm the heat call, heat stage, gas/electric heat enable and safeties.";
        checks.push("Verify heating stage command, gas valve or electric heat enable, limit status and discharge air sensor reading.");
      } else if (temperatureDelta > 70) {
        status = "High heat rise";
        severity = "Warning";
        summary = "A very high heat rise can indicate low airflow or an unsafe heating condition.";
        checks.push("Check filter, blower speed, belts, static pressure and limit circuit before leaving the heat running.");
      } else {
        status = "Heat rise looks normal";
        summary = "The measured heat rise is in a typical field range. Continue checking airflow balance and BAS control logic.";
      }
      readingNote = `${roundedDelta} F heat rise, calculated as supply air minus return air.`;
    } else {
      readingNote = `${Math.abs(roundedDelta)} F temperature difference between supply and return.`;
    }
  }

  if (input.safetyClosed === "no") {
    status = "Safety circuit open";
    severity = "Stop";
    summary = "An open safety must be identified before forcing fan, heat or cooling operation.";
    checks.push("Check smoke shutdown, freezestat, condensate overflow, high limit, low limit, overload and service disconnect status.");
  }

  if (input.fanRunning === "no") {
    status = "Fan not proven";
    severity = severity === "Stop" ? severity : "Warning";
    summary = "Do not troubleshoot temperature split until supply fan operation is proven.";
    checks.push("Verify fan command, VFD/contactor status, belt, overload, phase voltage and airflow proof.");
  }

  if (input.callPresent === "no") {
    status = "No BAS call present";
    severity = severity === "Stop" ? severity : "Warning";
    summary = "The controller is not asking the unit to run this mode, so start at the BAS schedule, setpoint and interlocks.";
    checks.push("Check occupancy schedule, zone demand, discharge setpoint, lockouts, mode and alarm interlocks.");
  }

  if (input.complaint === "poor-airflow") {
    checks.push("Measure filter pressure drop, mixed-air damper position, static pressure and supply fan speed.");
    checks.push("Inspect belts, sheaves, closed fire/smoke dampers and blocked return path.");
  }

  if (input.complaint === "fan-not-running") {
    checks.push("Confirm fan start command at the controller output and at the starter/VFD input.");
    checks.push("Check safeties, HOA position, motor overload, line voltage and whether the BAS is in occupied mode.");
  }

  if (input.callPresent === "unknown") checks.push("Confirm the BAS is commanding the requested mode before changing unit wiring.");
  if (input.safetyClosed === "unknown") checks.push("Prove the safety chain is closed, including smoke shutdown and freeze/limit circuits.");
  if (input.fanRunning === "unknown") checks.push("Verify supply fan status by amperage, airflow proof or VFD output frequency.");
  if (supply === null || ret === null) checks.push("Measure supply and return air temperatures with the fan running and the unit stabilized.");

  checks.push(input.unitType === "rtu"
    ? "For an RTU, compare thermostat/BAS command to compressor, heat and economizer outputs at the unit."
    : "For an AHU, compare BAS command to valve, damper, fan status and discharge air temperature trends.");

  return { status, severity, summary, temperatureDelta, readingNote, checks: [...new Set(checks)] };
}
