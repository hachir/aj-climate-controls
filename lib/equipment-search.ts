type SearchableEquipment = {
  name: string;
  type: string;
  location: string;
  status: string;
};

export const defaultEquipmentView = { query: "", status: "All", sort: "default" } as const;

export function isEquipmentViewCustomized(query: string, status: string, sort: string): boolean {
  return query !== defaultEquipmentView.query || status !== defaultEquipmentView.status || sort !== defaultEquipmentView.sort;
}

function searchText(value: string): string {
  return value.toLowerCase()
    // Split letter/number boundaries consistently for RTU01, RTU-01 and
    // RTU 01. Keep digits (including leading zeros) and other punctuation.
    .replace(/(\p{L})[-_\u2010-\u2015\u2212]?(?=\p{N})/gu, "$1 ")
    .replace(/(\p{N})[-_\u2010-\u2015\u2212]?(?=\p{L})/gu, "$1 ");
}

export function filterEquipment<T extends SearchableEquipment>(equipment: T[], query: string, status = "All"): T[] {
  const terms = searchText(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length && status === "All") return equipment;

  return equipment.filter((item) => {
    if (status !== "All" && item.status !== status) return false;
    const text = [item.name, item.type, item.location].map(searchText).join(" ");
    // Avoid selecting RTU-101 when searching for RTU01. Numeric groups
    // retain leading zeros; ordinary words still support partial matching.
    const numbers = new Set(text.match(/\p{N}+/gu) ?? []);
    return terms.every((term) => /^\p{N}+$/u.test(term) ? numbers.has(term) : text.includes(term));
  });
}
