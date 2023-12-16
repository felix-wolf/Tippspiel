import { FormEvent } from "react";
import styles from "./DateTimePicker.module.scss";

type DateTimePickerProps = {
  onTimeSet: (time: string) => void;
  onDateSet: (date: Date) => void;
  initialTime?: string;
  initialDate?: Date;
};

export function DateTimePicker({
  onDateSet: _onDateSet,
  onTimeSet: _onTimeSet,
  initialTime,
}: DateTimePickerProps) {
  return (
    <>
      <input
        className={styles.date}
        type={"date"}
        placeholder={"yyyy-mm-dd"}
        onChange={(event: FormEvent<HTMLInputElement>) => {
          const target: HTMLInputElement = event.target as HTMLInputElement;
          const d = target.valueAsDate;
          if (d) {
            _onDateSet(d);
          }
        }}
      />
      <input
        type={"time"}
        onChange={(ev) => _onTimeSet(ev.target.value)}
        min="00:00"
        max="23:59"
        step="60"
        //value={time}
        defaultValue={initialTime}
      />
    </>
  );
}
