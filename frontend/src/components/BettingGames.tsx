import styles from "./BettingGames.module.scss";
import { useCallback, useEffect, useState } from "react";
import { BettingGameItem, BettingGameItemGame } from "./BettingGameItem";
import { SiteRoutes, useNavigateParams } from "../../SiteRoutes";
import { User } from "../models/user/User";
import { Game } from "../models/Game";

type BettingGamesProps = {
  user?: User;
  show_games: "user" | "other";
};

export function BettingGames({
  user = undefined,
  show_games,
}: BettingGamesProps) {
  const [games, setGames] = useState<BettingGameItemGame[]>([]);

  const useNavigate = useNavigateParams();

  useEffect(() => {
    if (user) {
      fetch("/api/game/get").then((res) =>
        res.json().then((data) => {
          const fetched_games: BettingGameItemGame[] = data.map((game: any) => {
            return {
              game: new Game(
                game["id"],
                game["name"],
                game["players"],
                game["creator"],
                game["pw_set"],
              ),
              type: "real",
            };
          });
          const user_games = fetched_games.filter((game) => {
            return game.game.players.find((player) => player.id == user.id);
          });
          const other_games = fetched_games.filter((game) => {
            return !user_games.find(
              (user_game) => user_game.game.id == game.game.id,
            );
          });
          const add_item: BettingGameItemGame = {
            game: new Game("add", "Neu", []),
            type: "add",
          };

          let total_items = show_games == "user" ? user_games : other_games;
          if (show_games == "user")
            total_items = [add_item].concat(total_items);
          setGames(total_items);
        }),
      );
    }
  }, [user]);

  const onCreate = useCallback((name: string, password?: string) => {
    console.log("create");
    let pw = "";
    if (password) pw = `&pw=${password}`;
    fetch(`/api/game/create?name=${name}${pw}`).then((res) => {
      if (res.status == 200) {
        res.json().then((game) => {
          useNavigate(SiteRoutes.Game, { game_id: game["id"] });
        });
      } else {
        res.text().then((text) => {
          console.log(text);
        });
      }
    });
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.heading}>
        {show_games == "user" ? "Deine Tippspiele" : "Andere Tippspiele"}
      </div>
      <div className={styles.list}>
        {games.map((item) => (
          <BettingGameItem
            key={item.game.id}
            item={item}
            joined={show_games == "user"}
            onGameSelect={(id) => {
              useNavigate(SiteRoutes.Game, { game_id: id });
            }}
            onCreate={onCreate}
            type={item.type}
          />
        ))}
      </div>
    </div>
  );
}
