import styles from "./ManualEventCreator.module.scss";
import { TextField } from "../design/TextField.tsx";
import { DropDown, DropDownOption } from "../design/DropDown.tsx";
import { DateTimePicker } from "../design/DateTimePicker.tsx";
import { Button } from "../design/Button.tsx";
import { useCallback, useEffect, useState } from "react";
import { Utils } from "../../utils.ts";
import { EventType } from "../../models/user/EventType.ts";
import { Event } from "../../models/Event.ts";

type ManualEventCreatorProps = {
  onClick: (type: EventType, name: string, datetime: Date) => Promise<boolean>;
  onDismiss: () => void;
  types: EventType[] | undefined;
  event?: Event;
};

export function ManualEventCreator({
  onClick: _onClick,
  types,
  event,
  onDismiss: _onDismiss,
}: ManualEventCreatorProps) {
  const [name, setName] = useState("");
  const [time, setTime] = useState("09:00");
  const [date, setDate] = useState(new Date());
  const [saveButtonText, setSaveButtonText] = useState("Erstellen");

  useEffect(() => {
    if (event) {
      setTime(Utils.getTimeString(event.datetime));
      setName(event.name);
      setType(event.type);
      setDate(event.datetime);
      setSaveButtonText("Speichern");
    }
  }, [event, setTime]);

  const options: DropDownOption[] | undefined = types?.map((type) => {
    return { id: type.id, label: type.display_name };
  });
  const [type, setType] = useState<EventType | undefined>(
    types ? types[0] : undefined,
  );

  const onCreateSingleEventClick = useCallback(() => {
    if (type) {
      const d = date;
      d.setHours(Number(time.split(":")[0]), Number(time.split(":")[1]), 0, 0);
      _onClick(type, name, d)
        .then((success) => {
          if (success) _onDismiss();
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

  return (
    <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
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
              onClick={_onDismiss}
              title={"Abbrechen"}
              type={"negative"}
              width={"flexible"}
            />
          </div>
        )}
      </div>
    </form>
  );
}
