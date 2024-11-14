import { SiteRoutes, useNavigateParams, usePathParams } from "../../SiteRoutes";
import { useCallback, useEffect, useState } from "react";
import { Game } from "../models/Game";
import { EventList } from "../components/domain/lists/EventList";
import { useCurrentUser } from "../models/user/UserContext";
import { NavPage } from "./NavPage";
import styles from "./GamePage.module.scss";
import { ScoreLine } from "../components/domain/ScoreLine";
import { ColorUpdater } from "../components/domain/ColorUpdater";
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

  const showUserBets = useCallback(
    (event_id: string, page_num: string) => {
      navigate(SiteRoutes.PlaceBet, { game_id, event_id, page_num });
    },
    [game_id],
  );

  const showAllBets = useCallback(
    (event_id: string) => {
      navigate(SiteRoutes.ViewBets, { game_id, event_id });
    },
    [game_id],
  );

  return (
    <NavPage
      title={game?.name}
      navBarLeftItem={
        isCreator && (
          <div style={{ width: 50 }}>
            <Button
              icon={isLight() ? settings_white : settings_black}
              title={""}
              type={"neutral"}
              onClick={() => setShowingSettingsModal(true)}
              width={"flexible"}
            />
          </div>
        )
      }
    >
      {game && (
        <SettingsModal
          key={settingsKey}
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
      {!gameLoading && (
        <>
          <div className={styles.punkte}>
            {user && game && scores && (
              <>
                <Toggler
                  items={[
                    {
                      name: "Graph",
                      component: (
                        <>
                          <ColorUpdater
                            user={user}
                            onUpdated={() => {
                              refetchGame(true);
                            }}
                          />
                          <ScoreLine game={game} scores={scores} />
                        </>
                      ),
                    },
                    {
                      name: "Tabelle",
                      component: <ScoreList game={game} scores={scores} />,
                    },
                  ]}
                />
              </>
            )}
          </div>
        </>
      )}
      {game && (
        <>
          <div className={styles.listContainer}>
            <EventList
              game={game}
              type={"upcoming"}
              placeholderWhenEmpty={
                <div className={styles.empty_text}>
                  Es sind noch keine Events eingetragen...
                </div>
              }
              showUserBets={showUserBets}
              isCreator={isCreator}
            />
          </div>
          <div className={styles.listContainer}>
            <EventList
              game={game}
              type={"past"}
              placeholderWhenEmpty={
                <div className={styles.empty_text}>
                  Es hat noch kein Event stattgefunden...
                </div>
              }
              showAllBets={showAllBets}
            />
          </div>
        </>
      )}
    </NavPage>
  );
}
