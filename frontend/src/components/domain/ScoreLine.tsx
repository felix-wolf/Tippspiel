import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useCallback, useState } from "react";
import { Game } from "../../models/Game";
import styles from "./ScoreLine.module.scss";
import { Toggler, TogglerItem } from "../design/Toggler";
import { EventScore } from "../../models/EventScore";
import Loader from "../design/Loader";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

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

  const buildDatasets = useCallback((): {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[] => {
    return (
      game?.players.map((player) => {
        return {
          label: player.name,
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
      plugins: {
        legend: {
          position: "top" as const,
        },
        title: {
          display: true,
          text: "Punktestand",
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

              return `${player}: ${prevScore} + ${
                latestScore - prevScore
              } = ${latestScore}`;
            },
          },
        },
      },
    };

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
      return tabs.reverse().concat({ name: "Alle" });
    }

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
