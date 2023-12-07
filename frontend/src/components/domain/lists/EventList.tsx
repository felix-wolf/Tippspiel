import React from "react";
import { Game } from "../../../models/Game";
import { Event } from "../../../models/Event";
import { List } from "./List";

type EventListProps = {
  type: "upcoming" | "past";
  game?: Game;
  events: Event[];
  emptyButton?: React.ReactNode;
};

export function EventList({ type, game, emptyButton, events }: EventListProps) {
  return (
    <div>
      <List
        title={type == "upcoming" ? "Anstehende Events" : "Vergangene Events"}
        items={events.map((event) => (
          <p key={event.id}>{event.name}</p>
        ))}
        emptyText={emptyButton ? undefined : "Es gab noch keine..."}
        emptyContent={events.length == 0 && emptyButton}
      />
    </div>
  );
}
