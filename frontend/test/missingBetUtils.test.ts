import { describe, expect, it } from "vitest";
import { canCreatorAddMissingBet, buildMissingBetConfirmationItems } from "../src/components/domain/missingBetUtils";
import { Bet, Prediction } from "../src/models/Bet";
import { Event } from "../src/models/Event";
import { Result } from "../src/models/Result";
import { EventType } from "../src/models/EventType";

function buildEvent({
  started = true,
  results = [],
}: {
  started?: boolean;
  results?: Result[];
}) {
  const eventType = new EventType(
    "type-1",
    "Sprint",
    "Sprint",
    "discipline-1",
    "athletes",
  );

  return new Event(
    "event-1",
    "Sample Event",
    "game-1",
    eventType,
    started ? "2024-01-02T03:04:05" : "2999-01-02T03:04:05",
    2,
    5,
    false,
    [],
    results,
    [],
    started ? new Date(2024, 0, 2, 3, 4, 5) : new Date(2999, 0, 2, 3, 4, 5),
  );
}

describe("missingBetUtils", () => {
  it("only enables missing-bet entry for managers when the event has started and no bet exists", () => {
    const startedEvent = buildEvent({});
    const savedBet = new Bet("bet-1", "user-1", [], undefined);
    const result = new Result("result-1", "event-1", 1, "athlete-1", "Athlete", undefined, undefined);

    expect(canCreatorAddMissingBet(true, startedEvent, undefined)).toBe(true);
    expect(canCreatorAddMissingBet(false, startedEvent, undefined)).toBe(false);
    expect(canCreatorAddMissingBet(true, buildEvent({ started: false }), undefined)).toBe(false);
    expect(canCreatorAddMissingBet(true, buildEvent({ results: [result] }), undefined)).toBe(true);
    expect(canCreatorAddMissingBet(true, startedEvent, savedBet)).toBe(false);
  });

  it("builds a stable confirmation list ordered by predicted place", () => {
    const predictions = [
      new Prediction(undefined, undefined, 2, "athlete-2", "Second Athlete", undefined, undefined),
      new Prediction(undefined, undefined, 1, "athlete-1", "First Athlete", undefined, undefined),
    ];

    expect(buildMissingBetConfirmationItems(predictions)).toEqual([
      "1. First Athlete",
      "2. Second Athlete",
    ]);
  });
});
