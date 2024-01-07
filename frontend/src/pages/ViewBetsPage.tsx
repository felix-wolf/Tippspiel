import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { useCallback, useEffect, useState } from "react";
import { Event } from "../models/Event";
import { NavPage } from "./NavPage";
import { List } from "../components/design/List";
import styles from "./ViewBetsPage.module.scss";
import { Bet, Prediction } from "../models/Bet";
import { Game } from "../models/Game";
import TableList from "../components/design/TableList";
import { useCurrentUser } from "../models/user/UserContext";
import { URLResultUploader } from "../components/domain/URLResultUploader";
import { ManualResultUploader } from "../components/domain/ManualResultUploader";

type BetItemProp = {
  playerName: string;
  bet: Bet | undefined;
};

type BetResultItem = {
  tipp: string;
  result: number | undefined;
  score: number | undefined;
};

function BetItem({ playerName, bet }: BetItemProp) {
  const [resultItems, setResultItems] = useState<BetResultItem[]>([]);

  useEffect(() => {
    setResultItems(
      bet?.predictions.map((pred) => {
        return {
          tipp: `${pred.predicted_place ?? -1}: ${
            pred.object_name ?? "unknown"
          }`,
          result: pred.actual_place,
          score: pred.score,
        };
      }) ?? [],
    );
  }, [bet]);

  function getScoreText(bet: Bet | undefined) {
    if (!bet) {
      return "nicht getippt";
    }
    if (bet?.hasPredictions() && !bet.hasResults()) {
      return "Ergebnis ausstehend";
    }
    return `Score: ${bet.score}`;
  }

  return (
    <div className={styles.container}>
      <div className={styles.name}>{playerName}</div>
      {resultItems.length > 0 && (
        <TableList
          cellHeight={"short"}
          items={resultItems}
          headers={{
            tipp: "Tipp",
            result: bet?.hasResults() ? "Ergebnis" : "",
            score: bet?.hasResults() ? "Punkte" : "",
          }}
          customRenderers={{}}
          displayNextArrow={false}
        />
      )}
      <div className={styles.score}>{getScoreText(bet)}</div>
    </div>
  );
}

type BetItem = {
  playerName: string;
  bet?: Bet;
};

export function ViewBetsPage() {
  const [event, setEvent] = useState<Event | undefined>(undefined);
  const [game, setGame] = useState<Game>();
  const { event_id, game_id } = usePathParams(SiteRoutes.ViewBets);
  const [items, setItems] = useState<BetItem[]>();
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

  const processEvent = useCallback((event: Event, game: Game | undefined) => {
    setEvent(event);
    const betsOfPlayers: BetItem[] =
      game?.players.map((player) => {
        const playerBet = event.bets.find((bet) => bet.user_id == player.id);
        return {
          playerName: player.name,
          bet: playerBet,
        };
      }) ?? [];
    setItems(
      betsOfPlayers.sort((a, b) => {
        if (a.bet && !b.bet) return -1; // one bet is not defined
        if (!a.bet && b.bet) return 1; // one bet is not defined
        if (!a.bet && !b.bet) return a.playerName.localeCompare(b.playerName); // both bets not defined
        if (a.bet?.score == undefined && b.bet?.score == undefined)
          // bets defined but not evaluated
          return a.playerName.localeCompare(b.playerName);
        return (b.bet?.score ?? 0) - (a.bet?.score ?? 0);
      }),
    );
  }, []);

  useEffect(() => {
    Game.fetchOne(game_id)
      .then((game) => {
        setGame(game);
        setIsCreator(game.creator?.id == user?.id);
        Event.fetchOne(event_id)
          .then((event) => {
            processEvent(event, game);
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
          onEventUpdated={(e) => processEvent(e, game)}
        />
      )}
      {isCreator && !game?.discipline?.resultUrl && (
        <ManualResultUploader
          resultsUploaded={resultsUploaded}
          event={event}
          onEventUpdated={(e) => processEvent(e, game)}
        />
      )}
      <List
        title={"Tipps"}
        displayBorder={false}
        items={
          items?.map((bet, index) => (
            <BetItem
              key={`${bet}_${index}`}
              playerName={bet.playerName}
              bet={bet.bet}
            />
          )) ?? []
        }
        max_height={6000}
      />
    </NavPage>
  );
}
