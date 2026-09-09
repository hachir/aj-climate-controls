type SearchableEquipment = {
  name: string;
  type: string;
  location: string;
  status: string;
};

export function filterEquipment<T extends SearchableEquipment>(equipment: T[], query: string, status = "All"): T[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length && status === "All") return equipment;

  return equipment.filter((item) => {
    if (status !== "All" && item.status !== status) return false;
    const text = [item.name, item.type, item.location].join(" ").toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
