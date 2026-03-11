import { describe, expect, it } from "vitest";
import { Prediction } from "../src/models/Bet";

describe("Prediction.fromJson", () => {
  it("normalizes backend null values for unresolved results", () => {
    const prediction = Prediction.fromJson({
      id: "prediction-1",
      bet_id: "bet-1",
      predicted_place: 1,
      object_id: "athlete-1",
      object_name: "Athlete",
      actual_place: null,
      actual_status: null,
      score: null,
    });

    expect(prediction.actual_place).toBeUndefined();
    expect(prediction.actual_status).toBeUndefined();
    expect(prediction.score).toBeUndefined();
  });
});
