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

export function ViewBetsPage() {
  const [event, setEvent] = useState<Event | undefined>(undefined);
  const [game, setGame] = useState<Game>();
  const { event_id, game_id } = usePathParams(SiteRoutes.ViewBets);

  const [isCreator, setIsCreator] = useState(false);
  const [resultsUploaded, setResultsUploaded] = useState(false);
  const user = useCurrentUser();

  useEffect(() => {
    const predictionsWithResults: Prediction[] =
      event?.bets
        .map((bet) => bet.predictions)
        .reduce((acc, curr) => acc.concat(curr))
        .filter((pred) => pred.actual_place != undefined) ?? [];
    setResultsUploaded(predictionsWithResults.length > 0);
  }, [event]);

  useEffect(() => {
    Game.fetchOne(game_id)
      .then((game) => {
        setGame(game);
        setIsCreator(game.creator?.id == user?.id);
        Event.fetchOne(event_id)
          .then((event) => {
            setEvent(event);
          })
          .catch((error) => {
            console.log("error fetching event", error);
          });
      })
      .catch((error) => console.log(error));
  }, [event_id, game_id]);

  return (
    <NavPage title={"Tipps von Event: " + event?.name}>
      {isCreator && game?.discipline?.resultUrl && (
        <URLResultUploader
          resultUrl={game.discipline.resultUrl}
          resultsUploaded={resultsUploaded}
          event={event}
          onEventUpdated={(e) => setEvent(e)}
        />
      )}
      {isCreator && !game?.discipline?.resultUrl && (
        <ManualResultUploader
          resultsUploaded={resultsUploaded}
          event={event}
          onEventUpdated={(e) => setEvent(e)}
        />
      )}
      {event && event.results.length != 0 && <ResultsList event={event} />}
      {game && event && <BetList game={game} event={event} />}
    </NavPage>
  );
}
