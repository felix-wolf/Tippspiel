import { Event } from "../../../models/Event.ts";
import { Utils } from "../../../utils.ts";
import { useEffect, useMemo, useState } from "react";
import { Badge, BadgeCheck, ChevronDown, ChevronRight } from "lucide-react";

import { groupImportEvents, selectImportEvents } from "./eventImportGroups.ts";

type EventImportListProps = {
  events: Event[];
  onSelectEventItems: (events: Event[]) => void;
};

export function EventImportList({
  events,
  onSelectEventItems: _onSelectEventItems,
}: EventImportListProps) {
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [collapsedSeasonIds, setCollapsedSeasonIds] = useState<string[]>([]);
  const [expandedCompetitionKeys, setExpandedCompetitionKeys] = useState<
    string[]
  >([]);
  const groupedEvents = useMemo(() => groupImportEvents(events), [events]);

  useEffect(() => {
    const seasonIds = groupedEvents.map((group) => group.key);
    setExpandedCompetitionKeys([]);
    setSelectedEventIds([]);
    setCollapsedSeasonIds(seasonIds);
    _onSelectEventItems([]);
  }, [groupedEvents, _onSelectEventItems]);

  function updateSelection(nextSelectedIds: string[]) {
    setSelectedEventIds(nextSelectedIds);
    _onSelectEventItems(
      events.filter((event) => nextSelectedIds.includes(event.id)),
    );
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
    updateSelection(
      selectImportEvents(selectedEventIds, seasonEvents, selected),
    );
  }

  function toggleCompetition(key: string) {
    setExpandedCompetitionKeys((current) =>
      current.includes(key)
        ? current.filter((value) => value !== key)
        : [...current, key],
    );
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
            const selectedCount = group.events.filter((event) =>
              selectedEventIds.includes(event.id),
            ).length;
            const isCollapsed = collapsedSeasonIds.includes(group.key);
            return (
              <div
                key={group.key}
                className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-slate-800/55 p-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    className="flex min-w-0 items-center gap-2 text-left cursor-pointer"
                    aria-expanded={!isCollapsed}
                    onClick={() => toggleSeasonCollapse(group.key)}
                    type="button"
                  >
                    {isCollapsed ? (
                      <ChevronRight size={18} className="text-slate-300" />
                    ) : (
                      <ChevronDown size={18} className="text-sky-200" />
                    )}
                    <div>
                      <p className="font-semibold text-white">{group.label}</p>
                      <p className="text-sm text-slate-300">
                        {selectedCount} von {group.events.length} Rennen
                        ausgewählt
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
                    {group.competitions.map((competition) => (
                      <div
                        key={competition.key}
                        className="flex flex-col gap-3 rounded-xl border border-white/8 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <button
                            type="button"
                            aria-expanded={expandedCompetitionKeys.includes(
                              competition.key,
                            )}
                            onClick={() => toggleCompetition(competition.key)}
                            className="flex items-center gap-2 text-left cursor-pointer"
                          >
                            {expandedCompetitionKeys.includes(
                              competition.key,
                            ) ? (
                              <ChevronDown size={18} />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                            <span>
                              <span className="block font-semibold text-white">
                                {competition.label}
                              </span>
                              <span className="block text-sm text-slate-300">
                                {
                                  competition.events.filter((event) =>
                                    selectedEventIds.includes(event.id),
                                  ).length
                                }{" "}
                                von {competition.events.length} Rennen
                                ausgewählt
                              </span>
                            </span>
                          </button>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                selectSeasonEvents(competition.events, true)
                              }
                              className="text-sm font-semibold text-sky-200 underline cursor-pointer"
                            >
                              Wettbewerb auswählen
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                selectSeasonEvents(competition.events, false)
                              }
                              className="text-sm font-semibold text-slate-300 underline cursor-pointer"
                            >
                              Wettbewerb abwählen
                            </button>
                          </div>
                        </div>
                        {expandedCompetitionKeys.includes(competition.key) &&
                          competition.events.map((event) => {
                            const isChecked = selectedEventIds.includes(
                              event.id,
                            );
                            return (
                              <button
                                type="button"
                                aria-pressed={isChecked}
                                onClick={() => toggleEvent(event.id)}
                                key={event.id}
                                className={`
                              flex flex-row gap-4 items-center rounded-xl border p-2 shadow-sm cursor-pointer text-left transition
                              ${
                                isChecked
                                  ? "border-sky-400/30 bg-sky-500/15 text-sky-100"
                                  : "border-white/6 bg-white/4 text-slate-300 hover:bg-white/7"
                              }
                            `}
                              >
                                {isChecked ? (
                                  <BadgeCheck className="row-span-2" />
                                ) : (
                                  <Badge className="row-span-2" />
                                )}
                                <span className="flex flex-col items-start gap-2">
                                  <span
                                    className={`font-medium flex ${
                                      isChecked
                                        ? "text-white"
                                        : "text-slate-300"
                                    }`}
                                  >
                                    {event.name}
                                  </span>
                                  <span className="text-sm text-slate-300">
                                    {Utils.dateToString(event.datetime)}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    ))}
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
