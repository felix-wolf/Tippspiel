import { afterEach, describe, expect, it, vi } from "vitest";

import { Admin } from "../src/models/Admin";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Admin shared event diagnostics", () => {
  it("maps shared event diagnostics from the admin API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify([
          {
            shared_event_id: "official:ibu:race-1",
            target_event_id: "event-1",
            name: "Antholz - Women Sprint",
            location: "Antholz",
            race_format: "sprint",
            datetime: "2026-03-11 15:00:00",
            event_type_id: "sprint",
            source_provider: "ibu",
            source_event_id: "event-source-1",
            source_race_id: "race-1",
            season_id: "2526",
            linked_event_count: 2,
            with_results_count: 1,
            without_results_count: 1,
            linked_events: [
              {
                event_id: "event-1",
                event_name: "Antholz - Women Sprint",
                game_id: "game-1",
                game_name: "Liga A",
                has_results: true,
              },
            ],
            flags: {
              can_refresh_results: true,
              missing_results: true,
              has_inconsistent_result_state: true,
              missing_source_mapping: false,
              has_multiple_linked_games: true,
            },
          },
        ]),
      status: 200,
      statusText: "OK",
    } as Response);

    const diagnostics = await Admin.fetchSharedEvents();

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].sharedEventId).toBe("official:ibu:race-1");
    expect(diagnostics[0].linkedEvents[0].gameName).toBe("Liga A");
    expect(diagnostics[0].flags.canRefreshResults).toBe(true);
    expect(diagnostics[0].flags.hasMultipleLinkedGames).toBe(true);
  });

  it("sends source update payloads to the shared event endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          shared_event_id: "official:ibu:race-updated",
          target_event_id: "event-1",
          name: "Antholz - Women Sprint",
          datetime: "2026-03-11 15:00:00",
          event_type_id: "sprint",
          linked_event_count: 1,
          with_results_count: 0,
          without_results_count: 1,
          linked_events: [],
          flags: {
            can_refresh_results: true,
            missing_results: true,
            has_inconsistent_result_state: false,
            missing_source_mapping: false,
            has_multiple_linked_games: false,
          },
        }),
      status: 200,
      statusText: "OK",
    } as Response);

    const response = await Admin.updateSharedEventSource("official:ibu:race-1", {
      source_provider: "ibu",
      source_event_id: "event-updated",
      source_race_id: "race-updated",
      season_id: "2627",
    });

    expect(response.sharedEventId).toBe("official:ibu:race-updated");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/shared-events/official%3Aibu%3Arace-1/source",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          source_provider: "ibu",
          source_event_id: "event-updated",
          source_race_id: "race-updated",
          season_id: "2627",
        }),
      }),
    );
  });
});

describe("Admin country diagnostics", () => {
  it("maps missing-country diagnostics", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify([
          {
            code: "BRT",
            name: "BRT",
            flag: "🏴‍☠️",
            athlete_count: 1,
            result_count: 0,
            is_missing_row: false,
            is_placeholder_flag: true,
            athlete_examples: ["Darya Dolidovich"],
          },
        ]),
      status: 200,
      statusText: "OK",
    } as Response);

    const diagnostics = await Admin.fetchCountryDiagnostics();

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe("BRT");
    expect(diagnostics[0].athleteExamples).toEqual(["Darya Dolidovich"]);
  });

  it("sends country updates to the admin endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          code: "BRT",
          name: "Belarus",
          flag: "🇧🇾",
        }),
      status: 200,
      statusText: "OK",
    } as Response);

    const response = await Admin.updateCountry("BRT", {
      name: "Belarus",
      flag: "🇧🇾",
    });

    expect(response.name).toBe("Belarus");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/countries/BRT",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ name: "Belarus", flag: "🇧🇾" }),
      }),
    );
  });
});

describe("Admin operation diagnostics", () => {
  it("maps operation history from the admin API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          entries: [
            {
              id: "op-1",
              actor_type: "admin_user",
              actor_user_id: "user-1",
              actor_name: "admin_user",
              action_type: "results_check",
              target_type: "background_job",
              target_id: "results_check",
              status: "failed",
              summary: "Result check processed 1 events, deferred 0, failed 1.",
              details: {
                failed_count: 1,
              },
              created_at: "2026-03-16 10:00:00",
            },
          ],
          total_count: 1,
          failure_count: 1,
          success_count: 0,
          warning_count: 0,
        }),
      status: 200,
      statusText: "OK",
    } as Response);

    const overview = await Admin.fetchOperations();

    expect(overview.totalCount).toBe(1);
    expect(overview.failureCount).toBe(1);
    expect(overview.entries[0].actorName).toBe("admin_user");
    expect(overview.entries[0].details.failed_count).toBe(1);
  });
});
