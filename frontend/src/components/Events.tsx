import { EventList } from "./lists/EventList";
import { Game } from "../models/Game";

type EventProps = {
  game?: Game;
};

export function Events({ game }: EventProps) {
  return (
    <>
      <div>Events lol</div>
      <div>
        <EventList type={"upcoming"} game={game} />
      </div>
    </>
  );
}
