import { describe, expect, it } from "vitest";
import { Event } from "../src/models/Event";
import {
  groupImportEvents,
  selectImportEvents,
} from "../src/components/domain/lists/eventImportGroups";

function race(
  id: string,
  classification?: string,
  level?: number,
  season = "2526",
  day = 1,
) {
  return Event.fromJson({
    id,
    name: id,
    game_id: "game",
    event_type: { id: "women", name: "women" },
    datetime: `2026-01-${String(day).padStart(2, "0")} 12:00:00`,
    bets: [],
    results: [],
    season_id: season,
    source_level: level,
    source_event_classification_id: classification,
  });
}

describe("IBU import groups", () => {
  it("separates cups and championships at the same level and sorts races without mutating input", () => {
    const events = [
      race("world-late", "BTSWRLCP", 1, "2526", 3),
      race("ibu", "BTSIBUCP", 2),
      race("olympics", "BTSWRLOG", 1),
      race("world-early", "BTSWRLCP", 1),
      race("europeans", "BTSCEUCH", 2),
    ];
    const originalOrder = events.map((event) => event.id);
    const [season] = groupImportEvents(events);
    expect(season.label).toBe("Saison 25/26");
    expect(season.competitions.map((group) => group.label)).toEqual([
      "Olympische Winterspiele",
      "World Cup",
      "Europameisterschaften",
      "IBU Cup",
    ]);
    expect(season.competitions[1].events.map((event) => event.id)).toEqual([
      "world-early",
      "world-late",
    ]);
    expect(events.map((event) => event.id)).toEqual(originalOrder);
  });

  it("keeps the same cup separate across seasons and includes unknown classifications", () => {
    const groups = groupImportEvents([
      race("a", "BTSWRLCP", 1),
      race("b", "BTSWRLCP", 1, "2627"),
      race("c", "NEW_CLASS", 3),
      race("d"),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].competitions[0].key).not.toBe(
      groups[1].competitions[0].key,
    );
    expect(groups[0].competitions.map((group) => group.label)).toEqual([
      "World Cup",
      "Wettbewerb (NEW_CLASS)",
      "Unbekannter Wettbewerb",
    ]);
  });

  it("combines group selections, supports individual exceptions, and preserves other seasons", () => {
    const world = [race("a", "BTSWRLCP", 1), race("b", "BTSWRLCP", 1)];
    const ibu = [race("c", "BTSIBUCP", 2)];
    let selected = selectImportEvents(["another-season"], world, true);
    selected = selectImportEvents(selected, ibu, true);
    selected = selectImportEvents(selected, world, true);
    expect(selected).toEqual(["another-season", "a", "b", "c"]);
    selected = selectImportEvents(selected, [world[0]], false);
    expect(selected).toEqual(["another-season", "b", "c"]);
    selected = selectImportEvents(selected, ibu, false);
    expect(selected).toEqual(["another-season", "b"]);
    expect(selectImportEvents(selected, [...world, ...ibu], false)).toEqual([
      "another-season",
    ]);
  });

  it("retains classification metadata through frontend parsing and serialization", () => {
    const event = race("world", "BTSWRLCP", 1);
    expect(event.toPayload()).toMatchObject({
      source_level: 1,
      source_event_classification_id: "BTSWRLCP",
    });
    expect(Event.fromJson(event.toPayload()).sourceEventClassificationId).toBe(
      "BTSWRLCP",
    );
  });
});
