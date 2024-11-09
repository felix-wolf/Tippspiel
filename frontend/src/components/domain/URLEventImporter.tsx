import styles from "./URLRaceImporter.module.scss";
import { Shakable } from "../design/Shakable.tsx";
import { TextField } from "../design/TextField.tsx";
import { Button } from "../design/Button.tsx";
import { useCallback, useState } from "react";
import { Game } from "../../models/Game.ts";
import { Event } from "../../models/Event.ts";
import {
  EventImportList,
  EventImportListItem,
} from "./lists/EventImportList.tsx";

type URLEventImporterProps = {
  eventsUrl: string;
  game: Game;
  onEventsFetched: (events: Event[]) => void;
};

export function URLEventImporter({
  game,
  eventsUrl,
  onEventsFetched: _onEventsFetched,
}: URLEventImporterProps) {
  const [shaking, setShaking] = useState(false);
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<EventImportListItem[]>();

  let _events: EventImportListItem[] = [];

  const uploadResults = useCallback(() => {
    if (game) {
      setIsProcessing(true);
      game
        .processUrlForEvents(url)
        .then((events) => {
          _events = events.map((event: Event, idx) => {
            return {
              name: event.name,
              datetime: event.datetime.toString(),
              index: idx,
              isChecked: true,
              importCheckbox: undefined,
            };
          });
          setEvents(
            events.map((event: Event, idx) => {
              return {
                name: event.name,
                datetime: event.datetime.toString(),
                index: idx,
                isChecked: true,
                importCheckbox: undefined,
              };
            }),
          );
          console.log(events);
          _onEventsFetched(events);
        })
        .catch((_) => {
          //setNumberOfErrors(numberOfErrors + 1);
          setIsProcessing(false);
          setShaking(true);
          setTimeout(() => setShaking(false), 300);
        });
    }
  }, [game, url]);

  return (
    <>
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
              onClick={() => {}}
              title={"Abbrechen"}
              type={"negative"}
              width={"flexible"}
            />
          </div>
        </div>
      </form>
      {_events && _events.length > 0 && (
        <EventImportList
          events={_events}
          onChange={(index, value) => {
            _events = _events.map((event, idx) => {
              if (idx === index) {
                return { ...event, isChecked: value }; // Return a new object with updated isChecked
              }
              return event; // Return the existing event
            });
            console.log(events);
          }}
        />
      )}
    </>
  );
}
