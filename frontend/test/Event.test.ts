import { afterEach, describe, expect, it, vi } from "vitest";
import { Bet, Prediction } from "../src/models/Bet";
import { Event } from "../src/models/Event";
import { EventType } from "../src/models/EventType";
import { Result } from "../src/models/Result";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Event.toPayload", () => {
  it("serializes the event as a plain payload object", () => {
    const eventType = new EventType(
      "type-1",
      "Type Name",
      "Type Display",
      "discipline-1",
      "countries",
    );

    const predictions = [
      new Prediction(
        "prediction-1",
        "bet-1",
        1,
        "object-1",
        "Object Name",
        1,
        undefined,
        10,
      ),
    ];

    const bets = [new Bet("bet-1", "user-1", predictions, 100)];

    const results = [
      new Result(
        "result-1",
        "event-1",
        1,
        "object-1",
        "Object Name",
        "10:00",
        "0.2",
      ),
    ];

    const event = new Event(
      "event-1",
      "Sample Event",
      "game-1",
      eventType,
      "2024-01-02T03:04:05",
      1,
      10,
      true,
      bets,
      results,
      ["user-1", "user-2"],
      new Date(2024, 0, 2, 3, 4, 5),
      "https://example.com/event",
      undefined,
      undefined,
      "ibu",
      "event-source-1",
      "race-source-1",
      "2526",
    );

    expect(event.toPayload()).toEqual({
      id: "event-1",
      name: "Sample Event",
      game_id: "game-1",
      datetime: "2024-01-02 03:04:05",
      allow_partial_points: 1,
      results: [
        {
          id: "result-1",
          event_id: "event-1",
          place: 1,
          object_id: "object-1",
          object_name: "Object Name",
          time: "10:00",
          behind: "0.2",
          status: undefined,
        },
      ],
      bets: [
        {
          id: "bet-1",
          user_id: "user-1",
          predictions: [
            {
              id: "prediction-1",
              bet_id: "bet-1",
              predicted_place: 1,
              object_id: "object-1",
              object_name: "Object Name",
              actual_place: 1,
              actual_status: undefined,
              score: 10,
            },
          ],
          score: 100,
        },
      ],
      event_type: {
        id: "type-1",
        name: "Type Name",
        discipline_id: "discipline-1",
        betting_on: "countries",
        display_name: "Type Display",
      },
      url: "https://example.com/event",
      location: null,
      race_format: null,
      source_provider: "ibu",
      source_event_id: "event-source-1",
      source_race_id: "race-source-1",
      season_id: "2526",
      num_bets: 1,
      points_correct_bet: 10,
    });

    const eventNoUrl = new Event(
      "event-1",
      "Sample Event",
      "game-1",
      eventType,
      "2024-01-02T03:04:05",
      1,
      10,
      true,
      bets,
      results,
      ["user-1", "user-2"],
      new Date(2024, 0, 2, 3, 4, 5),
    );

    expect(eventNoUrl.toPayload()).toEqual({
      id: "event-1",
      name: "Sample Event",
      game_id: "game-1",
      datetime: "2024-01-02 03:04:05",
      allow_partial_points: 1,
      results: [
        {
          id: "result-1",
          event_id: "event-1",
          place: 1,
          object_id: "object-1",
          object_name: "Object Name",
          time: "10:00",
          behind: "0.2",
          status: undefined,
        },
      ],
      bets: [
        {
          id: "bet-1",
          user_id: "user-1",
          predictions: [
            {
              id: "prediction-1",
              bet_id: "bet-1",
              predicted_place: 1,
              object_id: "object-1",
              object_name: "Object Name",
              actual_place: 1,
              actual_status: undefined,
              score: 10,
            },
          ],
          score: 100,
        },
      ],
      event_type: {
        id: "type-1",
        name: "Type Name",
        discipline_id: "discipline-1",
        betting_on: "countries",
        display_name: "Type Display",
      },
      url: null,
      location: null,
      race_format: null,
      source_provider: null,
      source_event_id: null,
      source_race_id: null,
      season_id: null,
      num_bets: 1,
      points_correct_bet: 10,
    });
  });
});

describe("Event.saveBetsForUser", () => {
  it("posts the creator target user and prediction names to the backend", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            id: "event-1",
            name: "Sample Event",
            game_id: "game-1",
            datetime: "2024-01-02 03:04:05",
            num_bets: 1,
            points_correct_bet: 5,
            allow_partial_points: false,
            bets: [],
            results: [],
            has_bets_for_users: ["user-2"],
            event_type: {
              id: "type-1",
              name: "Type Name",
              display_name: "Type Display",
              discipline_id: "discipline-1",
              betting_on: "countries",
            },
            url: null,
          }),
        status: 200,
        statusText: "OK",
      } as Response);

    const predictions = [
      new Prediction(
        "prediction-1",
        "bet-1",
        1,
        "object-1",
        "Object Name",
        undefined,
        undefined,
      ),
    ];

    await Event.saveBetsForUser("event-1", "user-2", predictions as any);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/event/save_bets",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          event_id: "event-1",
          user_id: "user-2",
          predictions: [
            {
              id: "prediction-1",
              bet_id: "bet-1",
              object_id: "object-1",
              object_name: "Object Name",
              predicted_place: 1,
              score: undefined,
            },
          ],
        }),
      }),
    );
  });
});

describe("Event.fetchStartList", () => {
  it("maps the start list ids and relay entries", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          start_list: ["ITA", "FRA"],
          entries: [
            {
              id: "ITA",
              name: "Italy",
              members: [
                { leg: 1, name: "Patrick BRAUNHOFER" },
                { leg: 2, name: "Christoph PIRCHER" },
              ],
            },
          ],
        }),
      status: 200,
      statusText: "OK",
    } as Response);

    await expect(Event.fetchStartList("event-1")).resolves.toEqual({
      startList: ["ITA", "FRA"],
      entries: [
        {
          id: "ITA",
          name: "Italy",
          members: [
            { leg: 1, name: "Patrick BRAUNHOFER" },
            { leg: 2, name: "Christoph PIRCHER" },
          ],
        },
      ],
    });
  });
});

describe("Event.saveImportedEvents", () => {
  it("keeps the backend import wire format while building payloads from plain objects", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify([
          {
            id: "event-1",
            name: "Sample Event",
            game_id: "game-1",
            datetime: "2024-01-02 03:04:05",
            num_bets: 1,
            points_correct_bet: 5,
            allow_partial_points: false,
            bets: [],
            results: [],
            has_bets_for_users: [],
            event_type: {
              id: "type-1",
              name: "Type Name",
              display_name: "Type Display",
              discipline_id: "discipline-1",
              betting_on: "countries",
            },
            url: null,
            location: null,
            race_format: null,
            source_provider: null,
            source_event_id: null,
            source_race_id: null,
            season_id: null,
          },
        ]),
      status: 200,
      statusText: "OK",
    } as Response);

    const eventType = new EventType(
      "type-1",
      "Type Name",
      "Type Display",
      "discipline-1",
      "countries",
    );
    const event = new Event(
      "event-1",
      "Sample Event",
      "game-1",
      eventType,
      "2024-01-02T03:04:05",
      1,
      5,
      false,
      [],
      [],
      [],
      new Date(2024, 0, 2, 3, 4, 5),
    );

    await Event.saveImportedEvents([event]);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/event",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          events: [
            JSON.stringify({
              id: "event-1",
              name: "Sample Event",
              game_id: "game-1",
              datetime: "2024-01-02 03:04:05",
              allow_partial_points: 0,
              results: [],
              bets: [],
              event_type: {
                id: "type-1",
                name: "Type Name",
                discipline_id: "discipline-1",
                betting_on: "countries",
                display_name: "Type Display",
              },
              url: null,
              location: null,
              race_format: null,
              source_provider: null,
              source_event_id: null,
              source_race_id: null,
              season_id: null,
              num_bets: 1,
              points_correct_bet: 5,
            }),
          ],
        }),
      }),
    );
  });
});

describe("Event admin result operations", () => {
  it("maps preview refresh responses with result diffs", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          scope: "shared_event",
          target_event_id: "event-1",
          shared_event_id: "official:ibu:race-1",
          source_provider: "ibu",
          source_race_id: "race-1",
          affected_events: [
            {
              event_id: "event-1",
              event_name: "Race 1",
              game_id: "game-1",
              has_results: true,
            },
          ],
          has_changes: true,
          changes: [
            {
              place: 1,
              before: {
                id: "result-1",
                event_id: "event-1",
                place: 1,
                object_id: "athlete-1",
                object_name: "Old Name",
              },
              after: {
                id: "result-1",
                event_id: "event-1",
                place: 1,
                object_id: "athlete-1",
                object_name: "New Name",
              },
            },
          ],
          current_results: [],
          fetched_results: [],
        }),
      status: 200,
      statusText: "OK",
    } as Response);

    const preview = await Event.previewResultRefresh("event-1");

    expect(preview.scope).toBe("shared_event");
    expect(preview.targetEventId).toBe("event-1");
    expect(preview.affectedEvents[0]).toEqual({
      eventId: "event-1",
      eventName: "Race 1",
      gameId: "game-1",
      hasResults: true,
    });
    expect(preview.changes[0].before?.object_name).toBe("Old Name");
    expect(preview.changes[0].after?.object_name).toBe("New Name");
  });

  it("posts apply refresh requests with the resend flag", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          scope: "event",
          target_event_id: "event-1",
          shared_event_id: "event-1",
          affected_events: [],
          status: "applied",
          processed_count: 1,
          resend_notifications: true,
        }),
      status: 200,
      statusText: "OK",
    } as Response);

    const response = await Event.applyResultRefresh("event-1", true);

    expect(response.status).toBe("applied");
    expect(response.processedCount).toBe(1);
    expect(response.resendNotifications).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/events/event-1/results/apply-refresh",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ resend_notifications: true }),
      }),
    );
  });
});
