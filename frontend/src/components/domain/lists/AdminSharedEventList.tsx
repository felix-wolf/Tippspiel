import { useMemo, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AdminSharedEventDiagnostic } from "../../../models/Admin";
import { groupAdminSharedEvents } from "../../../models/raceGroups";

type AdminSharedEventListProps = {
  events: AdminSharedEventDiagnostic[];
  expandedGroups: ReadonlySet<string>;
  onToggleGroup: (key: string) => void;
  selectedSharedEventId: string | null;
  onSelect: (id: string) => void;
};

export function AdminSharedEventList({
  events,
  expandedGroups,
  onToggleGroup,
  selectedSharedEventId,
  onSelect,
}: AdminSharedEventListProps) {
  const seasons = useMemo(() => groupAdminSharedEvents(events), [events]);
  return (
    <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1 sm:max-h-96 lg:max-h-[70vh]">
      {events.length === 0 && (
        <p className="text-sm text-slate-600">
          Keine Shared Events für den aktuellen Filter.
        </p>
      )}
      {seasons.map((season) => (
        <RaceGroup
          key={season.key}
          label={season.label}
          count={season.events.length}
          expanded={expandedGroups.has(season.key)}
          onToggle={() => onToggleGroup(season.key)}
        >
          {season.competitions.map((competition) => (
            <RaceGroup
              key={competition.key}
              label={competition.label}
              count={competition.events.length}
              expanded={expandedGroups.has(competition.key)}
              onToggle={() => onToggleGroup(competition.key)}
            >
              {competition.events.map((item) => (
                <button
                  type="button"
                  key={item.sharedEventId}
                  aria-pressed={item.sharedEventId === selectedSharedEventId}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    item.sharedEventId === selectedSharedEventId
                      ? "border-sky-500 bg-sky-50"
                      : "border-slate-200 bg-white hover:border-sky-300"
                  }`}
                  onClick={() => onSelect(item.sharedEventId)}
                >
                  <span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <span className="min-w-0">
                      <span className="block font-semibold text-slate-900">
                        {item.name}
                      </span>
                      <span className="block text-sm text-slate-600">
                        {item.location ?? "Ohne Ort"} · {item.datetime}
                      </span>
                    </span>
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-xs text-white">
                      {item.linkedEventCount} Spiele
                    </span>
                  </span>
                  <span className="mt-3 flex flex-wrap gap-2 text-xs">
                    <FlagChip
                      label={`${item.withResultsCount}/${item.linkedEventCount} mit Ergebnissen`}
                      type={item.flags.missingResults ? "warn" : "ok"}
                    />
                    {item.flags.hasMultipleLinkedGames && (
                      <FlagChip label="Mehrfach verknüpft" type="neutral" />
                    )}
                    {item.flags.missingSourceMapping && (
                      <FlagChip label="Source fehlt" type="warn" />
                    )}
                  </span>
                </button>
              ))}
            </RaceGroup>
          ))}
        </RaceGroup>
      ))}
    </div>
  );
}

function RaceGroup({
  label,
  count,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex w-full items-center gap-2 text-left text-slate-900"
      >
        {expanded ? (
          <ChevronDown size={18} className="shrink-0" />
        ) : (
          <ChevronRight size={18} className="shrink-0" />
        )}
        <span className="min-w-0 flex-1 font-semibold">{label}</span>
        <span className="shrink-0 text-xs text-slate-600">{count} Rennen</span>
      </button>
      {expanded && <div className="space-y-3">{children}</div>}
    </div>
  );
}

function FlagChip({
  label,
  type,
}: {
  label: string;
  type: "ok" | "warn" | "neutral";
}) {
  const className =
    type === "ok"
      ? "bg-emerald-100 text-emerald-800"
      : type === "warn"
        ? "bg-amber-100 text-amber-900"
        : "bg-slate-200 text-slate-700";
  return <span className={`rounded-full px-2 py-1 ${className}`}>{label}</span>;
}
