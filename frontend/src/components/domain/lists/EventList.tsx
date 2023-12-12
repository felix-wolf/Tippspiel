import React from "react";
import { Event } from "../../../models/Event";
import { List } from "./List";
import { EventItem } from "./EventItem";

export type EventTimeType = "upcoming" | "past";

type EventListProps = {
  type: EventTimeType;
  events: Event[];
  emptyButton?: React.ReactNode;
  onEventClicked?: (event_id: string) => void;
};

export function EventList({
  type,
  emptyButton,
  events,
  onEventClicked: _onEventClicked,
}: EventListProps) {
  return (
    <div>
      <List
        title={type == "upcoming" ? "Anstehende Events" : "Vergangene Events"}
        items={events.map((event) => (
          <EventItem
            key={event.id}
            hasBets={event.bets !== undefined && event.bets.length == 5}
            event={event}
            type={type}
            onEventClicked={_onEventClicked}
          />
        ))}
        emptyText={emptyButton ? undefined : "Es gab noch keine..."}
        emptyContent={events.length == 0 && emptyButton}
      />
    </div>
  );
}
