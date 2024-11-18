import styles from "./URLEventImporter.module.scss";
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
  onEventsFetched: (events: Event[]) => void;
  onDismiss: () => void;
  onEventsSaved: () => void;
};

export function URLEventImporter({
  game,
  eventsUrl,
  onEventsFetched: _onEventsFetched,
  onDismiss: _onDismiss,
  onEventsSaved: _onEventsSaved,
}: URLEventImporterProps) {
  const [shaking, setShaking] = useState(false);
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectingEventsToImport, setSelectingEventsToImport] = useState(false);

  const uploadResults = useCallback(() => {
    if (game) {
      setIsProcessing(true);
      game
        .processUrlForEvents(url)
        .then((events) => {
          setEvents(events);
          _onEventsFetched(events);
          setSelectingEventsToImport(true);
        })
        .catch((_) => {
          //setNumberOfErrors(numberOfErrors + 1);
          setIsProcessing(false);
          setShaking(true);
          setTimeout(() => setShaking(false), 300);
        });
    }
  }, [game, url]);

  const importSelectedEvents = useCallback(
    (events: Event[]) => {
      if (game) {
        setIsProcessing(true);
        Event.saveImportedEvents(events)
          .then(() => {
            setSelectingEventsToImport(false);
            _onEventsSaved();
          })
          .catch((_) => {
            //setNumberOfErrors(numberOfErrors + 1);
            setSelectingEventsToImport(false);
            _onDismiss();
          });
      }
    },
    [game],
  );

  return (
    <>
      {!selectingEventsToImport && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
          }}
          className={styles.container}
        >
          <Shakable shaking={shaking}>
            <TextField placeholder={eventsUrl} onInput={(i) => setUrl(i)} />
          </Shakable>
          <div className={styles.row}>
            <div className={styles.wide}>
              <Button
                onClick={() => uploadResults()}
                title={"Nach Events suchen"}
                isEnabled={url != "" && !isProcessing}
                type={"positive"}
                width={"flexible"}
              />
            </div>
            <div className={styles.narrow}>
              <Button
                onClick={() => {
                  _onDismiss();
                }}
                title={"Abbrechen"}
                type={"negative"}
                width={"flexible"}
              />
            </div>
          </div>
        </form>
      )}
      {selectingEventsToImport && events && events.length > 0 && (
        <EventImportList
          events={events}
          onDismiss={() => setSelectingEventsToImport(false)}
          onImportEvents={(events) => importSelectedEvents(events)}
        />
      )}
    </>
  );
}
