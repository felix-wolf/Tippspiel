// import {
//   CategoryScale,
//   Chart as ChartJS,
//   Legend,
//   LinearScale,
//   LineElement,
//   PointElement,
//   Title,
//   Tooltip,
// } from "chart.js";
// import { Line } from "react-chartjs-2";
import { useCallback, useState } from "react";
import { Game } from "../../models/Game";
import styles from "./ScoreLine.module.scss";
import { Toggler, TogglerItem } from "../design/Toggler";
import { EventScore } from "../../models/EventScore";
import Loader from "../design/Loader";
import { useAppearance } from "../../contexts/AppearanceContext.tsx";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";


// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
// );

type ScoreLineProps = {
  game: Game;
  scores: EventScore[];
};

export function ScoreLine({ game, scores }: ScoreLineProps) {
  let sortedEvents: EventScore[] = [];
  const startEventLabel = "Start";
  const [numEvents, setNumEvents] = useState(sortedEvents.length);

  const buildLabels = useCallback((): string[] => {
    return [startEventLabel]
      .concat(sortedEvents.map((e) => e.name) ?? [])
      .slice(-numEvents);
  }, [sortedEvents, numEvents]);

  const { isLight } = useAppearance();

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
      tabs = [{ name: i.toString() }].concat(tabs);

      i += increments[incrementsIndex];
      incrementsIndex += 1;
    }
    console.log(tabs);
    return tabs.reverse().concat({ name: "Alle" });
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
            item.name == "Alle" ? sortedEvents.length : parseInt(item.name),
          );
        }}
      />
    </div>
  )

  const buildDatasets = useCallback((): {
    label: string;
    color: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[] => {
    return (
      game?.players.map((player) => {
        return {
          label: player.name,
          color: "#FF0000",
          data: [0]
            .concat(
              sortedEvents
                .map((e) => e.scores.get(player.id) ?? 0)
                .map((_, index, all) => {
                  return all
                    .slice(0, index + 1)
                    .reduce((acc, curr) => acc + curr, 0);
                }),
            )
            .slice(-numEvents),

          borderColor: player.color,
          backgroundColor: player.color + "80",
        };
      }) ?? []
    );
  }, [game, sortedEvents, numEvents]);

  if (scores) {
    sortedEvents = scores.sort(
      (a, b) => a.datetime.getTime() - b.datetime.getTime(),
    );

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          ticks: {
            color: isLight() ? "#666666" : "#dbdbdb",
          },
          grid: {
            color: isLight() ? "#66666650" : "#dbdbdb50",
          },
        },
        x: {
          ticks: {
            color: isLight() ? "#666666" : "#dbdbdb",
          },
          grid: {
            color: isLight() ? "#66666650" : "#dbdbdb50",
          },
        },
      },
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            color: isLight() ? "#666666" : "#dbdbdb",
          },
        },
        title: {
          display: true,
          text: "Punktestand",
          color: isLight() ? "#666666" : "#dbdbdb",
        },
        tooltip: {
          callbacks: {
            title: function (tooltipItem: any) {
              return tooltipItem[0].label;
            },
            label: function (tooltipItem: any) {
              const player = tooltipItem.dataset.label;
              const scores = tooltipItem.dataset.data;
              const latestScore = scores[tooltipItem.dataIndex];
              const prevScore =
                tooltipItem.dataIndex > 0
                  ? scores[tooltipItem.dataIndex - 1]
                  : 0;

              if (tooltipItem.label == startEventLabel) {
                return `${player}: ${latestScore}`;
              }

              return `${player}: ${prevScore} + ${latestScore - prevScore
                } = ${latestScore}`;
            },
          },
        },
      },
    };


    return (
      <div className={styles.container}>
        <Line
          className={styles.canvas}
          data={{ labels: buildLabels(), datasets: buildDatasets() }}
          options={options}
        />
        <div className={styles.center}>
          <Toggler
            items={buildTogglerTabs(sortedEvents.length)}
            height={"small"}
            initialIndex={buildTogglerTabs(sortedEvents.length).length - 1}
            didSelect={(item) => {
              setNumEvents(
                item.name == "Alle" ? sortedEvents.length : parseInt(item.name),
              );
            }}
          />
        </div>
      </div>
    );
  }
  return <Loader />;
}
