import type { Event } from "../../../models/Event";

const classificationLabels: Record<string, string> = {
  BTSWRLCP: "World Cup",
  BTSIBUCP: "IBU Cup",
  BTSWRLOG: "Olympische Winterspiele",
  BTSWRLCH: "Weltmeisterschaften",
  BTSCEUCH: "Europameisterschaften",
  BTJIBUCP: "Junior Cup",
  BTJCEUCH: "Junioren-Europameisterschaften",
  BTJWRLCH: "Jugend- und Junioren-Weltmeisterschaften",
  SBSIBUL1: "Loop One Festival",
};

export type CompetitionGroup = {
  key: string;
  label: string;
  level: number;
  events: Event[];
};

export type SeasonGroup = {
  key: string;
  label: string;
  events: Event[];
  competitions: CompetitionGroup[];
};

export function groupImportEvents(events: Event[]): SeasonGroup[] {
  const seasons = new Map<string, SeasonGroup>();
  for (const event of [...events].sort(
    (a, b) => a.datetime.getTime() - b.datetime.getTime(),
  )) {
    const seasonId = event.seasonId ?? "unknown";
    let season = seasons.get(seasonId);
    if (!season) {
      season = {
        key: JSON.stringify([seasonId]),
        label: /^\d{4}$/.test(seasonId)
          ? `Saison ${seasonId.slice(0, 2)}/${seasonId.slice(2)}`
          : "Saison unbekannt",
        events: [],
        competitions: [],
      };
      seasons.set(seasonId, season);
    }
    season.events.push(event);
    const classification = event.sourceEventClassificationId;
    const key = JSON.stringify([seasonId, classification ?? null]);
    let competition = season.competitions.find((group) => group.key === key);
    if (!competition) {
      competition = {
        key,
        label: classification
          ? classificationLabels[classification] ??
            `Wettbewerb (${classification})`
          : "Unbekannter Wettbewerb",
        level: event.sourceLevel ?? Number.POSITIVE_INFINITY,
        events: [],
      };
      season.competitions.push(competition);
    }
    competition.level = Math.min(
      competition.level,
      event.sourceLevel ?? Number.POSITIVE_INFINITY,
    );
    competition.events.push(event);
  }
  for (const season of seasons.values()) {
    season.competitions.sort(
      (a, b) =>
        (a.level === b.level ? 0 : a.level < b.level ? -1 : 1) ||
        a.label.localeCompare(b.label, "de"),
    );
  }
  return [...seasons.values()];
}

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
