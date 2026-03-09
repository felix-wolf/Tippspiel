import type { ReactNode } from "react";
import {
  Flag,
  Crosshair,
  Flame,
  MapPinned,
  Medal,
  Mountain,
  Route,
  Trophy,
  UserRound,
} from "lucide-react";
import type { GameStatsDetail, GameStatsPayload } from "../../models/GameStats";
import { DropDown, type DropDownOption } from "../design/DropDown";

type GameStatsPanelProps = {
  stats?: GameStatsPayload;
  playerOptions: DropDownOption[];
  selectedPlayerId: string;
  onSelectedPlayerChange: (playerId: string) => void;
  loading?: boolean;
};

const raceFormatLabels: Record<string, string> = {
  relay: "Staffel",
  "mixed relay": "Mixed-Staffel",
  "single mixed relay": "Single-Mixed-Staffel",
  sprint: "Sprint",
  pursuit: "Verfolgung",
  individual: "Einzel",
  "short individual": "Kurzes Einzel",
  "mass start": "Massenstart",
  "super sprint": "Super Sprint",
};

function formatNumber(value?: number | null, digits: number = 1) {
  if (value === undefined || value === null) {
    return "-";
  }
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(digits);
}

function formatRaceFormat(value?: string | null) {
  if (!value) {
    return value;
  }
  return raceFormatLabels[value] ?? value;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/60 border border-white/60 p-4 shadow-sm">
      <div className="flex items-center justify-between text-slate-600 mb-3">
        <span className="text-sm font-semibold">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-semibold text-slate-900">{value}</div>
      <div className="text-sm text-slate-600 mt-2">{subtitle}</div>
    </div>
  );
}

function DetailCard({
  title,
  detail,
  emptyText,
  accent,
  icon,
  formatName,
  averagePointsLabel = "Schnitt pro Tipp",
}: {
  title: string;
  detail: GameStatsDetail | null;
  emptyText: string;
  accent: string;
  icon: ReactNode;
  formatName?: (value: string) => string | null | undefined;
  averagePointsLabel?: string;
}) {
  return (
    <div className="rounded-2xl bg-white/60 border border-white/60 p-4 shadow-sm h-full">
      <div className="flex items-center gap-2 text-slate-700 mb-3 font-semibold">
        <span className={accent}>{icon}</span>
        <span>{title}</span>
      </div>
      {!detail ? (
        <p className="text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          <div className="text-xl font-semibold text-slate-900">
            {formatName ? formatName(detail.name) : detail.name}
          </div>
          {"points" in detail && detail.points !== undefined && (
            <div className="text-sm text-slate-600">Punkte: {formatNumber(detail.points, 2)}</div>
          )}
          {detail.delta !== undefined && (
            <div className="text-sm text-slate-600">
              Vorsprung gg. Durchschnitt: {formatNumber(detail.delta, 2)}
            </div>
          )}
          {detail.opponent_average_points !== undefined && (
            <div className="text-sm text-slate-600">
              Gegner-Durchschnitt: {formatNumber(detail.opponent_average_points, 2)}
            </div>
          )}
          {detail.pick_count !== undefined && (
            <div className="text-sm text-slate-600">Tipps: {detail.pick_count}</div>
          )}
          {detail.average_points !== undefined && (
            <div className="text-sm text-slate-600">
              {averagePointsLabel}: {formatNumber(detail.average_points, 2)}
            </div>
          )}
          {detail.location && (
            <div className="text-sm text-slate-600">Ort: {detail.location}</div>
          )}
          {detail.race_format && (
            <div className="text-sm text-slate-600">Format: {formatRaceFormat(detail.race_format)}</div>
          )}
        </div>
      )}
    </div>
  );
}

export function GameStatsPanel({
  stats,
  playerOptions,
  selectedPlayerId,
  onSelectedPlayerChange,
  loading = false,
}: GameStatsPanelProps) {
  if (loading || !stats) {
    return (
      <section className="w-full max-w-6xl backdrop-blur-md bg-white/40 border border-white/40 rounded-3xl shadow-lg p-6 my-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Trophy size={18} />
            <span>Wettstatistiken</span>
          </div>
          <DropDown
            options={playerOptions}
            selectedId={selectedPlayerId}
            onChange={(option) => option && onSelectedPlayerChange(option.id)}
          />
        </div>
        <p className="text-slate-600">Statistiken werden geladen...</p>
      </section>
    );
  }

  if (stats.overview.resolved_predictions === 0) {
    return (
      <section className="w-full max-w-6xl backdrop-blur-md bg-white/40 border border-white/40 rounded-3xl shadow-lg p-6 my-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Trophy size={18} />
            <span>Wettstatistiken</span>
          </div>
          <DropDown
            options={playerOptions}
            selectedId={selectedPlayerId}
            onChange={(option) => option && onSelectedPlayerChange(option.id)}
          />
        </div>
        <p className="text-slate-600">
          Noch keine ausgewerteten Tipps vorhanden.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-6xl backdrop-blur-md bg-white/40 border border-white/40 rounded-3xl shadow-lg p-6 my-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
        <div className="flex items-center gap-2 text-slate-800 font-semibold">
          <Trophy size={18} />
          <span>Wettstatistiken</span>
        </div>
        <DropDown
          options={playerOptions}
          selectedId={selectedPlayerId}
          onChange={(option) => option && onSelectedPlayerChange(option.id)}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-5">
        <StatCard
          title="Gesamtpunkte"
          value={formatNumber(stats.overview.total_points, 0)}
          subtitle={`${stats.overview.resolved_events} ausgewertete Rennen`}
          icon={<Medal size={18} />}
        />
        <StatCard
          title="Exakte Treffer"
          value={`${formatNumber(stats.overview.exact_hit_rate)}%`}
          subtitle={`${stats.overview.exact_hits} von ${stats.overview.resolved_predictions} Tipps`}
          icon={<Crosshair size={18} />}
        />
        <StatCard
          title="Tipp mit Punkten"
          value={`${formatNumber(stats.overview.scoring_pick_rate)}%`}
          subtitle={`${stats.overview.scoring_picks} Tipps mit Punkten`}
          icon={<Flame size={18} />}
        />
        <StatCard
          title="Punkte pro Rennen"
          value={formatNumber(stats.overview.average_points_per_event, 2)}
          subtitle="durchschnittlich"
          icon={<Route size={18} />}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 mb-5">
        <DetailCard
          title="Bester Ort"
          detail={stats.locations.best_total_points}
          emptyText="Kein Ort mit ausgewerteten Tipps vorhanden."
          accent="text-sky-700"
          icon={<MapPinned size={18} />}
          averagePointsLabel="Schnitt pro Rennen"
        />
        <DetailCard
          title="Bester Ort vs. Gegner"
          detail={stats.locations.best_vs_opponents}
          emptyText="Noch kein Vergleich mit Gegnern moeglich."
          accent="text-emerald-700"
          icon={<Mountain size={18} />}
          averagePointsLabel="Schnitt pro Rennen"
        />
        <DetailCard
          title="Schwierigster Ort"
          detail={stats.locations.worst_total_points}
          emptyText="Kein Ort mit ausgewerteten Tipps vorhanden."
          accent="text-rose-700"
          icon={<MapPinned size={18} />}
          averagePointsLabel="Schnitt pro Rennen"
        />
        <DetailCard
          title="Schwierigster Ort vs. Gegner"
          detail={stats.locations.worst_vs_opponents}
          emptyText="Noch kein Vergleich mit Gegnern moeglich."
          accent="text-slate-700"
          icon={<Mountain size={18} />}
          averagePointsLabel="Schnitt pro Rennen"
        />
        <DetailCard
          title="Haefigster Athlet"
          detail={stats.athletes.most_picked}
          emptyText="Noch keine Athleten-Tipps vorhanden."
          accent="text-amber-700"
          icon={<UserRound size={18} />}
        />
        <DetailCard
          title="Athlet mit den meisten Punkten"
          detail={stats.athletes.most_points}
          emptyText="Noch keine Athleten-Punkte vorhanden."
          accent="text-rose-700"
          icon={<Trophy size={18} />}
        />
        <DetailCard
          title="Haefig getippt, wenig Ertrag"
          detail={stats.athletes.low_return_frequent}
          emptyText="Noch keine ausreichenden Daten vorhanden."
          accent="text-violet-700"
          icon={<Flame size={18} />}
        />
        <DetailCard
          title="Land mit den meisten Punkten"
          detail={stats.countries.most_points}
          emptyText="Noch keine Laender-Tipps vorhanden."
          accent="text-indigo-700"
          icon={<Flag size={18} />}
        />
        <DetailCard
          title="Haefig getipptes Land, wenig Ertrag"
          detail={stats.countries.low_return_frequent}
          emptyText="Noch keine ausreichenden Laender-Daten vorhanden."
          accent="text-fuchsia-700"
          icon={<Flag size={18} />}
        />
        <DetailCard
          title="Bestes Format"
          detail={stats.race_formats.best_total_points}
          emptyText="Noch kein Format mit Punkten vorhanden."
          accent="text-cyan-700"
          icon={<Route size={18} />}
          formatName={formatRaceFormat}
        />
        <DetailCard
          title="Schwierigstes Format"
          detail={stats.race_formats.worst_total_points}
          emptyText="Noch kein Format mit ausgewerteten Tipps vorhanden."
          accent="text-slate-700"
          icon={<Route size={18} />}
          formatName={formatRaceFormat}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <DetailCard
          title="Bestes Rennen"
          detail={stats.events.best_event}
          emptyText="Noch keine ausgewerteten Rennen vorhanden."
          accent="text-emerald-700"
          icon={<Medal size={18} />}
        />
        <DetailCard
          title="Schwierigstes Rennen"
          detail={stats.events.worst_event}
          emptyText="Noch keine ausgewerteten Rennen vorhanden."
          accent="text-rose-700"
          icon={<Mountain size={18} />}
        />
      </div>
    </section>
  );
}
