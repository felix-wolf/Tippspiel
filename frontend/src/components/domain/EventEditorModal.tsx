import { EventType } from "../../models/EventType";
import { Event } from "../../models/Event";
import { useCallback, useEffect, useState } from "react";
import { Game } from "../../models/Game";
import { DialogModal } from "../design/Dialog";
import { OfficialEventImporter } from "./OfficialEventImporter";
import { ManualEventCreator } from "./ManualEventCreator";
import {
  getEventEditorActionConfig,
  getEventEditorDialogType,
  getEventEditorTitle,
  getInitialEventEditorMode,
  type EventEditorMode,
} from "./eventEditorState";

type EventCreatorProps = {
  types: EventType[] | undefined;
  event?: Event;
  game: Game;
  canImportEvents: boolean;
  canCreateEvents: boolean;
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
  canCreateEvents,
  canManageEventData,
  onClose: _onClose,
  onEventsChanged: _onEventsChanged,
}: EventCreatorProps) {
  const hasAutomaticImport = canImportEvents && game?.discipline?.eventImportMode === "official_api";
  const [mode, setMode] = useState<EventEditorMode>(
    getInitialEventEditorMode({ event, hasAutomaticImport }),
  );
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [shakingAction, setShakingAction] = useState(false);

  useEffect(() => {
    setMode(getInitialEventEditorMode({ event, hasAutomaticImport }));
    setSelectedEvents([]);
    setShakingAction(false);
  }, [event, hasAutomaticImport, isOpen]);

  const onActionClick = useCallback(() => {
    const stagedEvent = selectedEvents[0];
    const handleFailure = () => {
      setShakingAction(true);
      setTimeout(() => setShakingAction(false), 300);
    };

    switch (mode) {
      case "import_selecting":
        if (!canImportEvents) return;
        Event.saveImportedEvents(selectedEvents)
          .then(() => {
            setSelectedEvents([]);
            _onEventsChanged("import");
            _onClose();
          })
          .catch(handleFailure);
        return;
      case "manual_edit":
        if (!event || !canManageEventData || !stagedEvent) {
          return;
        }
        Event.update(
          event.id,
          stagedEvent.name,
          event.game_id,
          stagedEvent.type,
          stagedEvent.datetime,
          stagedEvent.numBets,
          stagedEvent.pointsCorrectBet,
          stagedEvent.allowPartialPoints,
          stagedEvent.location,
          stagedEvent.raceFormat,
        )
          .then(() => {
            _onEventsChanged("update");
            _onClose();
          })
          .catch(handleFailure);
        return;
      case "manual_create":
        if (!canCreateEvents || !stagedEvent) {
          return;
        }
        Event.create(
          stagedEvent.name,
          game.id,
          stagedEvent.type,
          stagedEvent.datetime,
          stagedEvent.numBets,
          stagedEvent.pointsCorrectBet,
          stagedEvent.allowPartialPoints,
          stagedEvent.location,
          stagedEvent.raceFormat,
        )
          .then(() => {
            _onEventsChanged("create");
            _onClose();
          })
          .catch(handleFailure);
        return;
      case "import_idle":
      default:
        return;
    }
  }, [canImportEvents, canCreateEvents, canManageEventData, event, game.id, mode, selectedEvents, _onClose, _onEventsChanged]);

  function switchToManualCreate() {
    setSelectedEvents([]);
    setMode("manual_create");
  }

  function switchToImport() {
    setSelectedEvents([]);
    setMode("import_idle");
  }

  const actionConfig = getEventEditorActionConfig(mode, selectedEvents.length);
  const isManualMode = mode === "manual_create" || mode === "manual_edit";
  const canSwitchToManual = !event && hasAutomaticImport && canCreateEvents && !isManualMode;
  const canUseManualMode = mode === "manual_edit" ? canManageEventData : canCreateEvents;
  const canPerformAction = isManualMode ? canUseManualMode : canImportEvents;
  const canSwitchToImport = !event && hasAutomaticImport && canCreateEvents && mode === "manual_create";

  return (
    <DialogModal
      title={getEventEditorTitle(mode)}
      isOpened={isOpen}
      onClose={() => _onClose()}
      type={getEventEditorDialogType(mode)}
      onActionClick={actionConfig.title ? onActionClick : undefined}
      actionButtonTitle={actionConfig.title}
      actionButtonEnabled={actionConfig.enabled && canPerformAction}
      neutralButtonTitle="Abbrechen"
      onNeutralClick={() => {
        setSelectedEvents([]);
        setMode(getInitialEventEditorMode({ event, hasAutomaticImport }));
        _onClose();
      }}
      shakingActionButton={shakingAction}
    >
      <div className="flex flex-col gap-4">
        {(mode === "import_idle" || mode === "import_selecting") && hasAutomaticImport && (
          <OfficialEventImporter
            game={game}
            onSelectedImportedEventsChange={setSelectedEvents}
            onModeChange={setMode}
          />
        )}

        {canSwitchToManual && (
          <div className="rounded-2xl border border-sky-400/20 bg-slate-800/55 p-4 text-sm text-slate-300 shadow-sm">
            <p className="font-semibold text-sky-100">Automatischer Import ist der Standard</p>
            <p className="mt-1">
              Du kannst auch ein eigenes Event für dieses Tippspiel erstellen.
            </p>
            <button
              className="mt-3 text-sm font-semibold text-sky-200 underline underline-offset-2 cursor-pointer"
              onClick={switchToManualCreate}
              type="button"
            >
              Eigenes Event erstellen
            </button>
          </div>
        )}

        {isManualMode && canUseManualMode && (
          <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-slate-800/55 p-4 shadow-sm">
            {canSwitchToImport && (
              <button
                  className="w-fit text-sm font-semibold text-sky-200 underline underline-offset-2 cursor-pointer"
                  onClick={switchToImport}
                  type="button"
                >
                  Zurueck zum automatischen Import
              </button>
            )}
            <ManualEventCreator
              event={event}
              onSelectEvents={setSelectedEvents}
              types={types}
              onEventDeleted={() => _onEventsChanged("delete")}
            />
          </div>
        )}

        {!canUseManualMode && !hasAutomaticImport && (
          <div className="rounded-2xl border border-amber-300/30 bg-slate-800/55 p-4 text-sm text-slate-300 shadow-sm">
            <p className="font-semibold text-amber-200">Keine Berechtigung</p>
            <p className="mt-1">
              Nur der Spielersteller oder ein Admin kann eigene Events erstellen.
              Bestehende Eventdaten können nur Admins bearbeiten.
            </p>
          </div>
        )}
      </div>
    </DialogModal>
  );
}
