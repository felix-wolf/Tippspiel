import { Button } from "../design/Button";
import { useCallback, useEffect, useState } from "react";
import { TextField } from "../design/TextField";
import { DateTimePicker } from "../design/DateTimePicker";
import { DropDown, DropDownOption } from "../design/DropDown";
import styles from "./EventCreator.module.scss";
import { EventType } from "../../models/user/EventType";
import { Event } from "../../models/Event";
import { Utils } from "../../utils";

type EventCreatorProps = {
  onClick: (type: EventType, name: string, datetime: Date) => Promise<boolean>;
  types: EventType[] | undefined;
  event?: Event;
};

export function EventCreator({
  onClick: _onClick,
  types,
  event,
}: EventCreatorProps) {
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

  useEffect(() => {
    if (event) {
      setCreating(true);
      setTime(Utils.getTimeString(event.datetime));
      setName(event.name);
      setType(event.type);
      setDate(event.datetime);
    }
  }, [event, setTime]);

  const onClick = useCallback(() => {
    if (type) {
      const d = date;
      d.setHours(Number(time.split(":")[0]), Number(time.split(":")[1]), 0, 0);
      _onClick(type, name, d)
        .then((success) => {
          if (success) setCreating(false);
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
    <>
      {creating && (
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
              onClick={onClick}
              title={"Erstellen"}
              type={"positive"}
              width={"flexible"}
              isEnabled={buttonEnabled()}
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
