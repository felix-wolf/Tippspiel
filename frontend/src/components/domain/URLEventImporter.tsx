import { Shakable } from "../design/Shakable.tsx";
import { TextField } from "../design/TextField.tsx";
import { Button } from "../design/Button.tsx";
import { useCallback, useState } from "react";
import { Game } from "../../models/Game.ts";
import { Event } from "../../models/Event.ts";
import { EventImportList } from "./lists/EventImportList.tsx";

type URLEventImporterProps = {
  eventsUrl: string;
  game: Game;
  onSelectEvents: (events: Event[]) => void;
  onSelectingEventsToImport: (selecting: boolean) => void;
};

export function URLEventImporter({
  game,
  eventsUrl,
  onSelectEvents: _onSelectEvents,
  onSelectingEventsToImport: _onSelectingEventsToImport
}: URLEventImporterProps) {
  const [shaking, setShaking] = useState(false);
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectingEventsToImport, setSelectingEventsToImport] = useState(false);

  const searchForEvents = useCallback(() => {
    if (game) {
      setIsProcessing(true);
      game
        .processUrlForEvents(url)
        .then((events) => {
          setEvents(events);
          _onSelectEvents(events);
          setSelectingEventsToImport(true);
          _onSelectingEventsToImport(true);
        })
        .catch((_) => {
          setIsProcessing(false);
          setShaking(true);
          setTimeout(() => setShaking(false), 300);
        });
    }
  }, [game, url]);

  return (
    <>
      {!selectingEventsToImport && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
          }}
          className="grid grid-cols-3 gap-4 justify-center items-center"
        >
          <div className="col-span-2">
            <Shakable shaking={shaking}>
              <TextField placeholder={eventsUrl} onInput={(i) => setUrl(i)} />
            </Shakable>
          </div>
          <div className="w-full">
            <Button
              onClick={() => searchForEvents()}
              title={"suchen"}
              isEnabled={url != "" && !isProcessing}
              type={"positive"}
            />
          </div>
        </form>
      )}
      {selectingEventsToImport && events && events.length > 0 && (
        <EventImportList
          events={events}
          onSelectEventItems={_onSelectEvents}
        />
      )}
    </>
  );
}
