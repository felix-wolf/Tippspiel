import { useEffect } from "react";
import { Game } from "../../models/Game";
import { Event } from "../../models/Event";

type EventListProps = {
  type: "upcoming" | "past";
  game?: Game;
};

export function EventList({ type, game }: EventListProps) {
  useEffect(() => {
    if (game?.id)
      Event.fetchAll(game.id).then((events) => {
        console.log(events);
      });
  }, [type, game]);

  return <></>;
}
