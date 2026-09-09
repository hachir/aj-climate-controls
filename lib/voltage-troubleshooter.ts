export type VoltageStatus = "Low output" | "Mid-range output" | "High output" | "Full command" | "Out of range";

export function diagnoseVoltage(reading: string): { voltage: number; status: VoltageStatus; note: string } | null {
  // Accept decimal meter readings, including negatives, but never coerce blank text to zero.
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(reading.trim())) return null;
  const voltage = Number(reading);
  if (!Number.isFinite(voltage)) return null;

  if (voltage < 0 || voltage > 10) {
    return { voltage, status: "Out of range", note: voltage < 0
      ? "Below 0 V. Check meter polarity and the signal common, then compare with the controller specification."
      : "Above 10 V. Verify the measurement points and the configured signal type against the controller specification." };
  }
  if (voltage < 2) return { voltage, status: "Low output", note: "Near the bottom of the 0–10 V range. Compare with the requested controller output; a low reading alone does not confirm a fault." };
  if (voltage < 8) return { voltage, status: "Mid-range output", note: "A partial command within the 0–10 V range. Compare the reading with the requested controller output." };
  if (voltage < 10) return { voltage, status: "High output", note: "Near the top of the 0–10 V range, but below full command. Compare with the requested controller output." };
  return { voltage, status: "Full command", note: "At the top of the 0–10 V range. This indicates full signal command for a direct-acting 0–10 V configuration; confirm the equipment response separately." };
}
