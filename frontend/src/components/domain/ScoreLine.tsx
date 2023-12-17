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
import { useCallback } from "react";
import { Event } from "../../models/Event";
import { Game } from "../../models/Game";

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
  game?: Game;
  events: Event[];
};

export function ScoreLine({ game, events }: ScoreLineProps) {
  const sortedEvents = events.sort(
    (a, b) => a.datetime.getTime() - b.datetime.getTime(),
  );

  const options = {
    responsive: true,
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
            // Customize the title text (e.g., add 'Custom Title: ')
            return "Eventname: " + tooltipItem[0].label;
          },
          label: function (tooltipItem: any) {
            const scores = tooltipItem.dataset.data;
            const latestScore = scores[tooltipItem.dataIndex];
            const prevScore =
              tooltipItem.dataIndex > 0 ? scores[tooltipItem.dataIndex - 1] : 0;
            // Customize the label text (e.g., add 'Value: ')
            return `${prevScore} + ${latestScore - prevScore} = ${latestScore}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const buildLabels = useCallback((): string[] => {
    return sortedEvents.filter((e) => e.hasResults()).map((e) => e.name) ?? [];
  }, [sortedEvents]);

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
          data: sortedEvents
            .filter((e) => e.hasResults())
            .map((e) => e.bets.find((b) => b.user_id == player.id)?.score ?? 0)
            .map((_, index, all) => {
              return all
                .slice(0, index + 1)
                .reduce((acc, curr) => acc + curr, 0);
            }),
          borderColor: player.color,
          backgroundColor: player.color + "80",
        };
      }) ?? []
    );
  }, [game, sortedEvents]);

  return (
    <Line
      data={{ labels: buildLabels(), datasets: buildDatasets() }}
      options={options}
    />
  );
}
