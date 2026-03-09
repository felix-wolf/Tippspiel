import { afterEach, describe, expect, it, vi } from "vitest";
import { Bet, Prediction } from "../src/models/Bet";
import { Event } from "../src/models/Event";
import { Result } from "../src/models/Result";
import { EventType } from "../src/models/user/EventType";

const normalizeJson = (value: string) => value.replace(/\n\s*/g, "").trim();

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Event.toJson", () => {
  it("serializes the event with nested bets, results and type", () => {
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
    );

    const expectedJson1 = `{
      "id": "event-1",
      "name": "Sample Event",
      "game_id": "game-1",
      "datetime": "2024-01-02 03:04:05",
      "hasBetsForUsers": "user-1,user-2",
      "allow_partial_points": "1",
      "results": [{
      "id": "result-1",
      "event_id": "event-1",
      "place": "1",
      "object_id": "object-1",
      "object_name": "Object Name",
      "time": "10:00",
      "behind": "0.2"
    }],
      "bets": [{
      "id": "bet-1",
      "user_id": "user-1",
      "predictions": [{
      "id": "prediction-1",
      "bet_id": "bet-1",
      "predicted_place": "1",
      "object_id": "object-1",
      "object_name": "Object Name",
      "actual_place": "1",
      "score": "10"
    }],
      "score": "100"
    }],
      "event_type": {
      "id": "type-1",
      "name": "Type Name",
      "discipline_id": "discipline-1",
      "betting_on": "countries",
      "display_name": "Type Display"
    },
      "url": "https://example.com/event",
      "location": null,
      "race_format": null
      }`;

    expect(normalizeJson(event.toJson())).toBe(normalizeJson(expectedJson1));

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

    const expectedJson2 = `{
      "id": "event-1",
      "name": "Sample Event",
      "game_id": "game-1",
      "datetime": "2024-01-02 03:04:05",
      "hasBetsForUsers": "user-1,user-2",
      "allow_partial_points": "1",
      "results": [{
      "id": "result-1",
      "event_id": "event-1",
      "place": "1",
      "object_id": "object-1",
      "object_name": "Object Name",
      "time": "10:00",
      "behind": "0.2"
    }],
      "bets": [{
      "id": "bet-1",
      "user_id": "user-1",
      "predictions": [{
      "id": "prediction-1",
      "bet_id": "bet-1",
      "predicted_place": "1",
      "object_id": "object-1",
      "object_name": "Object Name",
      "actual_place": "1",
      "score": "10"
    }],
      "score": "100"
    }],
      "event_type": {
      "id": "type-1",
      "name": "Type Name",
      "discipline_id": "discipline-1",
      "betting_on": "countries",
      "display_name": "Type Display"
    },
      "url": null,
      "location": null,
      "race_format": null
      }`;

    expect(normalizeJson(eventNoUrl.toJson())).toBe(normalizeJson(expectedJson2));
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
