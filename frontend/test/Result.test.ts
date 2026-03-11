import { describe, expect, it } from "vitest";
import { Result } from "../src/models/Result";

describe("Result.toPayload", () => {
  it("serializes the result as a plain payload object", () => {
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

    expect(result.toPayload()).toEqual({
      id: "result-1",
      event_id: "event-1",
      place: 1,
      object_id: "object-1",
      object_name: "Object Name",
      time: "10:00",
      behind: "0.2",
      shooting: "0 1",
      shooting_time: "1:42.0",
      status: undefined,
    });
  });
});
