import { SiteRoutes, useNavigateParams, usePathParams } from "../../SiteRoutes";
import { useCallback, useEffect, useState } from "react";
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
import settings_white from "../assets/icons/settings_white.svg";
import settings_black from "../assets/icons/settings_black.svg";
import { useAppearance } from "../contexts/AppearanceContext.tsx";
import { SettingsModal } from "../components/domain/SettingsModal.tsx";
import { useCache } from "../contexts/CacheContext.tsx";
import { Trophy, Table as TableIcon, Settings } from "lucide-react";
import { motion } from "motion/react";


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
            icon={isLight() ? <Settings size={18} color="black"/> : <Settings size={18} />}
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
      {gameLoading && <Loader />}
      {!gameLoading && user && game && scores && (

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

      )}
      {game && (
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
      )}
    </NavPage>
  </>
  );
}
