import { Event } from "../../../models/Event.ts";
import { Utils } from "../../../utils.ts";
import { useState } from "react";
import { Button } from "../../design/Button.tsx";
import { Badge, BadgeCheck } from "lucide-react";

export type EventImportListItem = {
  importCheckbox: undefined;
  name: string;
  datetime: string;
  isChecked: boolean;
  index: number;
  eventType: string;
  event: Event;
};

type EventImportListProps = {
  events: Event[];
  onSelectEventItems: (events: Event[]) => void
};

export function EventImportList({
  events,
  onSelectEventItems: _onSelectEventItems
}: EventImportListProps) {
  const [eventItems, setEventItems] = useState<EventImportListItem[]>(
    events.map((event: Event, idx) => {
      return {
        name: event.name,
        datetime: Utils.dateToString(event.datetime),
        index: idx,
        isChecked: true,
        importCheckbox: undefined,
        eventType: event.type.display_name,
        event: event,
      };
    }),
  );

  return (
    !!eventItems &&
    eventItems?.length != 0 && (
      <div className="flex flex-col gap-2">
        <Button
          onClick={() => {
            const items: EventImportListItem[] = eventItems.map((event) => {
              return { ...event, isChecked: true };
            })
            setEventItems(items);
            _onSelectEventItems(items.filter((e) => e.isChecked).map(e => e.event));
          }}
          title={"Alle auswählen"}
        />
        <Button
          onClick={() => {
            const items: EventImportListItem[] = eventItems.map((event) => {
              return { ...event, isChecked: false };
            })
            setEventItems(items);
            _onSelectEventItems(items.filter((e) => e.isChecked).map(e => e.event));
          }}
          title={"Alle abwählen"}
        />
        <div className="flex flex-col max-h-100 overflow-y-auto gap-1">
          {eventItems.map((event, idx) =>
          (<div
            onClick={() => {
              const items: EventImportListItem[] = eventItems.map((e) => {
                if (idx === e.index) {
                  return { ...e, isChecked: !event.isChecked };
                }
                return e;
              })
              setEventItems(items);
              _onSelectEventItems(items.filter((e) => e.isChecked).map(e => e.event));
            }}
            key={event.name}
            className={`
                grid grid-row-2 grid-col-2 gap-2 justify-start items-start bg-white/70 rounded-xl p-2 shadow-sm
                `}
          >
            {event.isChecked ? <BadgeCheck className="row-span-2" /> : <Badge className="row-span-2" />}
            <p className={`
                    font-medium flex
                    ${event.isChecked ? "text-black-500" : "text-gray-400"}
                    `}>
              {event.name}</p>

            <p className={"text-sm text-gray-600 col-start-2"}>{event.datetime}</p>
          </div>)
          )}
        </div>
      </div>
    )
  );
}
