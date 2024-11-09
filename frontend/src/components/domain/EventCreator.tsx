import { Button } from "../design/Button";
import { useCallback, useEffect, useState } from "react";
import { TextField } from "../design/TextField";
import { DateTimePicker } from "../design/DateTimePicker";
import { DropDown, DropDownOption } from "../design/DropDown";
import styles from "./EventCreator.module.scss";
import { EventType } from "../../models/user/EventType";
import { Event } from "../../models/Event";
import { Utils } from "../../utils";
import { URLEventImporter } from "./URLEventImporter.tsx";
import { Game } from "../../models/Game.ts";

type EventCreatorProps = {
  onClick: (type: EventType, name: string, datetime: Date) => Promise<boolean>;
  types: EventType[] | undefined;
  event?: Event;
  game?: Game;
};

export function EventCreator({
  onClick: _onClick,
  types,
  event,
  game,
}: EventCreatorProps) {
  const [creatingSingleEvent, setCreatingSingleEvent] = useState(false);
  const [importingEvents, setImportingEvents] = useState(false);
  const [name, setName] = useState("");
  const [time, setTime] = useState("09:00");
  const [date, setDate] = useState(new Date());
  const [saveButtonText, setSaveButtonText] = useState("Erstellen");

  const options: DropDownOption[] | undefined = types?.map((type) => {
    return { id: type.id, label: type.display_name };
  });
  const [type, setType] = useState<EventType | undefined>(
    types ? types[0] : undefined,
  );

  useEffect(() => {
    if (event) {
      setCreatingSingleEvent(true);
      setTime(Utils.getTimeString(event.datetime));
      setName(event.name);
      setType(event.type);
      setDate(event.datetime);
      setSaveButtonText("Speichern");
    }
  }, [event, setTime]);

  const onCreateSingleEventClick = useCallback(() => {
    if (type) {
      const d = date;
      d.setHours(Number(time.split(":")[0]), Number(time.split(":")[1]), 0, 0);
      _onClick(type, name, d)
        .then((success) => {
          if (success) setCreatingSingleEvent(false);
        })
        .catch((error) => console.log(error));
    }
  }, [type, time, date, name]);

  function buttonEnabled(): boolean {
    if (event) {
      return (
        name != event.name ||
        type != event.type ||
        time != Utils.getTimeString(event.datetime) ||
        date.getTime() != event.datetime.getTime()
      );
    }
    return name != "";
  }

  console.log(game, game?.discipline.eventsUrl);

  return (
    <>
      {importingEvents && game?.discipline?.eventsUrl && (
        <URLEventImporter
          game={game}
          eventsUrl={game.discipline.eventsUrl}
          onEventsFetched={() => setImportingEvents(true)}
        />
      )}
      {creatingSingleEvent && (
        <form
          className={styles.form}
          onSubmit={(event) => event.preventDefault()}
        >
          <div className={styles.row}>
            <TextField
              initialValue={name}
              placeholder={"Name"}
              onInput={(i) => {
                setName(i);
              }}
            />
            <DropDown
              onChange={(option) =>
                setType(types?.find((type) => type.id == option?.id))
              }
              options={options ?? []}
              initial={options?.find((opt) => opt.id == type?.id) ?? undefined}
            />
          </div>

          <div className={styles.row}>
            <DateTimePicker
              onDateSet={(date) => setDate(date)}
              onTimeSet={(time) => setTime(time)}
              initialDate={date}
              initialTime={time}
            />
            <Button
              onClick={onCreateSingleEventClick}
              title={saveButtonText}
              type={"positive"}
              width={"flexible"}
              isEnabled={buttonEnabled()}
            />
            {!event && (
              <div style={{ width: "100px" }}>
                <Button
                  onClick={() => setCreatingSingleEvent(false)}
                  title={"Close"}
                  type={"negative"}
                  width={"flexible"}
                />
              </div>
            )}
          </div>
        </form>
      )}

      {
        <div className={styles.container}>
          {!creatingSingleEvent && (
            <Button
              onClick={() => setCreatingSingleEvent(true)}
              type={"positive"}
              title={"Erstell ein neues Event"}
            />
          )}
          {!importingEvents && (
            <Button
              onClick={() => setImportingEvents(true)}
              type={"positive"}
              title={"Importiere Events"}
            />
          )}
        </div>
      }
    </>
  );
}
