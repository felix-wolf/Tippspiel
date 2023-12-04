import { useEffect } from "react";
import { Game } from "../../models/Game";

type EventListProps = {
  type: "upcoming" | "past";
  game?: Game;
};

export function EventList({ type, game }: EventListProps) {
  useEffect(() => {
    fetch(`/api/event/get?game_id=${game?.id}`).then((res) => {
      console.log(res);
    });
  }, [type, game]);

  return <></>;
}
