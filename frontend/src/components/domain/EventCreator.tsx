import { Button } from "../design/Button";
import { useCallback, useState } from "react";
import { TextField } from "../design/TextField";
import { DateTimePicker } from "../design/DateTimePicker";
import { DropDown, DropDownOption } from "../design/DropDown";
import styles from "./EventCreator.module.scss";
import { EventType } from "../../models/user/EventType";

type EventCreatorProps = {
  onClick: (type: EventType, name: string, datetime: Date) => void;
  types: EventType[] | undefined;
};

export function EventCreator({ onClick: _onClick, types }: EventCreatorProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [time, setTime] = useState("09:00");
  const [date, setDate] = useState(new Date());

  const options: DropDownOption[] | undefined = types?.map((type) => {
    return { id: type.id, label: type.display_name };
  });
  const [type, setType] = useState<EventType | undefined>(
    types ? types[0] : undefined,
  );

  const onClick = useCallback(() => {
    if (type) {
      const d = date;
      d.setHours(Number(time.split(":")[0]), Number(time.split(":")[1]), 0, 0);
      _onClick(type, name, d);
    }
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
              onChange={(option) =>
                setType(types?.find((type) => type.id == option?.id))
              }
              options={options ?? []}
              initial={options && options.length > 0 ? options[0] : undefined}
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
              isEnabled={name != ""}
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
