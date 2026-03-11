import { useCallback, useState } from "react";

import { Event } from "../../models/Event.ts";
import { Game } from "../../models/Game.ts";
import { Button } from "../design/Button.tsx";
import { EventImportList } from "./lists/EventImportList.tsx";
import type { EventEditorMode } from "./eventEditorState.ts";

type OfficialEventImporterProps = {
  game: Game;
  onSelectedImportedEventsChange: (events: Event[]) => void;
  onModeChange: (mode: Extract<EventEditorMode, "import_idle" | "import_selecting">) => void;
};

export function OfficialEventImporter({
  game,
  onSelectedImportedEventsChange: _onSelectedImportedEventsChange,
  onModeChange: _onModeChange,
}: OfficialEventImporterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectingEventsToImport, setSelectingEventsToImport] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const loadImportableEvents = useCallback(() => {
    setIsProcessing(true);
    setMessage(undefined);
    game
      .fetchImportableEvents()
      .then((loadedEvents) => {
        setEvents(loadedEvents);
        if (loadedEvents.length === 0) {
          setSelectingEventsToImport(false);
          _onModeChange("import_idle");
          _onSelectedImportedEventsChange([]);
          setMessage("Aktuell wurden keine importierbaren Rennen gefunden.");
          return;
        }
        setSelectingEventsToImport(true);
        _onModeChange("import_selecting");
        _onSelectedImportedEventsChange([]);
      })
      .catch(() => {
        setSelectingEventsToImport(false);
        _onModeChange("import_idle");
        _onSelectedImportedEventsChange([]);
        setMessage("Die IBU-Rennen konnten nicht geladen werden.");
      })
      .finally(() => {
        setIsProcessing(false);
      });
  }, [game, _onModeChange, _onSelectedImportedEventsChange]);

  return (
    <>
      {!selectingEventsToImport && (
        <div className="flex flex-col gap-3 rounded-2xl border border-sky-400/20 bg-slate-800/55 p-4">
          <p className="text-sm text-slate-300">
            Lade importierbare Biathlon-Rennen direkt aus der offiziellen
            IBU-Quelle.
          </p>
          <Button
            onClick={() => loadImportableEvents()}
            title={"IBU-Rennen laden"}
            isEnabled={!isProcessing}
            type={"positive"}
          />
          {message && <p className="text-sm text-amber-200">{message}</p>}
        </div>
      )}
      {selectingEventsToImport && events.length > 0 && (
        <EventImportList events={events} onSelectEventItems={_onSelectedImportedEventsChange} />
      )}
    </>
  );
}
