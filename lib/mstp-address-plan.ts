export type AddressRow = {
  device: string;
  trunk: string;
  mac: string;
  instance: string;
};

export const emptyAddressRow: AddressRow = { device: "", trunk: "", mac: "", instance: "" };
export const MAX_PLAN_ROWS = 40;

type Issue = {
  kind: "missing" | "invalid" | "duplicate";
  field: keyof AddressRow;
  rows: number[];
  message: string;
};

function parseAddress(value: string, max: number) {
  const text = value.trim();
  if (!/^\d+$/.test(text)) return null;
  const n = Number(text);
  return Number.isInteger(n) && n <= max ? n : null;
}

export function checkAddressPlan(rows: AddressRow[]) {
  const issues: Issue[] = [];
  const macs = new Map<string, { trunk: string; mac: number; rows: number[] }>();
  const instances = new Map<number, number[]>();
  let entered = 0;

  rows.forEach((row, index) => {
    if (!Object.values(row).some((value) => value.trim())) return;
    entered++;
    const number = index + 1;
    const trunk = row.trunk.trim().replace(/\s+/g, " ");
    if (!trunk) issues.push({ kind: "missing", field: "trunk", rows: [number], message: `Row ${number}: enter a trunk label.` });

    const mac = parseAddress(row.mac, 254);
    const instance = parseAddress(row.instance, 4194302);
    for (const [field, parsed, label, max] of [
      ["mac", mac, "MAC address", "254"],
      ["instance", instance, "device instance", "4194302"],
    ] as const) {
      if (parsed !== null) continue;
      const missing = !row[field].trim();
      issues.push({
        kind: missing ? "missing" : "invalid", field, rows: [number],
        message: missing ? `Row ${number}: enter the ${label}.` : `Row ${number}: ${label} must be a whole number from 0 to ${max}.`,
      });
    }
    if (trunk && mac !== null) {
      const key = JSON.stringify([trunk.toLowerCase(), mac]);
      const entry = macs.get(key) ?? { trunk, mac, rows: [] };
      entry.rows.push(number);
      macs.set(key, entry);
    }
    if (instance !== null) {
      const group = instances.get(instance) ?? [];
      group.push(number);
      instances.set(instance, group);
    }
  });

  for (const entry of macs.values()) {
    if (entry.rows.length < 2) continue;
    issues.push({
      kind: "duplicate", field: "mac", rows: entry.rows,
      message: `MAC ${entry.mac} repeats on trunk “${entry.trunk}” (rows ${entry.rows.join(", ")}).`,
    });
  }
  for (const [instance, group] of instances) {
    if (group.length < 2) continue;
    issues.push({
      kind: "duplicate", field: "instance", rows: group,
      message: `Device instance ${instance} repeats (rows ${group.join(", ")}).`,
    });
  }
  return { entered, issues };
}
