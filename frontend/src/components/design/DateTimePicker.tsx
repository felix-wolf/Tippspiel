import { useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import de from "date-fns/locale/de"; // the locale you want
import "react-datepicker/dist/react-datepicker.css";
import styles from "./DateTimePicker.module.scss";

registerLocale("de", de);

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
  initialDate,
}: DateTimePickerProps) {
  const [date, setDate] = useState(initialDate ?? new Date());
  return (
    <>
      <div className={styles.container}>
        <DatePicker
          wrapperClassName={styles.date}
          dateFormat={"dd.MM.yyyy"}
          locale={"de"}
          selected={date}
          onChange={(i) => {
            if (i) {
              setDate(i);
              _onDateSet(i);
            }
          }}
        />
      </div>
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
