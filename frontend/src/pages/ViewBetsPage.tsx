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

export function ViewBetsPage() {
  const { event_id, game_id } = usePathParams(SiteRoutes.ViewBets);
  const [resultsUploaded, setResultsUploaded] = useState(false);
  const user = useCurrentUser();

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

  return (
    <>
      {eventLoading && <Loader />}
      {!eventLoading && (
        <NavPage title={"Tipps von Event: " + event?.name}>
          {isCreator && game?.discipline?.resultUrl && (
            <URLResultUploader
              resultUrl={game.discipline.resultUrl}
              resultsUploaded={resultsUploaded}
              event={event}
              onEventUpdated={() => refetchEvent(true)}
            />
          )}
          {isCreator && !game?.discipline?.resultUrl && (
            <ManualResultUploader
              resultsUploaded={resultsUploaded}
              event={event}
              onEventUpdated={() => refetchEvent(true)}
            />
          )}
          {event && event.results.length != 0 && <ResultsList event={event} />}
          {game && event && <BetList game={game} event={event} />}
        </NavPage>
      )}
    </>
  );
}
