export type VoltageStatus = "Low output" | "Mid-range output" | "High output" | "Full command" | "Out of range";

export function diagnoseVoltage(reading: string): {
  voltage: number; status: VoltageStatus; note: string;
  commandPercent: number | null; warning: string | null; checks: string[];
} | null {
  // Accept decimal meter readings, including negatives, but never coerce blank text to zero.
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(reading.trim())) return null;
  const voltage = Number(reading);
  if (!Number.isFinite(voltage)) return null;

  if (voltage < 0 || voltage > 10) {
    return { voltage, status: "Out of range", commandPercent: null,
      warning: voltage > 10 ? "Warning: above 10 VDC — outside the configured signal range. Check the device input rating before continuing." : "Negative voltage — verify meter polarity and signal common.",
      checks: voltage > 10 ? [
        "Confirm the meter is set to DC volts and the probes are on analog output and its designated signal common, not the power supply terminals.",
        "Verify voltage/current output selection and the receiving actuator or VFD input configuration against the wiring diagram.",
        "Check for supply voltage on the signal wire or an incorrect common. De-energize equipment before changing wiring and follow the manufacturer's procedure.",
      ] : [
        "Verify the red probe is on analog output and the black probe is on its designated signal common.",
        "Check the common wiring and compare measurements at the controller and receiving device using their specified reference terminals.",
      ], note: voltage < 0
      ? "Below 0 V. Check meter polarity and the signal common, then compare with the controller specification."
      : "Above 10 V. Verify the measurement points and the configured signal type against the controller specification." };
  }
  const signal = { voltage, commandPercent: voltage * 10, warning: null };
  const compareSignal = "Compare the controller command with the measured signal (50% = 5 V for direct-acting 0–10 V). Check overrides, limits and output scaling if they disagree.";
  const checkAtDevice = "Compare the signal at the controller and actuator or VFD input using the specified signal common. A difference points to wiring, common or loading issues.";
  const checkResponse = "If the signal matches the command but the device does not respond, check actuator power and travel, or VFD run enable, local/remote mode, speed limits and active faults.";
  if (voltage < 2) return { ...signal, status: "Low output", note: "Near the bottom of the 0–10 V range. A low reading may be normal at low demand; it alone does not confirm a failed output.", checks: [compareSignal, checkAtDevice, "Confirm whether the receiver actually expects 2–10 V. Below 2 V can have a device-specific minimum or loss-of-signal response."] };
  if (voltage < 8) return { ...signal, status: "Mid-range output", note: "A partial command within the 0–10 V range. Confirm that the controller is requesting a partial output.", checks: [compareSignal, checkAtDevice, checkResponse] };
  if (voltage < 10) return { ...signal, status: "High output", note: "Near the top of the 0–10 V range, but below full command. Compare with the requested controller output.", checks: [compareSignal, checkAtDevice, checkResponse] };
  return { ...signal, status: "Full command", note: "Full signal command for a direct-acting 0–10 V configuration. This does not prove full actuator travel or full VFD speed.", checks: [compareSignal, checkAtDevice, checkResponse] };
}
