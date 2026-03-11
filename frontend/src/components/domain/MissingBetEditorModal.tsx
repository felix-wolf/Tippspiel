import { useEffect, useState } from "react";
import { Prediction } from "../../models/Bet";
import { Event, Predictions } from "../../models/Event";
import { User } from "../../models/User";
import { DialogModal } from "../design/Dialog";
import { BetPlacer } from "./BetPlacer";
import { buildMissingBetConfirmationItems } from "./missingBetUtils";

type MissingBetEditorModalProps = {
  event: Event;
  player?: User;
  isOpen: boolean;
  onClose: () => void;
  onBetSaved: () => void;
};

export function MissingBetEditorModal({
  event,
  player,
  isOpen,
  onClose: _onClose,
  onBetSaved: _onBetSaved,
}: MissingBetEditorModalProps) {
  const [pendingPredictions, setPendingPredictions] = useState<Prediction[]>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPendingPredictions(undefined);
      setSaving(false);
    }
  }, [isOpen, player?.id]);

  function closeModal() {
    if (saving) {
      return;
    }
    setPendingPredictions(undefined);
    _onClose();
  }

  function confirmSave() {
    if (!player || !pendingPredictions || pendingPredictions.length != event.numBets) {
      return;
    }
    setSaving(true);
    Event.saveBetsForUser(event.id, player.id, pendingPredictions as Predictions)
      .then(() => {
        setPendingPredictions(undefined);
        _onBetSaved();
        _onClose();
      })
      .catch((error) => console.log("error saving missing bet", error))
      .finally(() => setSaving(false));
  }

  const confirmationItems = pendingPredictions
    ? buildMissingBetConfirmationItems(pendingPredictions)
    : [];

  return (
    <DialogModal
      title={
        pendingPredictions
          ? "Tipp bestaetigen"
          : `Tipp fuer ${player?.name ?? "Spieler"} nachtragen`
      }
      subtitle={
        pendingPredictions
          ? "Gespeicherte Tipps koennen danach nicht mehr bearbeitet werden."
          : "Der Tipp wird erst nach deiner Bestaetigung gespeichert."
      }
      isOpened={isOpen}
      onClose={closeModal}
      type="edit"
      actionButtonEnabled={!saving && confirmationItems.length == event.numBets}
      actionButtonTitle={pendingPredictions ? "Jetzt speichern" : undefined}
      onActionClick={pendingPredictions ? confirmSave : undefined}
      neutralButtonTitle={pendingPredictions ? "Zurueck" : undefined}
      onNeutralClick={pendingPredictions ? () => setPendingPredictions(undefined) : undefined}
    >
      {!pendingPredictions && player && (
        <BetPlacer
          user={player}
          event={event}
          onSave={setPendingPredictions}
          tryLoadExistingBet={false}
          enteringResults={false}
        />
      )}
      {pendingPredictions && (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Bitte pruefe die nachgetragenen Tipps fuer {player?.name}. Nach dem Speichern
            kann dieser Tipp nicht erneut ueber den Creator-Flow geaendert werden.
          </p>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <ul className="space-y-2">
              {confirmationItems.map((item) => (
                <li key={item} className="text-sm text-slate-100">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </DialogModal>
  );
}
