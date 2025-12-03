import { Bet } from "../../../models/Bet";
import { Event } from "../../../models/Event";
import { useEffect, useState } from "react";
import TableList from "../../design/TableList";
import { Game } from "../../../models/Game";
import { motion } from "motion/react";

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
          tipp: `${pred.predicted_place ?? -1}: ${pred.object_name ?? "unknown"
            }`,
          result: pred.actual_place,
          score: pred.score,
        };
      }) ?? [],
    );
  }, [bet]);

  return (
    <motion.div
      key={playerName}
      className="rounded-2xl bg-white/70 border border-slate-200 shadow-sm p-3 sm:p-4 flex flex-col"
      whileHover={{ y: -2 }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900">
          {playerName}
        </h3>
        {bet?.hasPredictions() && bet.hasResults() && (
          <div className="text-lg font-semibold text-sky-700">
            Score:{" "}
            <span className="text-slate-900 tabular-nums">
              LEL{bet?.score ?? 0}
            </span>
          </div>
        )}
        {bet?.hasPredictions() && !bet.hasResults() && (
          <div className="text-lg font-semibold text-slate-500 italic">
            Ergebnis ausstehend
          </div>
        )}
        {!bet && (
          <div className="text-lg font-semibold text-slate-500 italic">
            Nicht getippt
          </div>
        )}
      </div>

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
    </motion.div>
  );
}

type BetItem = {
  playerName: string;
  bet?: Bet;
};

type BetListProps = {
  game: Game;
  event: Event;
};

export function BetList({ game, event }: BetListProps) {
  const [items, setItems] = useState<BetItem[]>();

  useEffect(() => {
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
        if (
          (a.bet?.score == undefined && b.bet?.score == undefined) ||
          a.bet?.score == b.bet?.score
        )
          // bets defined but not evaluated
          return a.playerName.localeCompare(b.playerName);
        return (b.bet?.score ?? 0) - (a.bet?.score ?? 0);
      }),
    );
  }, [event]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="backdrop-blur-md bg-white/40 border border-white/40 rounded-3xl shadow-lg w-full max-w-6xl p-6 mb-8"
    >
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Tipps</h2>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {items?.map((bet, index) => (
          <BetItem
            key={`${bet}_${index}`}
            playerName={bet.playerName}
            bet={bet.bet}
          />
        )) ?? []
        }
      </div>
    </motion.section>
  );
}
