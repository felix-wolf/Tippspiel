import styles from "./ManualEventCreator.module.scss";
import { TextField } from "../design/TextField.tsx";
import { DropDown, DropDownOption } from "../design/DropDown.tsx";
import { DateTimePicker } from "../design/DateTimePicker.tsx";
import { Button } from "../design/Button.tsx";
import { useCallback, useState } from "react";
import { Utils } from "../../utils.ts";
import { EventType } from "../../models/user/EventType.ts";
import { Event } from "../../models/Event.ts";
import { Shakable } from "../design/Shakable.tsx";
import { cls } from "../../styles/cls.ts";

type ManualEventCreatorProps = {
  onClick: (type: EventType, name: string, datetime: Date) => Promise<boolean>;
  onDismiss: () => void;
  types: EventType[] | undefined;
  event?: Event;
  onEventSaved: () => void;
  onEventDeleted: () => void;
};

export function ManualEventCreator({
  onClick: _onClick,
  types,
  event,
  onDismiss: _onDismiss,
  onEventSaved: _onEventSaved,
  onEventDeleted: _onEventDeleted,
}: ManualEventCreatorProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shaking, setshaking] = useState(false);
  const [name, setName] = useState(event ? event.name : "");
  const [time, setTime] = useState(
    event ? Utils.getTimeString(event.datetime) : "09:00",
  );
  const [date, setDate] = useState(event ? event.datetime : new Date());

  const options: DropDownOption[] | undefined = types?.map((type) => {
    return { id: type.id, label: type.display_name };
  });
  const [type, setType] = useState<EventType | undefined>(
    event ? event.type : types ? types[0] : undefined,
  );

  const onCreateSingleEventClick = useCallback(() => {
    if (type) {
      const d = date;
      d.setHours(Number(time.split(":")[0]), Number(time.split(":")[1]), 0, 0);
      _onClick(type, name, d)
        .then((success) => {
          if (success) _onEventSaved();
        })
        .catch((error) => console.log(error));
    }
  }, [type, time, date, name]);

  function buttonEnabled(): boolean {
    if (event) {
      return (
        name != event.name ||
        type?.id != event.type.id ||
        time != Utils.getTimeString(event.datetime) ||
        date.getTime() != event.datetime.getTime()
      );
    }
    return name != "";
  }

  return (
    <div className={styles.deleteButtonContainer}>
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
        </div>
        <div className={styles.row}>
          <DateTimePicker
            onDateSet={(date) => setDate(date)}
            onTimeSet={(time) => setTime(time)}
            initialDate={date}
            initialTime={time}
          />
          <DropDown
            onChange={(option) =>
              setType(types?.find((type) => type.id == option?.id))
            }
            options={options ?? []}
            initial={options?.find((opt) => opt.id == type?.id) ?? undefined}
          />
        </div>
        {event && type?.id != event.type.id && (
          <div className={cls(styles.warning, styles.row)}>
            ACHTUNG: Ändern der Eventart löscht alle bereits platzierten Tipps!
          </div>
        )}
        <div className={styles.row}>
          <Button
            onClick={onCreateSingleEventClick}
            title={event ? "Speichern" : "Erstellen"}
            type={"positive"}
            width={"flexible"}
            isEnabled={buttonEnabled()}
          />
          {!event && (
            <div className={styles.button}>
              <Button
                onClick={_onDismiss}
                title={"Abbrechen"}
                type={"negative"}
                width={"flexible"}
              />
            </div>
          )}
        </div>
      </form>

      {event && (
        <div className={styles.button}>
          <Shakable shaking={shaking}>
            {!confirmDelete && (
              <Button
                onClick={() => setConfirmDelete(true)}
                title={"Löschen"}
                type={"negative"}
                width={"flexible"}
              />
            )}
            {confirmDelete && (
              <Button
                onClick={() => {
                  setConfirmDelete(false);
                  event
                    .delete()
                    .then(_onEventDeleted)
                    .catch(() => {
                      setshaking(true);
                      setTimeout(() => setshaking(false), 300);
                    });
                }}
                title={"Wirklich löschen"}
                type={"negative"}
                width={"flexible"}
              />
            )}
          </Shakable>
        </div>
      )}
    </div>
  );
}
