import { Badge, BadgeCheck, Settings } from "lucide-react"
import { Event } from "../../../models/Event"
import { useCurrentUser } from "../../../contexts/UserContext"
import { Utils } from "../../../utils"

type EventListItemProps = {
    event: Event
    onViewEventClicked: () => void
    onEditEventClicked?: () => void
    isUpcoming: boolean
    canEditEvents?: boolean
}

export function EventListItem({
    event,
    isUpcoming,
    onViewEventClicked: _onViewEventClicked,
    onEditEventClicked: _onEditEventClicked,
    canEditEvents = false,
}: EventListItemProps) {
    const user = useCurrentUser()

    function eventHasBetsForUser(event: Event): boolean {
        return event.hasBetsForUsers()
            .find((user_id) => user_id == user?.id) != undefined
    }
    return (
        <div
            key={event.name}
            className={`
                flex flex-col gap-3 bg-white/70 rounded-xl p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between
                ${isUpcoming && !eventHasBetsForUser(event) && "border border-sky-400"}
                `}
                onClick={() => {
                    // prevent click when screen is larger than md
                    if (window.innerWidth < 768) _onViewEventClicked()
                }}
        >
            <div className="flex min-w-0 items-center gap-2">
                {isUpcoming && (eventHasBetsForUser(event) ? <BadgeCheck /> : <Badge />)}
                <div className="flex min-w-0 flex-col gap-2">
                    <p className={`
                        font-medium break-words
                        ${isUpcoming && eventHasBetsForUser(event) && "text-gray-400"}
                        `}>
                        {event.name}
                        </p>
                    <p className={"text-sm text-gray-600"}>{Utils.dateToString(event.datetime)}</p>
                </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                {isUpcoming && canEditEvents && _onEditEventClicked && (
                <button
                    className="flex items-center justify-center rounded-lg border border-sky-300 bg-white px-2 py-2 text-sky-700 hover:bg-sky-50 md:hidden"
                    aria-label="Event bearbeiten"
                    onClick={(e) => { e.stopPropagation(); _onEditEventClicked(); }}
                >
                    <Settings size={18} />
                </button>
                )}
                {isUpcoming && canEditEvents && _onEditEventClicked && (
                <button className="hidden bg-white text-sky-700 px-2 md:px-4 py-1 rounded-lg border border-sky-300 hover:bg-sky-50 md:block" onClick={(e) => { e.stopPropagation(); _onEditEventClicked(); }}>
                    bearbeiten
                </button>
                )}
                <button className="hidden bg-sky-500 text-white px-2 md:px-4 py-1 rounded-lg hover:bg-sky-600 md:block" onClick={(e) => { e.stopPropagation(); _onViewEventClicked(); }}>
                    ansehen
                </button>
            </div>
        </div>
    )
}
