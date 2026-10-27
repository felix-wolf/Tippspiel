import type { Event } from "../../../models/Event";

export { groupImportEvents } from "../../../models/raceGroups";

export function selectImportEvents(
  selectedIds: string[],
  events: Event[],
  selected: boolean,
): string[] {
  const next = new Set(selectedIds);
  for (const event of events) {
    if (selected) next.add(event.id);
    else next.delete(event.id);
  }
  return [...next];
}
