import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { useEffect, useState } from "react";
import { Game } from "../models/Game";
import styles from "./GamePage.module.scss";
import { Events } from "../components/Events";

export function GamePage() {
  const { game_id } = usePathParams(SiteRoutes.Game);
  const [game, setGame] = useState<Game | undefined>(undefined);

  useEffect(() => {
    console.log(game_id);
    fetch(`/api/game/get?id=${game_id}`).then((res) => {
      if (res.status == 200) {
        res.json().then((game) => {
          setGame(
            new Game(
              game["id"],
              game["name"],
              game["players"],
              game["creator"],
            ),
          );
        });
      }
    });
  }, [game_id]);
  return (
    <>
      <div className={styles.headline}>{game?.name}</div>
      <Events game={game} />
    </>
  );
}
