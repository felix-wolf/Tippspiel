import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { useEffect, useState } from "react";
import { Event } from "../models/Event";
import { NavPage } from "./NavPage";
import { Prediction } from "../models/Bet";
import { Game } from "../models/Game";
import { useCurrentUser } from "../models/user/UserContext";
import { URLResultUploader } from "../components/domain/URLResultUploader";
import { ManualResultUploader } from "../components/domain/ManualResultUploader";
import { BetList } from "../components/domain/lists/BetList";
import { ResultsList } from "../components/domain/lists/ResultsList";
import useFetch from "../useFetch";
import Loader from "../components/design/Loader";
import { useCache } from "../contexts/CacheContext.tsx";
import { EventScore } from "../models/EventScore.ts";

export function ViewBetsPage() {
  const { event_id, game_id } = usePathParams(SiteRoutes.ViewBets);
  const [resultsUploaded, setResultsUploaded] = useState(false);
  const user = useCurrentUser();
  const { deleteCache } = useCache();
  const gameFetchValues = useFetch<Game>({
    key: Game.buildCacheKey(game_id),
    func: Game.fetchOne,
    args: [game_id],
  });

  const eventFetchValues = useFetch<Event>({
    key: Event.buildCacheKey(event_id),
    func: Event.fetchOne,
    args: [event_id],
  });

  const { data: game } = gameFetchValues;

  const {
    data: event,
    refetch: refetchEvent,
    loading: eventLoading,
  } = eventFetchValues;
  let isCreator = false;

  if (game) {
    isCreator = game.creator?.id == user?.id;
  }

  useEffect(() => {
    const predictionsWithResults: Prediction[] =
      event?.bets
        .map((bet) => bet.predictions)
        .reduce((acc, curr) => acc.concat(curr), [])
        .filter((pred) => pred.actual_place != undefined) ?? [];
    setResultsUploaded(predictionsWithResults.length > 0);
  }, [event]);

  function onEventUpdated() {
    refetchEvent(true);
    deleteCache(Game.buildCacheKey(game_id));
    deleteCache(EventScore.buildCacheKey(game_id));
  }

  return (
    <>
      {eventLoading && <Loader />}
      {!eventLoading && (
        <NavPage title={<span className="text-sky-800">{event?.name}</span>}>
          {isCreator && game?.discipline?.resultMode === "legacy_url" && game?.discipline?.resultUrl && (
            <URLResultUploader
              resultUrl={game.discipline.resultUrl}
              resultsUploaded={resultsUploaded}
              event={event}
              onEventUpdated={onEventUpdated}
            />
          )}
          {isCreator && game?.discipline?.resultMode === "official_api" && (
            <p className="mb-3 text-sm text-gray-500">
              Ergebnisse werden fuer offizielle Biathlon-Events automatisch
              geladen. Die manuelle Eingabe bleibt als Fallback verfuegbar.
            </p>
          )}
          {isCreator && game?.discipline?.resultMode !== "legacy_url" && (
            <ManualResultUploader
              resultsUploaded={resultsUploaded}
              event={event}
              onEventUpdated={onEventUpdated}
            />
          )}
          {event && event.results.length != 0 && <ResultsList event={event} />}
          {game && event && (
            <BetList
              game={game}
              event={event}
              isCreator={isCreator}
              onEventUpdated={onEventUpdated}
            />
          )}
        </NavPage>
      )}
    </>
  );
}
