import { Bet, Prediction } from "../../models/Bet";
import { Event } from "../../models/Event";

export function canCreatorAddMissingBet(
  canManageMissingBet: boolean,
  event: Event,
  bet: Bet | undefined,
): boolean {
  return canManageMissingBet && bet == undefined && event.datetime <= new Date();
}

export function buildMissingBetConfirmationItems(
  predictions: Prediction[],
): string[] {
  return [...predictions]
    .sort((a, b) => a.predicted_place - b.predicted_place)
    .map(
      (prediction) =>
        `${prediction.predicted_place}. ${prediction.object_name ?? prediction.object_id}`,
    );
}
