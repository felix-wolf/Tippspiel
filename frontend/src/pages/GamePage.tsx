import { SiteRoutes, useNavigateParams, usePathParams } from "../../SiteRoutes";
import { useEffect, useState } from "react";
import { Game } from "../models/Game";
import { EventList } from "../components/domain/lists/EventList";
import { useCurrentUser } from "../models/user/UserContext";
import { NavPage } from "./NavPage";
import { ScoreLine } from "../components/domain/ScoreLine";
import { Toggler } from "../components/design/Toggler";
import { ScoreList } from "../components/domain/lists/ScoreList";
import useFetch from "../useFetch";
import Loader from "../components/design/Loader";
import { EventScore } from "../models/EventScore";
import { Button } from "../components/design/Button.tsx";
import { useAppearance } from "../contexts/AppearanceContext.tsx";
import { SettingsModal } from "../components/domain/SettingsModal.tsx";
import { useCache } from "../contexts/CacheContext.tsx";
import { Trophy, Table as TableIcon, Settings } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";


export function GamePage() {
  const { game_id } = usePathParams(SiteRoutes.Game);
  const navigate = useNavigateParams();
  const [isCreator, setIsCreator] = useState(false);
  const user = useCurrentUser();
  const { isLight } = useAppearance();
  const cache = useCache();
  const [showingSettingsModal, setShowingSettingsModal] = useState(false);
  const [settingsKey, setSettingsKey] = useState(0);

  const gameFetchValues = useFetch<Game>({
    key: Game.buildCacheKey(game_id),
    func: Game.fetchOne,
    args: [game_id],
  });

  const scoreFetchValues = useFetch<EventScore[]>({
    key: EventScore.buildCacheKey(game_id),
    func: EventScore.fetchAll,
    args: [game_id],
  });

  const {
    data: game,
    refetch: refetchGame,
    loading: gameLoading,
  } = gameFetchValues;

  const { data: scores } = scoreFetchValues;

  useEffect(() => {
    if (!user) {
      navigate(SiteRoutes.Login, {});
    }
    setIsCreator(game?.creator?.id == user?.id);
  }, [user, game]);

  return (<>
    <NavPage
      title={game?.name}
      navBarLeftItem={
        <div style={{ width: 50 }}>
          <Button
            icon={isLight() ? <Settings size={18} color="black" /> : <Settings size={18} />}
            title={""}
            type={"clear"}
            onClick={() => setShowingSettingsModal(true)}
          />
        </div>
      }
    >
      {game && (
        <SettingsModal
          key={settingsKey}
          isCreator={isCreator}
          isOpen={showingSettingsModal}
          onClose={() => {
            setShowingSettingsModal(false);
            setSettingsKey(settingsKey + 1);
          }}
          onGameUpdated={() => {
            setShowingSettingsModal(false);
            setSettingsKey(settingsKey + 1);
            refetchGame(true);
          }}
          game={game}
          onGameDeleted={() => {
            cache.clearCache();
            navigate(SiteRoutes.Home, {});
          }}
        />
      )}
      <AnimatePresence mode="wait">
        {(!gameLoading && user && game && scores) ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <Toggler
              items={[
                {
                  nameComponent: <><Trophy size={18} /> Graph </>,
                  component:
                    <ScoreLine game={game} scores={scores} />,
                  isEnabled: true,
                },
                {
                  nameComponent: <><TableIcon size={18} /> Tabelle</>,
                  component: <ScoreList game={game} scores={scores} />,
                  isEnabled: true,
                },
              ]}
            />
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-6xl backdrop-blur-md bg-white/40 border border-white/40 rounded-3xl shadow-lg p-6 flex flex-col"
            >
              <EventList
                game={game}
                type={"upcoming"}
                placeholderText={"Es sind noch keine Events eingetragen..."}
                isCreator={isCreator}
              />
              <EventList
                game={game}
                type={"past"}
                placeholderText={"Es hat noch kein Event stattgefunden..."}
              />
            </motion.section>
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
            <ScoreboardSkeleton />
            <EventsSkeleton />
          </motion.div>
        )}
      </AnimatePresence>
    </NavPage>
  </>
  );
}

function ScoreboardSkeleton() {
  return (
    <div className="w-full max-w-6xl backdrop-blur-md bg-white/30 border border-white/40 rounded-3xl shadow-lg p-6 animate-pulse my-4">
      {/* header line */}
      <div className="h-5 w-40 bg-slate-300/70 rounded mb-4" />
      {/* fake chart area */}
      <div className="h-48 w-full bg-slate-300/60 rounded-xl mb-4" />
      {/* fake legend / controls */}
      <div className="flex gap-3">
        <div className="h-6 w-24 bg-slate-300/70 rounded-full" />
        <div className="h-6 w-20 bg-slate-300/70 rounded-full" />
        <div className="h-6 w-32 bg-slate-300/70 rounded-full" />
      </div>
    </div>
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