import { NavPage } from "./NavPage";
import { Event, Predictions } from "../models/Event";
import { SiteRoutes, usePathParams } from "../../SiteRoutes";
import { useCurrentUser } from "../contexts/UserContext";
import { Prediction } from "../models/Bet";
import { useNavigate } from "react-router-dom";
import { BetPlacer } from "../components/domain/BetPlacer";
import useFetch from "../useFetch";
import Loader from "../components/design/Loader";
import { useCache } from "../contexts/CacheContext";

export function PlaceBetPage() {
  const { event_id, game_id, page_num } = usePathParams(SiteRoutes.PlaceBet);
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { deleteCache } = useCache();
  const { data, loading } = useFetch<Event>({
    key: Event.buildCacheKey(event_id, "betting"),
    cache: { enabled: true, ttl: 2 * 60 },
    func: Event.fetchForBetting,
    args: [event_id],
  });

  if (data && data?.datetime < new Date()) {
    navigate(-1);
  }

  function onSave(predictions: Prediction[]) {
    if (predictions.length == data?.numBets && user?.id) {
      Event.saveBets(event_id, predictions as Predictions)
        .then((_) => {
          deleteCache(Event.buildListCacheKey(game_id, page_num, "upcoming"));
          deleteCache(Event.buildCacheKey(event_id, "betting"));
          deleteCache(Event.buildCacheKey(event_id, "full"));
          navigate(-1);
        })
        .catch((error) => console.log("error saving bets", error));
    }
  }

  return (
    <>
      {loading && <Loader />}
      {!loading && (
        <NavPage title={<span className="text-sky-800">{data?.name}</span>}>
          {data && (
            <BetPlacer
              user={user}
              onSave={onSave}
              event={data}
              enteringResults={false}
            />
          )}
        </NavPage>
      )}
    </>
  );
}
