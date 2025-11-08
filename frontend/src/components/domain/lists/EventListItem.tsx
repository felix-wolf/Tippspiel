import { Badge, BadgeCheck } from "lucide-react"
import { Event } from "../../../models/Event"
import { useCurrentUser } from "../../../models/user/UserContext"
import { Utils } from "../../../utils"

type EventListItemProps = {
    event: Event
    onViewEventClicked: () => void
    onEditEventClicked: () => void
    isUpcoming: boolean
}

export function EventListItem({
    event,
    isUpcoming,
    onViewEventClicked: _onViewEventClicked,
    onEditEventClicked: _onEditEventClicked
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
                flex justify-between items-center bg-white/70 rounded-xl p-4 shadow-sm
                ${isUpcoming && !eventHasBetsForUser(event) && "border border-sky-400"}
                `}
        >
            <div>
                <p className={`
                    font-medium flex flex-row gap-2
                    ${isUpcoming && eventHasBetsForUser(event) && "text-gray-400"}
                    `}>
                    {event.name}
                    {isUpcoming && (eventHasBetsForUser(event) ? <BadgeCheck /> : <Badge />)}</p>
                <p className={"text-sm text-gray-600"}>{Utils.dateToString(event.datetime)}</p>
            </div>
            <div className="flex flex-row gap-2">
                {isUpcoming && (
                <button className="bg-sky-500 text-white px-4 py-1 rounded-lg hover:bg-sky-600" onClick={() => _onEditEventClicked()}>
                    bearbeiten
                </button>
                )}
                <button className="bg-sky-500 text-white px-4 py-1 rounded-lg hover:bg-sky-600" onClick={() => _onViewEventClicked()}>
                    ansehen
                </button>
            </div>
        </div>
    )
}