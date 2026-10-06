export type SignalRangeKey = "0-10v" | "2-10v" | "4-20ma";

export type SignalConversion = {
  value: number;
  label: string;
  unit: string;
  percent: number;
  clampedPercent: number;
  status: "Below range" | "Valid signal" | "Above range";
  warning: string | null;
  equivalents: {
    zeroToTenV: number;
    twoToTenV: number;
    fourToTwentyMa: number;
  };
};

export const signalRanges: Record<SignalRangeKey, { label: string; unit: string; min: number; max: number; hint: string }> = {
  "0-10v": {
    label: "0-10 VDC",
    unit: "VDC",
    min: 0,
    max: 10,
    hint: "Common for VFD speed commands, actuators and controller analog outputs.",
  },
  "2-10v": {
    label: "2-10 VDC",
    unit: "VDC",
    min: 2,
    max: 10,
    hint: "Often used where 2 V is the minimum live command and below 2 V may indicate signal loss.",
  },
  "4-20ma": {
    label: "4-20 mA",
    unit: "mA",
    min: 4,
    max: 20,
    hint: "Current loop signal. Measure in series only with the correct meter setup.",
  },
};

const decimalPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;

export function convertSignal(reading: string, rangeKey: SignalRangeKey): SignalConversion | null {
  const trimmed = reading.trim();
  if (!decimalPattern.test(trimmed) || trimmed.length > 60) return null;

  const value = Number(trimmed);
  const range = signalRanges[rangeKey];
  if (!Number.isFinite(value) || !range) return null;

  const span = range.max - range.min;
  const percent = ((value - range.min) / span) * 100;
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const status = value < range.min ? "Below range" : value > range.max ? "Above range" : "Valid signal";

  return {
    value,
    label: range.label,
    unit: range.unit,
    percent,
    clampedPercent,
    status,
    warning: status === "Valid signal"
      ? null
      : `${value} ${range.unit} is outside the normal ${range.label} signal range.`,
    equivalents: {
      zeroToTenV: clampedPercent / 10,
      twoToTenV: 2 + (clampedPercent / 100) * 8,
      fourToTwentyMa: 4 + (clampedPercent / 100) * 16,
    },
  };
}
