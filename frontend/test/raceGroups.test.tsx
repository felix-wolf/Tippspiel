import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AdminSharedEventDiagnostic } from "../src/models/Admin";
import { Event } from "../src/models/Event";
import {
  groupAdminSharedEvents,
  groupImportEvents,
} from "../src/models/raceGroups";
import { AdminSharedEventList } from "../src/components/domain/lists/AdminSharedEventList";

function race(
  id: string,
  overrides: Partial<AdminSharedEventDiagnostic> = {},
): AdminSharedEventDiagnostic {
  return {
    sharedEventId: id,
    targetEventId: id,
    name: `Race ${id}`,
    datetime: "2026-01-01 12:00:00",
    eventTypeId: "women",
    seasonId: "2526",
    sourceLevel: 1,
    sourceEventClassificationId: "BTSWRLCP",
    linkedEventCount: 2,
    withResultsCount: 1,
    withoutResultsCount: 1,
    linkedEvents: [],
    flags: {
      canRefreshResults: true,
      missingResults: true,
      hasInconsistentResultState: true,
      missingSourceMapping: true,
      hasMultipleLinkedGames: true,
    },
    ...overrides,
  };
}

describe("shared race grouping", () => {
  it("uses the same classification labels and separation as the importer", () => {
    const adminRaces = [
      race("world"),
      race("olympics", { sourceEventClassificationId: "BTSWRLOG" }),
      race("ibu", { sourceLevel: 2, sourceEventClassificationId: "BTSIBUCP" }),
      race("europeans", {
        sourceLevel: 2,
        sourceEventClassificationId: "BTSCEUCH",
      }),
      race("new", { sourceLevel: 3, sourceEventClassificationId: "FUTURE" }),
      race("unknown", {
        sourceLevel: undefined,
        sourceEventClassificationId: undefined,
      }),
    ];
    const importRaces = adminRaces.map((item) =>
      Event.fromJson({
        id: item.sharedEventId,
        name: item.name,
        game_id: "game",
        event_type: { id: "women" },
        datetime: item.datetime,
        bets: [],
        results: [],
        season_id: item.seasonId,
        source_level: item.sourceLevel,
        source_event_classification_id: item.sourceEventClassificationId,
      }),
    );
    const adminGroups = groupAdminSharedEvents(adminRaces);
    const importGroups = groupImportEvents(importRaces);
    expect(adminGroups[0].competitions.map((group) => group.label)).toEqual([
      "Olympische Winterspiele",
      "World Cup",
      "Europameisterschaften",
      "IBU Cup",
      "Wettbewerb (FUTURE)",
      "Unbekannter Wettbewerb",
    ]);
    expect(adminGroups[0].competitions.map((group) => group.key)).toEqual(
      importGroups[0].competitions.map((group) => group.key),
    );
  });

  it("orders admin seasons and races newest first without changing input or records", () => {
    const old = race("old");
    const newer = race("newer", { datetime: "2026-01-02 12:00:00" });
    const nextSeason = race("next", {
      seasonId: "2627",
      datetime: "2026-11-01 12:00:00",
    });
    const unknown = race("unknown", { seasonId: undefined });
    const items = [old, nextSeason, newer, unknown];
    const groups = groupAdminSharedEvents(items);
    expect(groups.map((group) => group.label)).toEqual([
      "Saison 26/27",
      "Saison 25/26",
      "Saison unbekannt",
    ]);
    expect(groups[1].competitions[0].events).toEqual([newer, old]);
    expect(groups[1].competitions[0].events[0]).toBe(newer);
    expect(items).toEqual([old, nextSeason, newer, unknown]);
    const filtered = groupAdminSharedEvents(
      items.filter((item) => item.sharedEventId === "old"),
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].events).toHaveLength(1);
    expect(filtered[0].competitions).toHaveLength(1);
  });
});

describe("admin shared event list", () => {
  const old = race("old");
  const newer = race("newer", { datetime: "2026-01-02 12:00:00" });
  const events = [old, newer];
  const [season] = groupAdminSharedEvents(events);
  const [competition] = season.competitions;
  const render = (
    keys: string[],
    items = events,
    selected: string | null = null,
  ) =>
    renderToStaticMarkup(
      <AdminSharedEventList
        events={items}
        expandedGroups={new Set(keys)}
        selectedSharedEventId={selected}
        onSelect={vi.fn()}
        onToggleGroup={vi.fn()}
      />,
    );

  it("starts with collapsed seasons and no visible competitions or race cards", () => {
    const markup = render([]);
    expect(markup).toContain("Saison 25/26");
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain("2 Rennen");
    expect(markup).not.toContain("World Cup");
    expect(markup).not.toContain("Race old");
  });

  it("reveals competition headers before race cards", () => {
    const markup = render([season.key]);
    expect(markup).toContain("World Cup");
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).not.toContain("Race old");
  });

  it("preserves diagnostic badges and selected styling in newest-first cards", () => {
    const markup = render([season.key, competition.key], events, "old");
    expect(markup.indexOf("Race newer")).toBeLessThan(
      markup.indexOf("Race old"),
    );
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain("1/2 mit Ergebnissen");
    expect(markup).toContain("Mehrfach verknüpft");
    expect(markup).toContain("Source fehlt");
  });

  it("shows filtered counts without expanding groups and retains the empty state", () => {
    const markup = render([], [old]);
    expect(markup).toContain("1 Rennen");
    expect(markup).not.toContain("Race old");
    expect(render([], [])).toContain(
      "Keine Shared Events für den aktuellen Filter.",
    );
  });
});
