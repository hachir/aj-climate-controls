export type FieldAnswer = "yes" | "no" | "unknown";
export type TerminalType = "unit-heater" | "fan-coil" | "fin-tube";

export type HydronicTerminalInput = {
  terminalType: TerminalType;
  callForHeat: FieldAnswer;
  hotWaterAvailable: FieldAnswer;
  valveCommand: FieldAnswer;
  actuatorOpen: FieldAnswer;
  waterFlow: FieldAnswer;
  fanRunning: FieldAnswer;
  spaceWarming: FieldAnswer;
};

export type HydronicTerminalDiagnosis = {
  status: string;
  severity: "Verified" | "Warning" | "Guided check";
  summary: string;
  checks: string[];
};

const usesFan = (type: TerminalType) => type !== "fin-tube";

export function diagnoseHydronicTerminal(input: HydronicTerminalInput): HydronicTerminalDiagnosis {
  const checks: string[] = [];
  let status = "Follow the heating path";
  let severity: HydronicTerminalDiagnosis["severity"] = "Guided check";
  let summary = "Trace the call, hot-water source, valve command, actuator position, water flow and heat delivery in order.";

  if (input.callForHeat === "no") {
    status = "No heat call";
    severity = "Warning";
    summary = "The terminal cannot heat until its thermostat or controller requests heat.";
    checks.push("Check room temperature, setpoint, occupied schedule, heating mode and thermostat/controller input.");
    checks.push("Confirm the displayed temperature units and sensor reading are correct before changing the setpoint.");
  } else if (input.hotWaterAvailable === "no") {
    status = "No hot water at terminal";
    severity = "Warning";
    summary = "A heat call is present, but usable hot water is not reaching the terminal supply.";
    checks.push("Verify boiler operation, loop temperature, pump status, isolation valves and system differential pressure.");
    checks.push("Compare supply-pipe temperature at the terminal with the main loop before troubleshooting its controls.");
  } else if (input.valveCommand === "no") {
    status = "No valve command";
    severity = "Warning";
    summary = "Heat and hot water are available, but the controller is not commanding the valve open.";
    checks.push("Check the sequence, output point, interlocks and configured signal type at the controller.");
    checks.push("Measure the output at the controller and again at the actuator to separate programming from field wiring.");
  } else if (input.actuatorOpen === "no") {
    status = "Actuator did not open";
    severity = "Warning";
    summary = "The valve command is present, but the actuator or valve is not reaching the open position.";
    checks.push("Verify actuator supply voltage, control signal, common, direction and manual override position.");
    checks.push("Inspect the linkage/adapter and prove the valve stem moves freely without forcing it.");
  } else if (input.waterFlow === "no") {
    status = "No water flow through coil";
    severity = "Warning";
    summary = "The actuator appears open, but flow or heat transfer is not established through the terminal.";
    checks.push("Confirm isolation and balancing valves are open, then check for air lock, plugged strainer, stuck valve or low loop pressure.");
    checks.push("Compare entering and leaving water temperatures and verify flow using the approved balancing method.");
  } else if (usesFan(input.terminalType) && input.fanRunning === "no") {
    status = "Fan not running";
    severity = "Warning";
    summary = "Hot-water flow is available, but the terminal fan is not moving heat into the space.";
    checks.push("Verify fan enable, relay, speed tap, line voltage, motor overload and any fan-temperature interlock.");
  } else if (input.spaceWarming === "no") {
    status = "Heat not reaching the space";
    severity = "Warning";
    summary = "The command path appears complete, but the space is not warming as expected.";
    checks.push(usesFan(input.terminalType)
      ? "Measure entering/leaving air temperature, confirm fan direction and airflow, and inspect the coil for blockage."
      : "Check enclosure airflow, element temperature, furniture/cover blockage and whether the loop temperature matches the design.");
    checks.push("Allow the system to stabilize, then compare room temperature trend against the active setpoint.");
  } else if (
    input.callForHeat === "yes" && input.hotWaterAvailable === "yes" && input.valveCommand === "yes" &&
    input.actuatorOpen === "yes" && input.waterFlow === "yes" && input.spaceWarming === "yes" &&
    (!usesFan(input.terminalType) || input.fanRunning === "yes")
  ) {
    status = "Heating path verified";
    severity = "Verified";
    summary = "The heat call, water path and terminal output are all responding during this check.";
    checks.push(usesFan(input.terminalType)
      ? "Record setpoint, room temperature, water temperatures and final actuator/fan operation for closeout."
      : "Record setpoint, room temperature, water temperatures and final valve position for closeout.");
  }

  if (input.callForHeat === "unknown") checks.push("Create or confirm a heat demand at the thermostat/controller before testing downstream components.");
  if (input.hotWaterAvailable === "unknown") checks.push("Measure the terminal supply-pipe temperature and confirm the pump and boiler loop are operating.");
  if (input.valveCommand === "unknown") checks.push("Check the controller output or relay state while a heat call is active.");
  if (input.actuatorOpen === "unknown") checks.push("Observe actuator position and confirm the valve stem follows the command.");
  if (input.waterFlow === "unknown") checks.push("Prove flow with pipe temperatures and the approved balancing method; touch alone is not a final measurement.");
  if (usesFan(input.terminalType) && input.fanRunning === "unknown") checks.push("Verify fan operation and airflow while the heating valve is open.");
  if (input.spaceWarming === "unknown") checks.push("Measure discharge/element temperature and trend the space temperature after stabilization.");

  return { status, severity, summary, checks: [...new Set(checks)] };
}
