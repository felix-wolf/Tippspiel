import { useNavigate, useParams } from "react-router-dom";
import { useCallback } from "react";

type ExtractParam<T, Rest> = T extends `:${infer Param}`
  ? Record<Param, string> & Rest
  : Rest;

// eslint-disable-next-line @typescript-eslint/ban-types
type RouteParams<T> = T extends `${infer U}/${infer Rest}`
  ? ExtractParam<U, RouteParams<Rest>>
  : ExtractParam<T, {}>;

/**
 * Defines all valid paths to sites.
 */
export const SiteRoutes = {
  Login: "/",
  Home: "/home",
  Game: "/home/game/:game_id",
  PlaceBet: "/home/game/place_bet/:game_id/:event_id/:page_num",
  ViewBets: "/home/game/view_bets/:game_id/:event_id",
} as const satisfies Record<string, string>;

/**
 * Returns a route with the necessary params appended.
 * @param route the route to select
 * @param params the params to append.
 */
function getRoute<T extends string | -1>(
  route: T,
  params: RouteParams<T>,
): string {
  let path = "" + route;
  if (!params) return path;
  for (const [param, value] of Object.entries(
    params as Record<string, string>,
  )) {
    path = path.replace(`:${param}`, value);
  }
  return path;
}

/**
 * This function provides an easy and typesafe way of select a route for navigation.
 */
export function useNavigateParams() {
  const navigate = useNavigate();
  return useCallback(
    <T extends string | -1>(route: T, params: RouteParams<T>): void => {
      navigate(getRoute(route, params));
    },
    [],
  );
}

/**
 * This function provides a typesafe way of getting the route params to a specific route.
 * @param route the route to get the children for.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore
export function usePathParams<T extends string>(route: T): RouteParams<T> {
  return useParams() as RouteParams<T>;
}
