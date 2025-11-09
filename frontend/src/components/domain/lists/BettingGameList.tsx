import { useCallback, useContext, useEffect, useState } from "react";
import { BettingGameItem, BettingGameItemGame } from "./BettingGameItem";
import { SiteRoutes, useNavigateParams } from "../../../../SiteRoutes";
import { User } from "../../../models/user/User";
import { Game } from "../../../models/Game";
import { GamesContext } from "../../../contexts/GameContext.ts";
import { motion } from "motion/react";

type BettingGamesProps = {
  user?: User;
  show_games: "user" | "other";
};

export function BettingGameList({
  user = undefined,
  show_games,
}: BettingGamesProps) {
  const [games, setGames] = useState<BettingGameItemGame[]>([]);
  const allGames = useContext(GamesContext);
  const useNavigate = useNavigateParams();

  useEffect(() => {
    if (user) {
      const convertedGames: BettingGameItemGame[] | undefined = allGames?.map(
        (game) => {
          return { game: game, type: "real" };
        },
      );
      let filteredGames = convertedGames?.filter((game) => {
        return (
          (show_games == "user" &&
            game?.game?.players.find((player) => player.id == user.id)) ||
          (show_games == "other" &&
            !game?.game?.players.find((player) => player.id == user.id))
        );
      });
      const add_item: BettingGameItemGame = {
        type: "add",
      };

      if (filteredGames) {
        if (show_games == "user")
          filteredGames = [add_item].concat(filteredGames);
        setGames(filteredGames);
      }
    }
  }, [user, allGames]);

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
    (game_id: string, password?: string): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        let pw = "";
        if (password) pw = `&pw=${password}`;
        if (user?.id)
          Game.join(user.id, game_id, pw)
            .then((game) => {
              useNavigate(SiteRoutes.Game, { game_id: game.id });
              resolve(true);
            })
            .catch((error) => {
              if (error.text == "Passwort falsch") {
                resolve(false);
              } else {
                reject();
              }
            });
      });
    },
    [user],
  );

  return (
    games.length != 0 && (
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-md bg-white/40 border border-white/40 rounded-3xl shadow-lg w-full max-w-5xl p-6 mb-8"
      >
        <div className="text-xl font-semibold text-gray-800 mb-4">{show_games == "user" ? "Deine Tippspiele" : "Andere Tippspiele"}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {games.length != 0 && games
            .sort((a, b) =>
              !!a.game?.name && !!b.game?.name
                ? a.game?.name > b.game?.name
                  ? 1
                  : -1
                : 0,
            )
            .map((item, index) => (
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
        </div>
      </motion.section>
    )
  );
}
