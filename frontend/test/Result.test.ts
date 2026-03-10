import { describe, expect, it } from "vitest";
import { Bet, Prediction } from "../src/models/Bet";
import { Event } from "../src/models/Event";
import { Result } from "../src/models/Result";
import { EventType } from "../src/models/user/EventType";

const normalizeJson = (value: string) => value.replace(/\n\s*/g, "").trim();

describe("Result.toJson", () => {
  it("serializes the result with nested bets, events and type", () => {
    const result = new Result(
        "result-1",
        "event-1",
        1,
        "object-1",
        "Object Name",
        "10:00",
        "0.2",
        "0 1",
        "1:42.0",
      );

    const expectedJson = `{
      "id": "${result.id}",
      "event_id": "${result.event_id}",
      "place": "${result.place}",
      "object_id": "${result.object_id}",
      "object_name": "${result.object_name}",
      "time": "${result.time}",
      "behind": "${result.behind}",
      "shooting": "${result.shooting}",
      "shooting_time": "${result.shooting_time}"
      }`;

    expect(normalizeJson(result.toJson())).toBe(normalizeJson(expectedJson));
  });
});
