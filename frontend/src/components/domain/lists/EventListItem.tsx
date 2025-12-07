import { Badge, BadgeCheck, Pencil } from "lucide-react"
import { Event } from "../../../models/Event"
import { useCurrentUser } from "../../../models/user/UserContext"
import { Utils } from "../../../utils"

type EventListItemProps = {
    event: Event
    onViewEventClicked: () => void
    onEditEventClicked: () => void
    isUpcoming: boolean
    isCreator?: boolean
}

export function EventListItem({
    event,
    isUpcoming,
    onViewEventClicked: _onViewEventClicked,
    onEditEventClicked: _onEditEventClicked,
    isCreator = false,
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
                flex justify-between gap-2 items-center bg-white/70 rounded-xl p-4 shadow-sm
                ${isUpcoming && !eventHasBetsForUser(event) && "border border-sky-400"}
                `}
                onClick={() => {
                    // prevent click when screen is larger than md
                    if (window.innerWidth < 768) _onViewEventClicked()
                }}
        >
            <div className="flex items-center gap-2">
                {isUpcoming && (eventHasBetsForUser(event) ? <BadgeCheck /> : <Badge />)}
                <div className="flex flex-col gap-2">
                    <p className={`
                        font-medium
                        ${isUpcoming && eventHasBetsForUser(event) && "text-gray-400"}
                        `}>
                        {event.name}
                        </p>
                    <p className={"text-sm text-gray-600"}>{Utils.dateToString(event.datetime)}</p>
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2">
                {isUpcoming && isCreator && (
                <>
                    <Pencil size={20} color="black" className="md:hidden" onClick={(e) => { e.stopPropagation(); _onEditEventClicked(); }} />
                    <button className="hidden md:block bg-sky-500 text-white px-2 md:px-4 py-1 rounded-lg hover:bg-sky-600" onClick={(e) => { e.stopPropagation(); _onEditEventClicked(); }}>
                        bearbeiten
                    </button>
                </>
                )}
                <button className="hidden md:block bg-sky-500 text-white px-2 md:px-4 py-1 rounded-lg hover:bg-sky-600" onClick={(e) => { e.stopPropagation(); _onViewEventClicked(); }}>
                    ansehen
                </button>
            </div>
        </div>
    )
}