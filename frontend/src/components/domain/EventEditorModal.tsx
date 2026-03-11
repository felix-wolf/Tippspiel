import { EventType } from "../../models/user/EventType";
import { Event } from "../../models/Event";
import { useCallback, useEffect, useState } from "react";
import { Game } from "../../models/Game";
import { DialogModal } from "../design/Dialog";
import { OfficialEventImporter } from "./OfficialEventImporter";
import { ManualEventCreator } from "./ManualEventCreator";

type EventCreatorProps = {
  types: EventType[] | undefined;
  event?: Event;
  game: Game;
  canImportEvents: boolean;
  canManageEventData: boolean;
  onEventsChanged: (changeType: "create" | "update" | "delete" | "import") => void;
  onClose: () => void;
  isOpen: boolean;
};

export function EventEditorModal({
  isOpen,
  types,
  event,
  game,
  canImportEvents,
  canManageEventData,
  onClose: _onClose,
  onEventsChanged: _onEventsChanged,
}: EventCreatorProps) {
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [shakingAction, setShakingAction] = useState(false);
  const [selectingImportedEvents, setSelectingImportedEvents] = useState(false);
  const [showManualCreator, setShowManualCreator] = useState(false);

  const hasAutomaticImport = canImportEvents && game?.discipline?.eventImportMode === "official_api";

  useEffect(() => {
    if (event) {
      setCreatingEvent(true);
      setShowManualCreator(true);
      return;
    }
    setCreatingEvent(false);
    if (!isOpen) {
      setSelectedEvents([]);
      setSelectingImportedEvents(false);
      setShowManualCreator(false);
    }
  }, [event, isOpen]);

  const onActionClick = useCallback(
    (events: Event[]): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        if (selectingImportedEvents) {
          Event.saveImportedEvents(events)
            .then(() => {
              setSelectedEvents([]);
              _onEventsChanged("import");
              _onClose();
              resolve(true);
            })
            .catch(() => {
              setShakingAction(true);
              setTimeout(() => setShakingAction(false), 300);
              reject();
            });
          return;
        }

        if (event && canManageEventData) {
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
            .then(() => {
              _onEventsChanged("update");
              _onClose();
              resolve(true);
            })
            .catch(() => {
              setShakingAction(true);
              setTimeout(() => setShakingAction(false), 300);
              reject();
            });
          return;
        }

        if (!event && canManageEventData) {
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
            .then(() => {
              _onEventsChanged("create");
              _onClose();
              resolve(true);
            })
            .catch(() => {
              setShakingAction(true);
              setTimeout(() => setShakingAction(false), 300);
              reject();
            });
          return;
        }

        resolve(true);
      });
    },
    [selectingImportedEvents, event, canManageEventData, game, _onClose, _onEventsChanged],
  );

  function getActionButtonTitle(): string {
    if (selectingImportedEvents) {
      return `${selectedEvents.length > 0 ? selectedEvents.length : ""} Importieren`;
    }
    if (creatingEvent) {
      return "Speichern";
    }
    return "Erstellen";
  }

  return (
    <DialogModal
      title={creatingEvent ? "Event bearbeiten" : "Events hinzufuegen"}
      isOpened={isOpen}
      onClose={() => _onClose()}
      type={"add"}
      onActionClick={() => onActionClick(selectedEvents)}
      actionButtonTitle={getActionButtonTitle()}
      actionButtonEnabled={selectedEvents.length > 0}
      neutralButtonTitle="Abbrechen"
      onNeutralClick={() => {
        setSelectedEvents([]);
        setCreatingEvent(false);
        setSelectingImportedEvents(false);
        setShowManualCreator(false);
        _onClose();
      }}
      shakingActionButton={shakingAction}
    >
      <div className="flex flex-col gap-4">
        {!creatingEvent && hasAutomaticImport && (
          <OfficialEventImporter
            game={game}
            onSelectEvents={setSelectedEvents}
            onSelectingEventsToImport={(selecting) => setSelectingImportedEvents(selecting)}
          />
        )}

        {!creatingEvent && hasAutomaticImport && canManageEventData && !selectingImportedEvents && !showManualCreator && (
          <div className="rounded-2xl border border-sky-400/20 bg-slate-800/55 p-4 text-sm text-slate-300 shadow-sm">
            <p className="font-semibold text-sky-100">Automatischer Import ist der Standard</p>
            <p className="mt-1">
              Als Admin kannst du bei Bedarf auch manuell gepflegte Eventdaten anlegen oder korrigieren.
            </p>
            <button
              className="mt-3 text-sm font-semibold text-sky-200 underline underline-offset-2 cursor-pointer"
              onClick={() => {
                setSelectedEvents([]);
                setShowManualCreator(true);
              }}
              type="button"
            >
              Event manuell verwalten
            </button>
          </div>
        )}

        {!selectingImportedEvents && canManageEventData && (showManualCreator || !hasAutomaticImport || creatingEvent) && (
          <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-slate-800/55 p-4 shadow-sm">
            {!creatingEvent && hasAutomaticImport && (
              <>
                <p className="text-sm font-semibold text-amber-300">Admin-Verwaltung</p>
                <p className="text-sm text-slate-300">
                  Hier bearbeitest du die zentralen Eventdaten. Aenderungen wirken sich auf alle verknuepften Spiele aus.
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

        {!canManageEventData && !hasAutomaticImport && (
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
