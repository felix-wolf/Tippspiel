import { NavPage } from "./NavPage";
import { Event, Predictions } from "../models/Event";
import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { useCurrentUser } from "../models/user/UserContext";
import { Prediction } from "../models/Bet";
import { useNavigate } from "react-router-dom";
import { BetPlacer } from "../components/domain/BetPlacer";
import useFetch from "../useFetch";
import Loader from "../components/design/Loader";
import { useCache } from "../contexts/CacheContext";

export function PlaceBetPage() {
  const { event_id, game_id } = usePathParams(SiteRoutes.PlaceBet);
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { deleteCache } = useCache();
  const { data, loading } = useFetch<Event>({
    key: Event.buildCacheKey(event_id),
    cache: { enabled: true, ttl: 2 * 60 },
    func: Event.fetchOne,
    args: [event_id],
  });

  if (data && data?.datetime < new Date()) {
    navigate(-1);
  }

  function onSave(predictions: Prediction[]) {
    if (predictions.length == 5 && user?.id) {
      Event.saveBets(event_id, user.id, predictions as Predictions)
        .then((_) => {
          deleteCache(Event.buildListCacheKey(game_id) + "1upcoming");
          navigate(-1);
        })
        .catch((error) => console.log("error saving bets", error));
    }
  }

  return (
    <>
      {loading && <Loader />}
      {!loading && (
        <NavPage title={"TIPPEN FÜR: " + data?.name}>
          {data && <BetPlacer user={user} onSave={onSave} event={data} />}
        </NavPage>
      )}
    </>
  );
}
