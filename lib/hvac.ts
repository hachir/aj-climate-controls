export type TemperatureUnit = "F" | "C";
export type TemperatureTool = "split" | "superheat" | "subcooling";
export type CapacityUnit = "btu" | "tons" | "kw";

// NIST SP 811: international-table BTU and refrigeration tons.
const KW_PER_BTU_H = 0.0002930710701722222;

export function readMeasurement(value: string): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function convertTemperature(value: number, from: TemperatureUnit, to: TemperatureUnit) {
  if (from === to) return value;
  return to === "C" ? (value - 32) * 5 / 9 : value * 9 / 5 + 32;
}

export function isValidTemperature(value: number | null, unit: TemperatureUnit) {
  return value !== null && Number.isFinite(value) && value >= (unit === "F" ? -459.67 : -273.15);
}

export function temperatureDifference(
  tool: TemperatureTool,
  first: number | null,
  second: number | null,
  unit: TemperatureUnit,
  mode: "cooling" | "heating" = "cooling",
): number | null {
  if (!isValidTemperature(first, unit) || !isValidTemperature(second, unit)) return null;
  // First / second: return / supply, suction / dew, or bubble / liquid.
  const difference = tool === "split" && mode === "heating" ? second! - first! : first! - second!;
  return Number.isFinite(difference) ? difference : null;
}

export function ductAirflow(
  shape: "round" | "rectangular",
  unit: "imperial" | "metric",
  velocity: number | null,
  widthOrDiameter: number | null,
  height: number | null = null,
): { cfm: number; litersPerSecond: number; area: number } | null {
  if (velocity === null || widthOrDiameter === null || !Number.isFinite(velocity) ||
      !Number.isFinite(widthOrDiameter) || velocity < 0 || widthOrDiameter <= 0) return null;
  if (shape === "rectangular" && (height === null || !Number.isFinite(height) || height <= 0)) return null;
  const squareUnits = shape === "round" ? Math.PI * (widthOrDiameter / 2) ** 2 : widthOrDiameter * height!;
  const area = squareUnits / (unit === "imperial" ? 144 : 1_000_000);
  const cfm = unit === "imperial" ? velocity * area : velocity * area / 0.0004719474432;
  const litersPerSecond = cfm * 0.4719474432;
  if (![area, cfm, litersPerSecond].every(Number.isFinite)) return null;
  return { cfm, litersPerSecond, area };
}

export function convertCapacity(value: number | null, unit: CapacityUnit) {
  if (value === null || !Number.isFinite(value) || value < 0) return null;
  const btu = unit === "tons" ? value * 12_000 : unit === "kw" ? value / KW_PER_BTU_H : value;
  const tons = btu / 12_000;
  const kw = btu * KW_PER_BTU_H;
  return [btu, tons, kw].every(Number.isFinite) ? { btu, tons, kw } : null;
}
