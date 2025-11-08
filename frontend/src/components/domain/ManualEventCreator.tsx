import { TextField } from "../design/TextField.tsx";
import { DropDown, DropDownOption } from "../design/DropDown.tsx";
import { DateTimePicker } from "../design/DateTimePicker.tsx";
import { useEffect, useState } from "react";
import { Utils } from "../../utils.ts";
import { EventType } from "../../models/user/EventType.ts";
import { Event } from "../../models/Event.ts";
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
  onSelectEvents: (events: Event[]) => void;
  types: EventType[] | undefined;
  event?: Event;
  onEventDeleted: () => void;
};

export function ManualEventCreator({
  onSelectEvents: _onSelectEvents,
  types,
  event,
  onEventDeleted: _onEventDeleted,
}: ManualEventCreatorProps) {
  const [shaking, setshaking] = useState(false);

  const [eventDetails, setEventDetails] = useState<EventDetail>(
    createEventDetails(event),
  );
  const options: DropDownOption[] | undefined = types?.map((type) => {
    return { id: type.id, label: type.display_name };
  });

  useEffect(() => {
    if (event) {
      if (
        JSON.stringify(eventDetails) !== JSON.stringify(createEventDetails(event)) && 
        eventDetails.name != "" &&
        eventDetails.type
      ) {
        const updatedEvent = new Event(
          event.id,
          eventDetails.name,
          event.game_id,
          eventDetails.type,
          Utils.dateToString(eventDetails.date),
          eventDetails.numBets,
          eventDetails.pointsCorrectBet,
          eventDetails.allowPartialPoints,
          [],
          [],
          [],
          eventDetails.date
        )
        _onSelectEvents([updatedEvent])
      } else {
        _onSelectEvents([]);
      }
    } else if (eventDetails && eventDetails.type && eventDetails.name != "") {
      const d = eventDetails.date;
      d.setHours(
        Number(eventDetails.time.split(":")[0]),
        Number(eventDetails.time.split(":")[1]),
        0,
        0,
      );
      const updatedEvent = new Event(
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
      _onSelectEvents([updatedEvent])
    } else {
      _onSelectEvents([]);
    }
  }, [event, eventDetails]);

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
    <form
      className="w-full flex flex-col gap-2"
      onSubmit={(event) => event.preventDefault()}
    >
      <TextField
        initialValue={eventDetails.name}
        placeholder={"Name"}
        onInput={(i) => setEventDetails({ ...eventDetails, name: i })}
      />
      <div className="flex flex-row items-center justify-between">
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

      <div className="grid grid-cols-3 items-center justify-between gap-2">
        <div className="text-white">Plätze zu tippen</div>
        <div className="col-span-2">
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
      <div className="grid grid-cols-3 items-center justify-between gap-2">
        <div className="text-white">Punkte für korrekte Tipps</div>
        <div className="col-span-2">
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
      <div className="flex flex-row items-center justify-between gap-2">
        <div className="text-white">Vergabe von Teilpunkte</div>
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
      {event &&
        (eventDetails.type?.id != event.type.id ||
          eventDetails.numBets != event.numBets) && (
          <div className="text-red-400">
            ACHTUNG: Speichern der Änderung löscht alle bereits platzierten
            Tipps!
          </div>
        )}
      {event && (
        <DeleteButton
          shaking={shaking}
          onFinalClick={() => onDeleteEvente(event)}
        />
      )}
    </form>

  );
}
