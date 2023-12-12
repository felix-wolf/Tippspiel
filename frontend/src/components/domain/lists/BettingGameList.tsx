import { useCallback, useEffect, useState } from "react";
import { BettingGameItem, BettingGameItemGame } from "./BettingGameItem";
import { SiteRoutes, useNavigateParams } from "../../../../SiteRoutes";
import { User } from "../../../models/user/User";
import { Game } from "../../../models/Game";
import { List } from "../../design/List";

type BettingGamesProps = {
  user?: User;
  show_games: "user" | "other";
};

export function BettingGameList({
  user = undefined,
  show_games,
}: BettingGamesProps) {
  const [games, setGames] = useState<BettingGameItemGame[]>([]);

  const useNavigate = useNavigateParams();

  useEffect(() => {
    if (user) {
      Game.fetchAll()
        .then((games) => {
          const converted_games: BettingGameItemGame[] = games.map((game) => {
            return { game: game, type: "real" };
          });
          const user_games = converted_games.filter((game) => {
            return game?.game?.players.find((player) => player.id == user.id);
          });
          const other_games = converted_games.filter((game) => {
            return !user_games.find(
              (user_game) => user_game?.game?.id == game?.game?.id,
            );
          });
          const add_item: BettingGameItemGame = {
            type: "add",
          };

          let total_items = show_games == "user" ? user_games : other_games;
          if (show_games == "user")
            total_items = [add_item].concat(total_items);
          setGames(total_items);
        })
        .catch((error) => console.log("ERROR IN PROMISE", error));
    }
  }, [user]);

  const onCreate = useCallback(
    (name: string, password?: string, discipline?: string) => {
      if (discipline)
        Game.create(name, discipline, password)
          .then((game) => {
            useNavigate(SiteRoutes.Game, { game_id: game.id });
          })
          .catch((error) => {
            console.log(error);
          });
    },
    [],
  );

  const onJoin = useCallback(
    (game_id: string, password?: string) => {
      let pw = "";
      if (password) pw = `&pw=${password}`;
      if (user?.id)
        Game.join(user.id, game_id, pw)
          .then((game) => {
            useNavigate(SiteRoutes.Game, { game_id: game.id });
          })
          .catch((error) => {
            console.log(error);
          });
    },
    [user],
  );

  return (
    <List
      title={show_games == "user" ? "Deine Tippspiele" : "Andere Tippspiele"}
      items={games.map((item, index) => (
        <BettingGameItem
          key={`${index}${item.game?.id}`}
          item={item}
          joined={show_games == "user"}
          onGameSelect={(id) => {
            useNavigate(SiteRoutes.Game, { game_id: id });
          }}
          onCreate={onCreate}
          onJoin={onJoin}
          type={item.type}
        />
      ))}
      emptyText={"Ganz schön leer hier :("}
    />
  );
}
