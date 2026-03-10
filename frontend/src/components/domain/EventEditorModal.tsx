import { EventType } from "../../models/user/EventType";
import { Event } from "../../models/Event";
import { useCallback, useEffect, useState } from "react";
import { Game } from "../../models/Game";
import { DialogModal } from "../design/Dialog";
import { ManualEventCreator } from "./ManualEventCreator";
import { OfficialEventImporter } from "./OfficialEventImporter";
import { URLEventImporter } from "./URLEventImporter";

type EventCreatorProps = {
  types: EventType[] | undefined;
  event?: Event;
  game: Game;
  onEventsChanged: (changeType: "create" | "update" | "delete" | "import") => void;
  onClose: () => void;
  isOpen: boolean
};

export function EventEditorModal({
  isOpen,
  types,
  game,
  onClose: _onClose,
  onEventsChanged: _onEventsChanged,
  event,
}: EventCreatorProps) {
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [shakingAction, setShakingAction] = useState(false);
  const [selectingURLEvents, setSelectingURLEvents] = useState(false);
  const [showManualCreator, setShowManualCreator] = useState(false);

  const hasAutomaticImport = game?.discipline?.eventImportMode !== "manual";

  useEffect(() => {
    if (event) {
      setCreatingEvent(true);
      setShowManualCreator(true);
      return;
    }
    setCreatingEvent(false);
    if (!isOpen) {
      setSelectedEvents([]);
      setSelectingURLEvents(false);
      setShowManualCreator(false);
    }
  }, [event, isOpen]);

  const onActionClick = useCallback(
    (events: Event[]): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        if (selectingURLEvents) {
          Event.saveImportedEvents(events)
            .then(() => {
              setSelectedEvents([])
              _onEventsChanged("import")
              _onClose()
            })
            .catch((_) => {
              setShakingAction(true);
              setTimeout(() => setShakingAction(false), 300);
            });
        } else if (event) {
          const updatedEvent = events[0];
          Event.update(
            event.id,
            updatedEvent.name,
            event.game_id,
            updatedEvent.type,
            updatedEvent.datetime,
            updatedEvent.numBets,
            updatedEvent.pointsCorrectBet,
            updatedEvent.allowPartialPoints,
            updatedEvent.location,
            updatedEvent.raceFormat,
          )
            .then((_) => {
              _onEventsChanged("update");
              resolve(true);
              _onClose()
            })
            .catch((error) => {
              reject();
              console.log(error);
            });
        } else if (!event && !selectingURLEvents) {
          const updatedEvent = events[0];
          Event.create(
            updatedEvent.name,
            game.id,
            updatedEvent.type,
            updatedEvent.datetime,
            updatedEvent.numBets,
            updatedEvent.pointsCorrectBet,
            updatedEvent.location,
            updatedEvent.raceFormat,
          )
            .then((_) => {
              _onEventsChanged("create");
              resolve(true);
              _onClose()
            })
            .catch((error) => {
              reject();
              console.log(error);
            });

        }

        resolve(true);
      });
    },
    [selectingURLEvents, event, game],
  );

  function getActionButtonTitle(creatingEvent: boolean, selectingURLEvents: boolean): string {
    if (selectingURLEvents) {
      return `${selectedEvents.length > 0 ? selectedEvents.length : ""} Importieren`;
    } else if (creatingEvent) {
      return "Speichern";
    } else {
      return "Erstellen";
    }
  }

  return (
    <DialogModal
      title={creatingEvent ? "Event bearbeiten" : "Events hinzufügen"}
      isOpened={isOpen}
      onClose={() => _onClose()}
      type={"add"}
      onActionClick={() => onActionClick(selectedEvents)}
      actionButtonTitle={getActionButtonTitle(creatingEvent, selectingURLEvents)}
      actionButtonEnabled={selectedEvents.length > 0}
      neutralButtonTitle="Abbrechen"
      onNeutralClick={() => {
        setSelectedEvents([])
        setCreatingEvent(false)
        setSelectingURLEvents(false)
        setShowManualCreator(false)
        _onClose()
      }}
      shakingActionButton={shakingAction}
    >
      <div className="flex flex-col gap-4">
        {!creatingEvent && game?.discipline?.eventImportMode === "official_api" && (
          <OfficialEventImporter
            game={game}
            onSelectEvents={setSelectedEvents}
            onSelectingEventsToImport={(selecting) => setSelectingURLEvents(selecting)}
          />
        )}

        {!creatingEvent && game?.discipline?.eventImportMode === "legacy_url" && game?.discipline?.eventsUrl && (
          <URLEventImporter
            game={game}
            eventsUrl={game.discipline.eventsUrl}
            onSelectEvents={setSelectedEvents}
            onSelectingEventsToImport={(selecting) => setSelectingURLEvents(selecting)}
          />
        )}

        {!creatingEvent && hasAutomaticImport && !selectingURLEvents && !showManualCreator && (
          <div className="rounded-2xl border border-sky-400/20 bg-slate-800/55 p-4 text-sm text-slate-300 shadow-sm">
            <p className="font-semibold text-sky-100">Automatischer Import ist der Standard</p>
            <p className="mt-1">
              Nutze manuelle Events nur als Ausnahme. Importierte Rennen bringen offizielle
              Quelldaten mit und lassen sich spaeter deutlich zuverlaessiger mit Ergebnissen verknuepfen.
            </p>
            <button
              className="mt-3 text-sm font-semibold text-sky-200 underline underline-offset-2 cursor-pointer"
              onClick={() => {
                setSelectedEvents([]);
                setShowManualCreator(true);
              }}
              type="button"
            >
              Event trotzdem manuell anlegen
            </button>
          </div>
        )}

        {!selectingURLEvents && (showManualCreator || !hasAutomaticImport || creatingEvent) && (
          <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-slate-800/55 p-4 shadow-sm">
            {!creatingEvent && hasAutomaticImport && (
              <>
                <p className="text-sm font-semibold text-amber-300">Manueller Fallback</p>
                <p className="text-sm text-slate-300">
                  Dieser Weg ist fuer Sonderfaelle gedacht, wenn kein passendes Rennen importiert werden kann.
                </p>
                <button
                  className="w-fit text-sm font-semibold text-sky-200 underline underline-offset-2 cursor-pointer"
                  onClick={() => {
                    setSelectedEvents([]);
                    setShowManualCreator(false);
                  }}
                  type="button"
                >
                  Zurueck zum automatischen Import
                </button>
              </>
            )}
            <ManualEventCreator
              event={event}
              onSelectEvents={setSelectedEvents}
              types={types}
              onEventDeleted={() => _onEventsChanged("delete")}
            />
          </div>
        )}
      </div>
    </DialogModal>
  );
}
