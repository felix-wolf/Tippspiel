import { Event } from "../../models/Event";
import { useCallback, useState } from "react";
import { Game } from "../../models/Game";
import { DialogModal } from "../design/Dialog";
import { OfficialEventImporter } from "./OfficialEventImporter";

type EventCreatorProps = {
  game: Game;
  onEventsImported: () => void;
  onClose: () => void;
  isOpen: boolean;
};

export function EventEditorModal({
  isOpen,
  game,
  onClose: _onClose,
  onEventsImported: _onEventsImported,
}: EventCreatorProps) {
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [shakingAction, setShakingAction] = useState(false);
  const [selectingImportedEvents, setSelectingImportedEvents] = useState(false);
  const hasOfficialImport = game?.discipline?.eventImportMode === "official_api";

  const onActionClick = useCallback(
    (): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        if (!selectingImportedEvents || selectedEvents.length === 0) {
          resolve(true);
          return;
        }
        Event.saveImportedEvents(selectedEvents)
          .then(() => {
            setSelectedEvents([]);
            _onEventsImported();
            _onClose();
            resolve(true);
          })
          .catch(() => {
            setShakingAction(true);
            setTimeout(() => setShakingAction(false), 300);
            reject();
          });
      });
    },
    [selectedEvents, selectingImportedEvents, _onClose, _onEventsImported],
  );

  return (
    <DialogModal
      title={"Events hinzufuegen"}
      isOpened={isOpen}
      onClose={() => _onClose()}
      type={"add"}
      onActionClick={() => onActionClick()}
      actionButtonTitle={`${selectedEvents.length > 0 ? selectedEvents.length : ""} Importieren`}
      actionButtonEnabled={hasOfficialImport && selectingImportedEvents && selectedEvents.length > 0}
      neutralButtonTitle="Abbrechen"
      onNeutralClick={() => {
        setSelectedEvents([]);
        setSelectingImportedEvents(false);
        _onClose();
      }}
      shakingActionButton={shakingAction}
    >
      <div className="flex flex-col gap-4">
        {hasOfficialImport && (
          <OfficialEventImporter
            game={game}
            onSelectEvents={setSelectedEvents}
            onSelectingEventsToImport={(selecting) => setSelectingImportedEvents(selecting)}
          />
        )}
        {!hasOfficialImport && (
          <div className="rounded-2xl border border-amber-300/30 bg-slate-800/55 p-4 text-sm text-slate-300 shadow-sm">
            <p className="font-semibold text-amber-200">Eventdaten sind jetzt zentral verwaltet</p>
            <p className="mt-1">
              Spielbesitzer koennen keine Eventinformationen mehr bearbeiten. Zukuenftige
              Admin-Funktionen uebernehmen diese Pflege.
            </p>
          </div>
        )}
      </div>
    </DialogModal>
  );
}
