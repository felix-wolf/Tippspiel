import { useNavigate, useParams } from "react-router-dom";
import { useCallback } from "react";

type ExtractParam<T, Rest> = T extends `:${infer Param}` ? Record<Param, string> & Rest : Rest;

// eslint-disable-next-line @typescript-eslint/ban-types
type RouteParams<T> = T extends `${infer U}/${infer Rest}` ? ExtractParam<U, RouteParams<Rest>> : ExtractParam<T, {}>;

/**
 * Defines all valid paths to sites.
 */
export const SiteRoutes = {
	Main: "/",
	Study: "/:studyId",
	Subject: "/:studyId/:subjectId",
	Export: "/:studyId/export",
	Debug: "/debug/*",
	Test: "/test/:studyId/:subjectId",
	Dashboard: "/dashboard/:inviteCode",
	Transcription: "/transcribe/:studyId/:subjectId", //TODO: Add parameters for question index/module index
	TestSchemaManagement: "/schemas",
	TestEditor: "/schemas/:schemaId",
} as const satisfies Record<string, string>;

/**
 * Returns a route with the necessary params appended.
 * @param route the route to select
 * @param params the params to append.
 */
function getRoute<T extends string | -1>(route: T, params: RouteParams<T>): string {
	let path = "" + route;
	if (!params) return path;
	for (const [param, value] of Object.entries(params as Record<string, string>)) {
		path = path.replace(`:${param}`, value);
	}
	return path;
}

/**
 * This function provides an easy and typesafe way of select a route for navigation.
 */
export function useNavigateParams() {
	const navigate = useNavigate();
	return useCallback(<T extends string | -1>(route: T, params: RouteParams<T>): void => {
		navigate(getRoute(route, params));
	}, []);
}

/**
 * This function provides a typesafe way of getting the route params to a specific route.
 * @param route the route to get the children for.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function usePathParams<T extends string>(route: T): RouteParams<T> {
	return useParams() as RouteParams<T>;
}
