export type ToolDirectoryEntry = {
  href: string;
  icon: "Zap" | "Gauge" | "Cable" | "Settings2" | "Fan" | "Siren" | "Flame" | "Waves";
  title: string;
  description: string;
  keywords: string;
};

export const toolDirectory: ToolDirectoryEntry[] = [
  {
    "href": "/tools/voltage-troubleshooter",
    "icon": "Zap",
    "title": "0–10 VDC Output Troubleshooting Tool",
    "description": "Diagnose signal levels, flag readings above 10 VDC and follow practical controller, actuator and VFD checks.",
    "keywords": "voltage analog output ao actuator"
  },
  {
    "href": "/tools/signal-converter",
    "icon": "Gauge",
    "title": "Control Signal Converter",
    "description": "Convert 0-10 VDC, 2-10 VDC and 4-20 mA readings into command percent and equivalent signal values.",
    "keywords": "signal scaling milliamps percent"
  },
  {
    "href": "/tools/bacnet-mstp",
    "icon": "Cable",
    "title": "BACnet MS/TP Checkout Tool",
    "description": "Check offline devices, baud and termination issues; plan addresses, find duplicate entries and copy an address plan report.",
    "keywords": "network communications mstp offline address planner device instance mac field report"
  },
  {
    "href": "/tools/vfd-checkout",
    "icon": "Settings2",
    "title": "VFD Checkout Tool",
    "description": "Trace Auto/Remote mode, run command, safety permissives, faults and 0-10 VDC reference, then copy a field checkout report.",
    "keywords": "drive motor speed frequency field report"
  },
  {
    "href": "/tools/rtu-ahu-checkout",
    "icon": "Fan",
    "title": "RTU/AHU Checkout Tool",
    "description": "Use BAS call, fan status, safeties and supply/return air readings to pick the next diagnostic step.",
    "keywords": "rooftop air handling unit heating cooling"
  },
  {
    "href": "/tools/fire-alarm-shutdown",
    "icon": "Siren",
    "title": "Fire Alarm Shutdown Checkout Tool",
    "description": "Verify dry contact action, VFD input monitor changes, programming polarity and matching shutdown across drives.",
    "keywords": "fire safety shutdown dry contact"
  },
  {
    "href": "/tools/boiler-ignition-checkout",
    "icon": "Flame",
    "title": "Boiler Ignition Checkout Tool",
    "description": "Trace enable, heat demand, pre-purge, ignition attempt, flame proving and lockout conditions.",
    "keywords": "boiler flame failure lockout gas pressure cascade leader member burner spark purge"
  },
  {
    "href": "/tools/boiler-flow-checkout",
    "icon": "Gauge",
    "title": "Boiler Flow Checkout Tool",
    "description": "Trace demand, burner, pump command, valve position, water circulation and high-limit conditions.",
    "keywords": "boiler pump flow high limit over temperature lockout circulation valves strainer differential pressure delta t"
  },
  {
    "href": "/tools/hydronic-terminal-checkout",
    "icon": "Waves",
    "title": "Hydronic Terminal Checkout Tool",
    "description": "Trace thermostat demand, hot water, valve command, actuator position, flow and terminal heat delivery.",
    "keywords": "unit heater fan coil fin tube baseboard radiator hydronic thermostat valve actuator balancing flow"
  },
  {
    "href": "#field-calculators",
    "icon": "Gauge",
    "title": "Field Calculators",
    "description": "Calculate temperature split, superheat, subcooling, round or rectangular duct airflow and HVAC capacity conversions.",
    "keywords": "cfm btu tons kw delta t refrigerant"
  }
];

export function toolSearchWords(value: string): string[] {
  return value.toLowerCase()
    // Apply the same normalization to queries and directory text. Limit unit
    // aliases to complete tokens so VAC, VAV and unrelated words are unchanged.
    .replace(/(\d)(vdc|v|ma)\b/g, "$1 $2")
    .replace(/\bv(?:dc)?\b/g, "vdc")
    .replace(/(\d)\s+to\s+(?=\d)/g, "$1 ")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/).filter(Boolean);
}

export function searchTools(query: string): ToolDirectoryEntry[] {
  const terms = toolSearchWords(query);
  return toolDirectory.filter((tool) => {
    const searchable = toolSearchWords(`${tool.title} ${tool.description} ${tool.keywords}`).join(" ");
    return terms.every((term) => searchable.includes(term));
  });
}
