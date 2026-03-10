import { Event } from "../../../models/Event.ts";
import { Utils } from "../../../utils.ts";
import { useEffect, useState } from "react";
import { Badge, BadgeCheck, ChevronDown, ChevronRight } from "lucide-react";

type SeasonGroup = {
  seasonId: string;
  label: string;
  events: Event[];
};

type EventImportListProps = {
  events: Event[];
  onSelectEventItems: (events: Event[]) => void
};

export function EventImportList({
  events,
  onSelectEventItems: _onSelectEventItems
}: EventImportListProps) {
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [collapsedSeasonIds, setCollapsedSeasonIds] = useState<string[]>([]);

  useEffect(() => {
    const seasonIds = Array.from(new Set(events.map((event) => event.seasonId ?? "unknown")));
    setSelectedEventIds([]);
    setCollapsedSeasonIds(seasonIds);
    _onSelectEventItems([]);
  }, [events, _onSelectEventItems]);

  const groupedEvents = events.reduce<SeasonGroup[]>((groups, event) => {
    const seasonId = event.seasonId ?? "unknown";
    const existingGroup = groups.find((group) => group.seasonId === seasonId);
    if (existingGroup) {
      existingGroup.events.push(event);
      return groups;
    }
    return [...groups, { seasonId, label: formatSeasonLabel(seasonId), events: [event] }];
  }, []);

  function updateSelection(nextSelectedIds: string[]) {
    setSelectedEventIds(nextSelectedIds);
    _onSelectEventItems(events.filter((event) => nextSelectedIds.includes(event.id)));
  }

  function toggleSeasonCollapse(seasonId: string) {
    const isCollapsed = collapsedSeasonIds.includes(seasonId);
    setCollapsedSeasonIds(
      isCollapsed
        ? collapsedSeasonIds.filter((id) => id !== seasonId)
        : [...collapsedSeasonIds, seasonId],
    );
  }

  function toggleEvent(eventId: string) {
    const isSelected = selectedEventIds.includes(eventId);
    updateSelection(
      isSelected
        ? selectedEventIds.filter((id) => id !== eventId)
        : [...selectedEventIds, eventId],
    );
  }

  function selectAllEvents(selected: boolean) {
    updateSelection(selected ? events.map((event) => event.id) : []);
  }

  function selectSeasonEvents(seasonEvents: Event[], selected: boolean) {
    const seasonEventIds = seasonEvents.map((event) => event.id);
    if (selected) {
      updateSelection(Array.from(new Set([...selectedEventIds, ...seasonEventIds])));
      return;
    }
    updateSelection(selectedEventIds.filter((id) => !seasonEventIds.includes(id)));
  }

  return (
    events.length != 0 && (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/8 cursor-pointer"
            onClick={() => {
              selectAllEvents(true);
            }}
            type="button"
          >
            Alle auswählen
          </button>
          <button
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/8 cursor-pointer"
            onClick={() => {
              selectAllEvents(false);
            }}
            type="button"
          >
            Alle abwählen
          </button>
        </div>
        <div className="flex flex-col max-h-100 overflow-y-auto gap-3">
          {groupedEvents.map((group) => {
            const selectedCount = group.events.filter((event) => selectedEventIds.includes(event.id)).length;
            const isCollapsed = collapsedSeasonIds.includes(group.seasonId);
            return (
              <div
                key={group.seasonId}
                className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-slate-800/55 p-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    className="flex min-w-0 items-center gap-2 text-left cursor-pointer"
                    onClick={() => toggleSeasonCollapse(group.seasonId)}
                    type="button"
                  >
                    {isCollapsed ? <ChevronRight size={18} className="text-slate-300" /> : <ChevronDown size={18} className="text-sky-200" />}
                    <div>
                      <p className="font-semibold text-white">{group.label}</p>
                      <p className="text-sm text-slate-300">
                        {selectedCount} von {group.events.length} Rennen ausgewählt
                      </p>
                    </div>
                  </button>
                  <div className="flex gap-2">
                    <button
                      className="text-sm font-semibold text-sky-200 underline underline-offset-2 cursor-pointer"
                      onClick={() => {
                        selectSeasonEvents(group.events, true);
                      }}
                      type="button"
                    >
                      Saison auswählen
                    </button>
                    <button
                      className="text-sm font-semibold text-slate-300 underline underline-offset-2 cursor-pointer"
                      onClick={() => {
                        selectSeasonEvents(group.events, false);
                      }}
                      type="button"
                    >
                      Saison abwählen
                    </button>
                  </div>
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col gap-2">
                    {group.events
                      .sort((a, b) => a.datetime.getTime() - b.datetime.getTime())
                      .map((event) => {
                        const isChecked = selectedEventIds.includes(event.id);
                        return (
                          <div
                            onClick={() => toggleEvent(event.id)}
                            key={event.id}
                            className={`
                              flex flex-row gap-4 items-center rounded-xl border p-2 shadow-sm cursor-pointer transition
                              ${isChecked ? "border-sky-400/30 bg-sky-500/15 text-sky-100" : "border-white/6 bg-white/4 text-slate-300 hover:bg-white/7"}
                            `}
                          >
                            {isChecked ? <BadgeCheck className="row-span-2" /> : <Badge className="row-span-2" />}
                            <div className="flex flex-col items-start gap-2">
                              <p className={`font-medium flex ${isChecked ? "text-white" : "text-slate-300"}`}>
                                {event.name}
                              </p>
                              <p className="text-sm text-slate-300">{Utils.dateToString(event.datetime)}</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )
  );
}

function formatSeasonLabel(seasonId: string): string {
  if (/^\d{4}$/.test(seasonId)) {
    return `Saison ${seasonId.slice(0, 2)}/${seasonId.slice(2)}`;
  }
  return "Saison unbekannt";
}
