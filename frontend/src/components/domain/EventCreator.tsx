import { Button } from "../design/Button";
import { useCallback, useState } from "react";
import { TextField } from "../design/TextField";
import { DateTimePicker } from "../design/DateTimePicker";
import { DropDown } from "../design/DropDown";
import { EventType, EventTypes } from "../../models/Event";
import styles from "./EventCreator.module.scss";

type EventCreatorProps = {
  onClick: (type: EventType, name: string, datetime: Date) => void;
  types: EventType[];
};

export function EventCreator({ onClick: _onClick, types }: EventCreatorProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [time, setTime] = useState("09:00");
  const [date, setDate] = useState(new Date());
  const [type, setType] = useState<EventType>("relay");

  const onClick = useCallback(() => {
    const d = date;
    d.setHours(Number(time.split(":")[0]), Number(time.split(":")[1]), 0, 0);
    _onClick(type, name, d);
  }, [type, time, date, name]);

  return (
    <>
      {creating && (
        <form
          className={styles.form}
          onSubmit={(event) => event.preventDefault()}
        >
          <div className={styles.row}>
            <TextField
              placeholder={"Name"}
              onInput={(i) => {
                setName(i);
              }}
            />
            <DropDown
              onChange={(option) => setType(option?.id as EventType)}
              options={types.map((type) => {
                return { id: type, label: EventTypes[type] };
              })}
              initial={{ id: type, label: EventTypes[type] }}
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
              onClick={onClick}
              title={"Erstellen"}
              type={"positive"}
              width={"flexible"}
            />
          </div>
        </form>
      )}
      {!creating && (
        <Button
          onClick={() => setCreating(true)}
          type={"positive"}
          title={"Erstell ein neues Event"}
        />
      )}
    </>
  );
}
