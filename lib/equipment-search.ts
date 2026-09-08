type SearchableEquipment = {
  name: string;
  type: string;
  location: string;
};

export function filterEquipment<T extends SearchableEquipment>(equipment: T[], query: string): T[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return equipment;

  return equipment.filter((item) => {
    const text = [item.name, item.type, item.location].join(" ").toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
