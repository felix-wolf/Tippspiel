import { NavPage } from "./NavPage";
import { useEffect, useState } from "react";
import { Event, Predictions } from "../models/Event";
import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { useCurrentUser } from "../models/user/UserContext";
import { Prediction } from "../models/Bet";
import { useNavigate } from "react-router-dom";
import { BetPlacer } from "../components/domain/BetPlacer";

export function PlaceBetPage() {
  const { event_id, game_id } = usePathParams(SiteRoutes.PlaceBet);
  const user = useCurrentUser();
  const [event, setEvent] = useState<Event | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    Event.fetchOne(event_id)
      .then((event) => {
        setEvent(event);
        if (event.datetime < new Date()) {
          navigate(-1);
        }
      })
      .catch((error) => {
        console.log("error fetching event", error);
      });
  }, [event_id, game_id]);

  function onSave(predictions: Prediction[]) {
    if (predictions.length == 5 && user?.id) {
      Event.saveBets(event_id, user.id, predictions as Predictions)
        .then((_) => {
          navigate(-1);
        })
        .catch((error) => console.log("error saving bets", error));
    }
  }

  return (
    <NavPage title={"TIPPEN FÜR: " + event?.name}>
      {event && <BetPlacer user={user} onSave={onSave} event={event} />}
    </NavPage>
  );
}
