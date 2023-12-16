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

const colors: number[][] = [
  [255, 99, 71], // - Tomato
  [144, 238, 144], // - LightGreen
  [255, 192, 203], // - Pink
  [255, 228, 196], // - Bisque
  [255, 165, 0], // - Orange
  [255, 105, 180], // - HotPink
  [0, 128, 128], // - Teal
  [255, 20, 147], // - DeepPink
  [0, 191, 255], // - DeepSkyBlue
  [255, 215, 0], // - Gold
  [139, 69, 19], // - SaddleBrown
  [152, 251, 152], // - PaleGreen
  [218, 112, 214], // - Orchid
  [255, 0, 255], // - Magenta
  [0, 255, 127], // - SpringGreen
  [70, 130, 180], // - SteelBlue
  [255, 69, 0], // - Red-Orange
  [0, 255, 0], // - LimeGreen
  [0, 0, 128], // - Navy;
  [255, 165, 0], // - DarkOrange;
  [128, 0, 128], // - Purple;
  [0, 255, 255], // - Aqua;
  [255, 69, 0], // - Tomato - Red;
  [70, 130, 90], // - OliveDrab;
  [255, 140, 0], // - DarkOrange;
  [0, 128, 0], // - Green;
  [255, 99, 71], // - Tomato;
  [128, 128, 128], // - Gray;
];

export function ScoreLine({ game, events }: ScoreLineProps) {
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
    return events.map((e) => e.name) ?? [];
  }, [events]);

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
          data: events
            .map((e) => e.bets.find((b) => b.user_id == player.id)?.score ?? 0)
            .map((_, index, all) => {
              return all
                .slice(0, index + 1)
                .reduce((acc, curr) => acc + curr, 0);
            }),
          borderColor: `rgb(${
            colors[Number(`0x${player.id}`) % colors.length]
          })`,
          backgroundColor: `rgb(${
            colors[Number(`0x${player.id}`) % colors.length]
          }, 0.5)`,
        };
      }) ?? []
    );
  }, [game, events]);

  return (
    <Line
      data={{ labels: buildLabels(), datasets: buildDatasets() }}
      options={options}
    />
  );
}
