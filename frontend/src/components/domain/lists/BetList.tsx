import { Bet } from "../../../models/Bet";
import { Event } from "../../../models/Event";
import { useEffect, useState } from "react";
import TableList, { type TableColumn } from "../../design/TableList";
import { Game } from "../../../models/Game";
import { motion } from "motion/react";
import { User } from "../../../models/User";
import { MissingBetEditorModal } from "../MissingBetEditorModal";
import { canCreatorAddMissingBet } from "../missingBetUtils";

type BetItemProp = {
  player: User;
  bet: Bet | undefined;
  canAddMissingBet: boolean;
  onAddMissingBet: () => void;
};

type BetResultItem = {
  id: string;
  tipp: string;
  result: string;
  score: number | undefined;
};

const betResultColumns: TableColumn<BetResultItem>[] = [
  {
    id: "tipp",
    header: "Tipp",
    accessor: (item) => item.tipp,
  },
  {
    id: "result",
    header: "Ergebnis",
    accessor: (item) => item.result,
  },
  {
    id: "score",
    header: "Punkte",
    align: "right",
    accessor: (item) => item.score ?? "",
  },
];

function formatPredictionResult(actualPlace: number | null | undefined, actualStatus: string | undefined): string {
  if (actualStatus) {
    return actualStatus;
  }
  if (actualPlace == null) {
    return "";
  }
  if (actualPlace === 9999) {
    return "n. klass.";
  }
  return actualPlace.toString();
}

function BetItem({ player, bet, canAddMissingBet, onAddMissingBet }: BetItemProp) {
  const [resultItems, setResultItems] = useState<BetResultItem[]>([]);

  useEffect(() => {
    setResultItems(
      bet?.predictions.map((pred) => {
        return {
          id: pred.id ?? `${pred.predicted_place}-${pred.object_id}`,
          tipp: `${pred.predicted_place ?? -1}: ${pred.object_name ?? "unknown"
            }`,
          result: formatPredictionResult(pred.actual_place, pred.actual_status),
          score: pred.score,
        };
      }) ?? [],
    );
  }, [bet]);

  return (
    <motion.div
      key={player.id}
      className="rounded-2xl bg-white/70 border border-slate-200 shadow-sm p-3 sm:p-4 flex flex-col"
      whileHover={{ y: -2 }}
    >
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 break-words">
            {player.name}
          </h3>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {canAddMissingBet && (
            <button
              className="rounded-lg bg-sky-500 px-3 py-1 text-sm font-semibold text-white hover:bg-sky-600"
              onClick={onAddMissingBet}
            >
              Tipp nachtragen
            </button>
          )}
          {bet?.hasPredictions() && bet.hasResults() && (
            <div className="text-lg font-semibold text-sky-700">
              Score:{" "}
              <span className="text-slate-900 tabular-nums">
                {bet?.score ?? 0}
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
      </div>

      {resultItems.length > 0 && (
        <TableList
          items={resultItems}
          columns={betResultColumns.map((column) => {
            if (column.id === "result") {
              return { ...column, header: bet?.hasResults() ? "Ergebnis" : "" };
            }
            if (column.id === "score") {
              return { ...column, header: bet?.hasResults() ? "Punkte" : "" };
            }
            return column;
          })}
          getRowKey={(item) => item.id}
        />
      )}
    </motion.div>
  );
}

type BetItem = {
  player: User;
  bet?: Bet;
};

type BetListProps = {
  game: Game;
  event: Event;
  canManageMissingBet: boolean;
  onEventUpdated: () => void;
};

export function BetList({ game, event, canManageMissingBet, onEventUpdated }: BetListProps) {
  const [items, setItems] = useState<BetItem[]>();
  const [selectedPlayer, setSelectedPlayer] = useState<User>();

  useEffect(() => {
    const betsOfPlayers: BetItem[] =
      game?.players.map((player) => {
        const playerBet = event.bets.find((bet) => bet.user_id == player.id);
        return {
          player: player,
          bet: playerBet,
        };
      }) ?? [];
    setItems(
      betsOfPlayers.sort((a, b) => {
        if (a.bet && !b.bet) return -1; // one bet is not defined
        if (!a.bet && b.bet) return 1; // one bet is not defined
        if (!a.bet && !b.bet) return a.player.name.localeCompare(b.player.name); // both bets not defined
        if (
          (a.bet?.score == undefined && b.bet?.score == undefined) ||
          a.bet?.score == b.bet?.score
        )
          // bets defined but not evaluated
          return a.player.name.localeCompare(b.player.name);
        return (b.bet?.score ?? 0) - (a.bet?.score ?? 0);
      }),
    );
  }, [event, game]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="backdrop-blur-md bg-white/40 border border-white/40 rounded-3xl shadow-lg w-full max-w-6xl p-4 sm:p-6 mb-8"
    >
      <MissingBetEditorModal
        event={event}
        player={selectedPlayer}
        isOpen={selectedPlayer != undefined}
        onClose={() => setSelectedPlayer(undefined)}
        onBetSaved={onEventUpdated}
      />
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Tipps</h2>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {items?.map((bet) => (
          <BetItem
            key={bet.player.id}
            player={bet.player}
            bet={bet.bet}
            canAddMissingBet={canCreatorAddMissingBet(canManageMissingBet, event, bet.bet)}
            onAddMissingBet={() => setSelectedPlayer(bet.player)}
          />
        )) ?? []
        }
      </div>
    </motion.section>
  );
}
