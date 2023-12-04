import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { useEffect, useState } from "react";
import { Game } from "../models/Game";

export function GamePage() {
  const { game_id } = usePathParams(SiteRoutes.Game);
  const [game, setGame] = useState<Game | undefined>(undefined);

  useEffect(() => {
    console.log(game_id);
    fetch(`/api/game/get?id=${game_id}`).then((res) => {
      if (res.status == 200) {
        res.json().then((game) => {
          console.log(game);
          const g = new Game(game["id"], game["name"], game["players"]);
          setGame(g);
        });
      }
    });
  }, [game_id]);
  return <>{game?.name}</>;
}
