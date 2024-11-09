import styles from "./URLEventImporter.module.scss";
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
import { Utils } from "../../utils.ts";

type URLEventImporterProps = {
  eventsUrl: string;
  game: Game;
  onEventsFetched: (events: Event[]) => void;
  onDismiss: () => void;
};

export function URLEventImporter({
  game,
  eventsUrl,
  onEventsFetched: _onEventsFetched,
  onDismiss: _onDismiss,
}: URLEventImporterProps) {
  const [shaking, setShaking] = useState(false);
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<EventImportListItem[]>([]);
  const [selectingEventsToImport, setSelectingEventsToImport] = useState(false);

  const uploadResults = useCallback(() => {
    if (game) {
      setIsProcessing(true);
      game
        .processUrlForEvents(url)
        .then((events) => {
          setEvents(
            events.map((event: Event, idx) => {
              return {
                name: event.name,
                datetime: Utils.dateToString(event.datetime),
                index: idx,
                isChecked: true,
                importCheckbox: undefined,
                event: event,
              };
            }),
          );
          console.log(events);
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

  const importSelectedEvents = useCallback(() => {
    if (game) {
      setIsProcessing(true);
      game
        .saveImportedEvents(
          events.filter((e) => e.isChecked).map((e) => e.event),
        )
        .then((events) => {
          console.log("yey");
          console.log(events);
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
  }, [game, events]);

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
        <>
          <div className={styles.buttonContainer}>
            <Button
              onClick={() => {
                setEvents(
                  events.map((event) => {
                    return { ...event, isChecked: true }; // Return a new object with updated isChecked
                  }),
                );
              }}
              title={"Alle auswählen"}
            />
            <Button
              onClick={() => {
                setEvents(
                  events.map((event) => {
                    return { ...event, isChecked: false }; // Return a new object with updated isChecked
                  }),
                );
              }}
              title={"Alle abwählen"}
            />
            <Button
              onClick={() => importSelectedEvents()}
              type={"positive"}
              title={`${
                events.filter((e) => e.isChecked).length
              } Events importieren`}
              isEnabled={events.filter((e) => e.isChecked).length > 0}
            />
            <Button
              onClick={() => importSelectedEvents()}
              type={"negative"}
              title={"Abbrechen"}
            />
          </div>
          <EventImportList
            events={events}
            onChange={(index, value) => {
              setEvents(
                events.map((event, idx) => {
                  if (idx === index) {
                    return { ...event, isChecked: value }; // Return a new object with updated isChecked
                  }
                  return event; // Return the existing event
                }),
              );
            }}
          />
        </>
      )}
    </>
  );
}
