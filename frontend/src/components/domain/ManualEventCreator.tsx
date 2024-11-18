import styles from "./ManualEventCreator.module.scss";
import { TextField } from "../design/TextField.tsx";
import { DropDown, DropDownOption } from "../design/DropDown.tsx";
import { DateTimePicker } from "../design/DateTimePicker.tsx";
import { Button } from "../design/Button.tsx";
import { useCallback, useState } from "react";
import { Utils } from "../../utils.ts";
import { EventType } from "../../models/user/EventType.ts";
import { Event } from "../../models/Event.ts";
import { cls } from "../../styles/cls.ts";
import { DeleteButton } from "../design/DeleteButton.tsx";
import { Checkbox } from "../design/Checkbox.tsx";

type EventDetail = {
  name: string;
  time: string;
  date: Date;
  pointsCorrectBet: number;
  numBets: number;
  type: EventType | undefined;
  allowPartialPoints: boolean;
};

type ManualEventCreatorProps = {
  onClick: (updatedEvent: Event) => Promise<boolean>;
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
  const [shaking, setshaking] = useState(false);

  const [eventDetails, setEventDetails] = useState<EventDetail>(
    createEventDetails(event),
  );
  const options: DropDownOption[] | undefined = types?.map((type) => {
    return { id: type.id, label: type.display_name };
  });

  function createEventDetails(event?: Event): EventDetail {
    return {
      name: event ? event.name : "",
      time: event ? Utils.getTimeString(event.datetime) : "09:00",
      date: event ? event.datetime : new Date(),
      type: event ? event.type : types ? types[0] : undefined,
      numBets: event ? event.numBets : 5,
      pointsCorrectBet: event ? event.pointsCorrectBet : 5,
      allowPartialPoints: event ? event.allowPartialPoints : true,
    };
  }

  const onCreateSingleEventClick = useCallback(() => {
    if (eventDetails && eventDetails.type) {
      const d = eventDetails.date;
      d.setHours(
        Number(eventDetails.time.split(":")[0]),
        Number(eventDetails.time.split(":")[1]),
        0,
        0,
      );
      const e = new Event(
        "",
        eventDetails.name,
        "",
        eventDetails.type,
        Utils.dateToString(d),
        eventDetails.numBets,
        eventDetails.pointsCorrectBet,
        eventDetails.allowPartialPoints,
        [],
        [],
        [],
        d,
      );
      _onClick(e)
        .then((success) => {
          if (success) _onEventSaved();
        })
        .catch((error) => console.log(error));
    }
  }, [eventDetails]);

  function buttonEnabled(): boolean {
    // TODO: REWORK THIS
    if (event) {
      return (
        JSON.stringify(eventDetails) !==
        JSON.stringify(createEventDetails(event))
      );
    }
    return eventDetails.name != "";
  }

  function onDeleteEvente(event: Event) {
    event
      .delete()
      .then(_onEventDeleted)
      .catch(() => {
        setshaking(true);
        setTimeout(() => setshaking(false), 300);
      });
  }

  return (
    <div className={styles.deleteButtonContainer}>
      <form
        className={styles.form}
        onSubmit={(event) => event.preventDefault()}
      >
        <div className={styles.row}>
          <TextField
            initialValue={eventDetails.name}
            placeholder={"Name"}
            onInput={(i) => setEventDetails({ ...eventDetails, name: i })}
          />
        </div>
        <div className={styles.row}>
          <DateTimePicker
            onDateSet={(date) =>
              setEventDetails({ ...eventDetails, date: date })
            }
            onTimeSet={(time) =>
              setEventDetails({ ...eventDetails, time: time })
            }
            initialDate={eventDetails.date}
            initialTime={eventDetails.time}
          />
          <DropDown
            onChange={(option) =>
              setEventDetails({
                ...eventDetails,
                type: types?.find((type) => type.id == option?.id),
              })
            }
            options={options ?? []}
            initial={
              options?.find((opt) => opt.id == eventDetails.type?.id) ??
              undefined
            }
          />
        </div>

        <div className={styles.row}>
          <div className={styles.text}>Plätze zu tippen</div>
          <div className={styles.numberInputContainer}>
            <TextField
              onInput={(input) =>
                setEventDetails({ ...eventDetails, numBets: parseInt(input) })
              }
              placeholder={"Plätze zu tippen"}
              type={"number"}
              initialValue={eventDetails.numBets.toString()}
            />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.text}>Punkte für korrekte Tipps</div>
          <div className={styles.numberInputContainer}>
            <TextField
              onInput={(input) =>
                setEventDetails({
                  ...eventDetails,
                  pointsCorrectBet: parseInt(input),
                })
              }
              placeholder={"Punkte für korrekte Tipps"}
              type={"number"}
              initialValue={eventDetails.pointsCorrectBet.toString()}
            />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.text}>Vergabe von Teilpunkte</div>
          <div>
            <Checkbox
              onChange={(newValue) =>
                setEventDetails({
                  ...eventDetails,
                  allowPartialPoints: newValue,
                })
              }
              checked={eventDetails.allowPartialPoints}
            />
          </div>
        </div>
        {event &&
          (eventDetails.type?.id != event.type.id ||
            eventDetails.numBets != event.numBets) && (
            <div className={cls(styles.warning, styles.row)}>
              ACHTUNG: Speichern der Änderung löscht alle bereits platzierten
              Tipps!
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
        <DeleteButton
          shaking={shaking}
          onFinalClick={() => onDeleteEvente(event)}
        />
      )}
    </div>
  );
}
