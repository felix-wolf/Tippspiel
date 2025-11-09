import { useCallback, useState } from "react";
import { Game } from "../../models/Game";
import { Toggler, TogglerItem } from "../design/Toggler";
import { EventScore } from "../../models/EventScore";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

type ScoreLineProps = {
  game: Game;
  scores: EventScore[];
};

export function ScoreLine({ game, scores }: ScoreLineProps) {
  let sortedEvents: EventScore[] = [];
  const startEventLabel = "Start";
  const [numEvents, setNumEvents] = useState(sortedEvents.length);

  const buildDataset = useCallback(() => {
    let data: any[] = [];
    let cumulativeScores: { [key: string]: number } = {};

    // Initialize cumulative scores for each player
    game.players.forEach((player) => {
      cumulativeScores[player.name] = 0;
    });

    // Add starting point
    let startDataPoint: any = { race: startEventLabel };
    game.players.forEach((player) => {
      startDataPoint[player.name] = 0;
    });
    data.push(startDataPoint);
    sortedEvents = scores.sort(
      (a, b) => a.datetime.getTime() - b.datetime.getTime(),
    );
    // Build data points for each event
    sortedEvents.slice(-numEvents).forEach((event) => {
      let dataPoint: any = { race: event.name };
      game.players.forEach((player) => {
        const score = event.scores.get(player.id) ?? 0;
        cumulativeScores[player.name] += score;
        dataPoint[player.name] = cumulativeScores[player.name];
      });
      data.push(dataPoint);
    });

    return data;
  }, [game, scores, numEvents])


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

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={buildDataset()}>
          <XAxis />
          <YAxis />
          <Tooltip />
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
      <Toggler
        items={buildTogglerTabs(sortedEvents.length)}
        initialIndex={buildTogglerTabs(sortedEvents.length).length - 1}
        didSelect={(item) => {
          setNumEvents(
            item.name != undefined ? item.name == "Alle" ? sortedEvents.length : parseInt(item.name) : 0,
          );
        }}
      />
    </div>
  )
}
