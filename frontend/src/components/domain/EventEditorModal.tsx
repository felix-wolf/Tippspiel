import { EventType } from "../../models/user/EventType";
import { Event } from "../../models/Event";
import { useCallback, useEffect, useState } from "react";
import { Game } from "../../models/Game";
import { DialogModal } from "../design/Dialog";
import { ManualEventCreator } from "./ManualEventCreator";
import { URLEventImporter } from "./URLEventImporter";

type EventCreatorProps = {
  types: EventType[] | undefined;
  event?: Event;
  game: Game;
  onEventsChanged: () => void;
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

  useEffect(() => {
    if (event) setCreatingEvent(true);
  }, [event]);

  const onActionClick = useCallback(
    (events: Event[]): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        if (selectingURLEvents) {
          Event.saveImportedEvents(events)
            .then(() => {
              setSelectedEvents([])
              _onEventsChanged()
              _onClose()
            })
            .catch((_) => {
              setShakingAction(true);
              setTimeout(() => setShakingAction(false), 300);
            });
        } else if (event) {
          const updatedEvent = events[0];
          console.log("EDITING EVENT", updatedEvent)
          Event.update(
            event.id,
            updatedEvent.name,
            event.game_id,
            updatedEvent.type,
            updatedEvent.datetime,
            updatedEvent.numBets,
            updatedEvent.pointsCorrectBet,
            updatedEvent.allowPartialPoints,
          )
            .then((_) => {
              _onEventsChanged();
              resolve(true);
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
          )
            .then((_) => {
              _onEventsChanged();
              resolve(true);
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
        _onClose()
      }}
      shakingActionButton={shakingAction}
    >
      <div className="flex flex-col gap-4">
        {!creatingEvent && game?.discipline?.eventsUrl && (
          <URLEventImporter
            game={game}
            eventsUrl={game.discipline.eventsUrl}
            onSelectEvents={setSelectedEvents}
            onSelectingEventsToImport={(selecting) => setSelectingURLEvents(selecting)}
          />
        )}

        {!creatingEvent && game?.discipline?.eventsUrl && !selectingURLEvents && (
          <p className="text-center text-gray-500 font-semibold">oder</p>)}

        {!selectingURLEvents && (
          <ManualEventCreator
            event={event}
            onSelectEvents={setSelectedEvents}
            types={types}
            onEventDeleted={() => _onEventsChanged()}
          />
        )}
      </div>
    </DialogModal>
  );
}
