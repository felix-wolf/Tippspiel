import type { Event } from "./Event";
import type { AdminSharedEventDiagnostic } from "./Admin";

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

export type CompetitionGroup<T> = {
  key: string;
  label: string;
  level: number;
  events: T[];
};

export type SeasonGroup<T> = {
  key: string;
  seasonId?: string;
  label: string;
  events: T[];
  competitions: CompetitionGroup<T>[];
};

type RaceMetadata = {
  seasonId?: string;
  sourceLevel?: number;
  sourceEventClassificationId?: string;
  startsAt: number;
};

function groupRaces<T>(
  events: T[],
  metadata: (event: T) => RaceMetadata,
  order: "asc" | "desc",
): SeasonGroup<T>[] {
  const seasons = new Map<string, SeasonGroup<T>>();
  const entries = events.map((event) => ({ event, ...metadata(event) }));
  entries.sort(
    (a, b) => (a.startsAt - b.startsAt) * (order === "asc" ? 1 : -1),
  );
  for (const {
    event,
    seasonId: sourceSeasonId,
    sourceLevel,
    sourceEventClassificationId,
  } of entries) {
    const seasonId = sourceSeasonId ?? "unknown";
    let season = seasons.get(seasonId);
    if (!season) {
      season = {
        key: JSON.stringify([seasonId]),
        seasonId: sourceSeasonId,
        label: /^\d{4}$/.test(seasonId)
          ? `Saison ${seasonId.slice(0, 2)}/${seasonId.slice(2)}`
          : "Saison unbekannt",
        events: [],
        competitions: [],
      };
      seasons.set(seasonId, season);
    }
    season.events.push(event);
    const classification = sourceEventClassificationId;
    const key = JSON.stringify([seasonId, classification ?? null]);
    let competition = season.competitions.find((group) => group.key === key);
    if (!competition) {
      competition = {
        key,
        label: classification
          ? classificationLabels[classification] ??
            `Wettbewerb (${classification})`
          : "Unbekannter Wettbewerb",
        level: sourceLevel ?? Number.POSITIVE_INFINITY,
        events: [],
      };
      season.competitions.push(competition);
    }
    competition.level = Math.min(
      competition.level,
      sourceLevel ?? Number.POSITIVE_INFINITY,
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
  return [...seasons.values()].sort((a, b) => {
    if (!a.seasonId) return b.seasonId ? 1 : 0;
    if (!b.seasonId) return -1;
    return a.seasonId.localeCompare(b.seasonId) * (order === "asc" ? 1 : -1);
  });
}

export function groupImportEvents(events: Event[]): SeasonGroup<Event>[] {
  return groupRaces(
    events,
    (event) => ({
      seasonId: event.seasonId,
      sourceLevel: event.sourceLevel,
      sourceEventClassificationId: event.sourceEventClassificationId,
      startsAt: event.datetime.getTime(),
    }),
    "asc",
  );
}

export function groupAdminSharedEvents(
  events: AdminSharedEventDiagnostic[],
): SeasonGroup<AdminSharedEventDiagnostic>[] {
  return groupRaces(
    events,
    (event) => ({
      seasonId: event.seasonId,
      sourceLevel: event.sourceLevel,
      sourceEventClassificationId: event.sourceEventClassificationId,
      startsAt: Date.parse(event.datetime.replace(" ", "T")),
    }),
    "desc",
  );
}
