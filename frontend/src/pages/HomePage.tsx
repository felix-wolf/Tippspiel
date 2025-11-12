import { BettingGameList } from "../components/domain/lists/BettingGameList";
import { useCurrentUser, useLogout } from "../models/user/UserContext";
import { Button } from "../components/design/Button";
import { useCallback } from "react";
import { SiteRoutes, useNavigateParams } from "../../SiteRoutes";
import { GamesContext } from "../contexts/GameContext";
import { Game } from "../models/Game";
import useFetch from "../useFetch";
import { useCache } from "../contexts/CacheContext";
import { AnimatePresence, motion } from "motion/react";

export function HomePage() {
  const logout = useLogout();
  const navigate = useNavigateParams();
  const user = useCurrentUser();

  const { setCache } = useCache();

  const { loading, data } = useFetch<Game[]>({
    func: Game.fetchAll,
    args: [],
    key: "games",
  });

  if (data) {
    data.forEach((game: Game) =>
      setCache(Game.buildCacheKey(game.id), game, 2 * 60),
    );
  }

  const logoutClick = useCallback(() => {
    logout().then();
    navigate(SiteRoutes.Login, {});
  }, []);
  console.log(data?.filter((game) => game.players.some((p) => p.id == user?.id)))
  return (
    <>
      {/* Header */}
      <header className="flex justify-between items-center w-full max-w-5xl mb-10">
        <h1 className="text-2xl font-semibold text-gray-800">
          Hallo <span className="text-sky-700">{user?.name}</span>!
        </h1>
        <div className="w-50">
          <Button title="Logout" onClick={logoutClick} type="negative" />
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!loading ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <GamesContext.Provider value={data}>
              <BettingGameList user={user} show_games={"user"} />
              <BettingGameList user={user} show_games={"other"} />
            </GamesContext.Provider>
          </motion.div>
        ) : (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <EventsSkeleton />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


function EventsSkeleton() {
  return (
    <div className="w-full max-w-6xl backdrop-blur-md bg-white/30 border border-white/40 rounded-3xl shadow-lg p-6 animate-pulse">
      <div className="h-5 w-52 bg-slate-200/70 rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex justify-between items-center bg-white/70 rounded-2xl px-4 py-3"
          >
            <div className="space-y-1">
              <div className="h-4 w-52 bg-slate-200/80 rounded" />
              <div className="h-3 w-32 bg-slate-200/70 rounded" />
            </div>
            <div className="h-8 w-24 bg-slate-200/80 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}