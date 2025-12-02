import { useCallback, useState } from "react";
import { Game } from "../../models/Game";
import { Toggler, TogglerItem } from "../design/Toggler";
import { EventScore } from "../../models/EventScore";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, TooltipContentProps } from "recharts";
import ScoreModeToggle from "./ScoreModeToggle";
import { BarChart3, TrendingUp } from "lucide-react";

type ScoreLineProps = {
  game: Game;
  eventScores: EventScore[];
};

export function ScoreLine({ game, eventScores }: ScoreLineProps) {
  let sortedEventScores: EventScore[] = eventScores.sort(
    (a, b) => a.datetime.getTime() - b.datetime.getTime(),
  );
  const startEventLabel = "Start";
  const [numEvents, setNumEvents] = useState(sortedEventScores.length);
  const [showingAllEvents, setShowingAllEvents] = useState(true);
  const [showingCumulativeScores, setShowingCumulativeScores] = useState(true);

  const buildDataset = useCallback(() => {
    type player_score_type = { name: string; scores: number[] };
    let data: any[] = [];
    let cumulativeScores: { [key: string]: number } = {};
    type dataPointType = { [key: string]: string | number, index: number };

    if (!showingCumulativeScores) {
      sortedEventScores.slice(-numEvents).forEach((event, index) => {
        let dataPoint: dataPointType = { race: event.name, index: index };
        game.players.forEach((player) => {
          dataPoint[player.name] = sortedEventScores.slice(-numEvents).map((eventScore) => {
            return (eventScore.scores.get(player.id) ?? 0);
          })[index];
        });
        data.push(dataPoint);
      });
      return data;
    }

    const player_scores: player_score_type[] = game.players.map((player) => {
      return {
        name: player.name, scores: sortedEventScores
          .map((e) => (e.scores.get(player.id) ?? 0))
          .map((_, index, all) => {
            return all
              .slice(0, index + 1)
              .reduce((acc, curr) => acc + curr, 0);
          })
          .slice(-numEvents)
      }
    });


    // Initialize cumulative scores for each player
    game.players.forEach((player) => {
      cumulativeScores[player.name] = 0;
    });

    let startDataPoint: any = { race: startEventLabel };
    if (showingAllEvents) {
      // Add starting point
      game.players.forEach((player) => {
        startDataPoint[player.name] = 0;
      });
      data.push(startDataPoint);
    }
    sortedEventScores.slice(-numEvents).forEach((event, index) => {
      let dataPoint: dataPointType = { race: event.name, index: index };
      game.players.forEach((player) => {
        dataPoint[player.name] = player_scores.find(p => p.name === player.name)?.scores[index] ?? 0;
      });
      data.push(dataPoint);
    });
    return data;
  }, [game, numEvents, showingAllEvents, sortedEventScores, showingCumulativeScores]);


  function buildTogglerTabs(numEvents: number): TogglerItem[] {
    const increments = [5, 10, 20, 10, 20];
    let tabs: TogglerItem[] = [];
    let i = 5;
    let incrementsIndex = 0;
    while (i < numEvents) {
      const newTabs: TogglerItem[] = [{ name: i.toString(), isEnabled: true }];
      tabs = newTabs.concat(tabs);

      i += increments[incrementsIndex];
      incrementsIndex += 1;
    }
    return tabs.reverse().concat({ name: "Alle", isEnabled: true });
  }


  const CustomTooltip = ({ active, payload, label }: TooltipContentProps<string | number, string>) => {
    type player_score_type = { name: string; scores: number[] };
    const player_scores: player_score_type[] = game.players.map((player) => {
      return {
        name: player.name, scores: sortedEventScores
          .map((e) => (e.scores.get(player.id) ?? 0))
          .map((_, index, all) => {
            return all
              .slice(0, index + 1)
              .reduce((acc, curr) => acc + curr, 0);
          })
          .slice(showingAllEvents ? -numEvents : -numEvents - 1)
      }
    })
    const transformed_payload = payload.map((entry) => {
      return {
        player_name: entry.name,
        color: entry.color,
        total_score: (player_scores.find(p => p.name === entry.name)?.scores[entry.payload.index + (showingAllEvents ? 0 : 1)] ?? 0),
        event_score: (player_scores.find(p => p.name === entry.name)?.scores[entry.payload.index + (showingAllEvents ? 0 : 1)] ?? 0) - (player_scores.find(p => p.name === entry.name)?.scores[entry.payload.index - (showingAllEvents ? 1 : 0)] ?? 0)
      }
    })
    const isVisible = active && payload && payload.length;
    return (
      <div className="custom-tooltip rounded-xl bg-sky-100/90 p-2" style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
        {isVisible && transformed_payload && (
          <>
            {showingCumulativeScores ? (<>
              <p className="label text-black">{label}</p>
              {transformed_payload.sort((a, b) => a.total_score >= b.total_score ? 0 : 1).map((entry, index) => (
                <p key={`item-${index}`} className="desc" style={{ color: entry.color }}>
                  {entry.player_name}: {entry.total_score} (+{entry.event_score})
                </p>
              ))}
            </>
            ) : (
              <>
                <p className="label text-black">{label}</p>
                {transformed_payload.sort((a, b) => a.event_score >= b.event_score ? 0 : 1).map((entry, index) => (
                  <p key={`item-${index}`} className="desc" style={{ color: entry.color }}>
                    {entry.player_name}: {entry.event_score}
                  </p>
                ))}
              </>
            )}
          </>
        )}
      </div>
    );
  };

  const scoreModeItems = [
    { id: "cumulative", label: "Kumuliert", Icon: TrendingUp },
    { id: "regular", label: "Einzeln", Icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={buildDataset()}>
          <XAxis
            dataKey="race"
            tickFormatter={(_, index) => `${sortedEventScores.length - (numEvents - index)}`}
            label={{ value: 'Rennen', position: 'insideBottom' }}
            height={50}
          />
          <YAxis
            domain={([dataMin, dataMax]) => showingCumulativeScores ? [showingAllEvents ? 0 : Math.max(dataMin - 50, 0), dataMax] : [dataMin, dataMax]}
            label={{ value: 'Punkte', angle: -90, position: 'insideLeft' }}
            />
          <Tooltip content={CustomTooltip} />
          <Legend />
          {game?.players.map((player) => (
            <Line
              key={player.id}
              type={"monotone"}
              dataKey={player.name}
              stroke={player.color}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center justify-center">
        <ScoreModeToggle
          initialMode={showingCumulativeScores ? scoreModeItems[0] : scoreModeItems[1]}
          onChange={() => { setShowingCumulativeScores(!showingCumulativeScores) }}
          items={scoreModeItems}
        />
      </div>
      <Toggler
        items={buildTogglerTabs(sortedEventScores.length)}
        initialIndex={buildTogglerTabs(sortedEventScores.length).length - 1}
        didSelect={(item) => {
          setNumEvents(
            item.name != undefined ? item.name == "Alle" ? sortedEventScores.length : parseInt(item.name) : 0,
          );
          setShowingAllEvents(item.name == "Alle" ? true : false);
        }}
      />
    </div>
  )
}
