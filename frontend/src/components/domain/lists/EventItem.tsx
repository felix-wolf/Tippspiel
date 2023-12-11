import styles from "./EventItem.module.scss";
import { Button } from "../../design/Button";
import { EventTimeType } from "./EventList";
import { Event } from "../../../models/Event";

type EventItemProps = {
  hasBets: boolean;
  event: Event;
  type: EventTimeType;
  onEventClicked?: (event_id: string) => void;
};

export function EventItem({
  hasBets,
  event,
  type,
  onEventClicked: _onEventClicked,
}: EventItemProps) {
  function dateToString(date: Date): string {
    return `${date.getDate()}.${date.getMonth()}.${date.getFullYear()} - ${getDoubleDigit(
      date.getHours().toString(),
    )}:${getDoubleDigit(date.getMinutes().toString())}`;
  }

  function getDoubleDigit(digits: string): string {
    if (digits.length == 2) return digits;
    return "0" + digits;
  }

  return (
    <div className={styles.container}>
      <div>{event.name}</div>
      <div>{dateToString(event.datetime)}</div>
      {type == "past" && <div>Score: 0</div>}
      {(hasBets || type == "upcoming") && (
        <div className={styles.buttonContainer}>
          <Button
            onClick={() => {
              if (_onEventClicked) _onEventClicked(event.id);
            }}
            type={hasBets ? "neutral" : "positive"}
            title={hasBets ? "Tipps einsehen" : "Tippen"}
            width={"flexible"}
            height={"flexible"}
          />
        </div>
      )}
    </div>
  );
}
