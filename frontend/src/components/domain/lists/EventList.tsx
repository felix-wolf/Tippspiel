import { useCallback, useEffect, useState } from "react";
import { Event } from "../../../models/Event";
import useFetch from "../../../useFetch";
import { EventEditorModal } from "../EventEditorModal";
import { Game } from "../../../models/Game";
import { Toggler, TogglerItem } from "../../design/Toggler";
import { Calendar, Medal, Plus } from "lucide-react";
import { SiteRoutes, useNavigateParams } from "../../../../SiteRoutes.ts";

import { EventListItem } from "./EventListItem.tsx";

export type EventTimeType = "upcoming" | "past";

type EventListProps = {
  type: EventTimeType;
  game: Game;
  placeholderText?: string;
  isCreator?: boolean;
  refreshToken?: number;
  onEventsChanged?: () => void;
};

export function EventList({
  type,
  game,
  placeholderText,
  isCreator = false,
  refreshToken = 0,
  onEventsChanged,
}: EventListProps) {
  const [showingAddEventModal, setShowingAddEventModal] = useState(false);
  const [currPage, setCurrPage] = useState(1);
  const navigate = useNavigateParams();

  useEffect(() => {
    refetch();
    if (game) {
      refetchNumEvents();
    }
  }, [currPage, game]);

  useEffect(() => {
    refetch(true);
    if (game) {
      refetchNumEvents(true);
    }
  }, [refreshToken]);

  const numEventsFetchValues = useFetch<number>({
    key: `eventlistlength${type}${game.id}`,
    func: Game.fetchNumEvents,
    args: [game.id, type == "past" ? 1 : 0],
    initialEnabled: false,
  });

  const eventsFetchValues = useFetch<Event[]>({
    key: Event.buildListCacheKey(game.id, currPage.toString(), type),
    func: Event.fetchAll,
    args: [game.id, currPage, type == "past"],
    initialEnabled: false,
  });

  const { data: events, refetch, loading } = eventsFetchValues;
  const { data: numEvents, refetch: refetchNumEvents } = numEventsFetchValues;

  function refreshEvents() {
    onEventsChanged?.();
    refetchNumEvents(true);
    if (currPage != 1) {
      setCurrPage(1);
      return;
    }
    refetch(true);
  }

  if (type == "upcoming")
    events?.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

  function getPageItems(currPage: number): TogglerItem[] {
    let items: TogglerItem[] = [];
    items = items.concat([
      { name: "Alle", isEnabled: true },
      { name: "<", isEnabled: currPage > 1},
      { name: currPage == 0 ? "Alle" : currPage.toString() },
      { name: ">", isEnabled: currPage * 5 < (numEvents ?? 0) },
    ]);
    return items
  }

  const handleEventClick = useCallback(
    (event_id: string, page_num: string) => {
      if (type == "past") {
        navigate(SiteRoutes.ViewBets, { game_id: game.id, event_id });
      } else {
        navigate(SiteRoutes.PlaceBet, { game_id: game.id, event_id, page_num });
      }
    },
    [game],
  );

  return (
    <div className="mb-3">
      {isCreator && (
        <EventEditorModal
          isOpen={showingAddEventModal}
          game={game}
          onEventsImported={refreshEvents}
          onClose={() => setShowingAddEventModal(false)}
        />
      )}
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        {type == "upcoming" ? (
          <>
            <Calendar size={20} />
            Anstehende Events
            {isCreator && game.discipline.eventImportMode === "official_api" && (
              <button className="border border-sky-400 bg-white/70 rounded-xl p-1 shadow-sm cursor-pointer" onClick={() => setShowingAddEventModal(true)}>
                <Plus />
              </button>
            )}
          </>
        ) : <><Medal size={20} /> Vergangene Events</>}
      </h2>
      {events && events.length == 0 && (<div className="text-gray-600 italic">{placeholderText}</div>)}
      {events && events.length != 0 && (
        <>
          <div className="space-y-2">
            {events.map((e) => (
              <EventListItem
              key={e.id}
              event={e}
              isUpcoming={type == "upcoming"}
              onViewEventClicked={() => handleEventClick(e.id, currPage.toString())}
              />
            ))}
          </div>
          {!loading && (numEvents ?? 0) > 5 && (
            <div className="flex flex-row items-center">
              <Toggler
                highlight={false}
                items={getPageItems(currPage)}
                initialIndex={1}
                didSelect={(item) => {
                  switch (item.name) {
                    case "Alle":
                      setCurrPage(0);
                      break;
                    case "<":
                      setCurrPage(currPage - 1);
                      break;
                    case ">":
                      setCurrPage(currPage + 1);
                      break;
                    default:
                      break;
                  }
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
