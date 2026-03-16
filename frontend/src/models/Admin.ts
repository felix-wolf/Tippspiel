import { NetworkHelper } from "./NetworkHelper";

export type AdminSharedEventLinkedEvent = {
  eventId: string;
  eventName: string;
  gameId: string;
  gameName: string;
  hasResults: boolean;
};

export type AdminSharedEventFlags = {
  canRefreshResults: boolean;
  missingResults: boolean;
  hasInconsistentResultState: boolean;
  missingSourceMapping: boolean;
  hasMultipleLinkedGames: boolean;
};

export type AdminSharedEventDiagnostic = {
  sharedEventId: string;
  targetEventId: string;
  name: string;
  location?: string;
  raceFormat?: string;
  datetime: string;
  eventTypeId: string;
  sourceProvider?: string;
  sourceEventId?: string;
  sourceRaceId?: string;
  seasonId?: string;
  url?: string;
  linkedEventCount: number;
  withResultsCount: number;
  withoutResultsCount: number;
  linkedEvents: AdminSharedEventLinkedEvent[];
  flags: AdminSharedEventFlags;
};

export type AdminCountryDiagnostic = {
  code: string;
  name: string;
  flag: string;
  athleteCount: number;
  resultCount: number;
  isMissingRow: boolean;
  isPlaceholderFlag: boolean;
  athleteExamples: string[];
};

export type AdminOperationStatus = "succeeded" | "failed" | "warning";

export type AdminOperationEntry = {
  id: string;
  actorType: string;
  actorUserId?: string;
  actorName: string;
  actionType: string;
  targetType?: string;
  targetId?: string;
  status: AdminOperationStatus;
  summary: string;
  details?: any;
  createdAt: string;
};

export type AdminOperationOverview = {
  entries: AdminOperationEntry[];
  totalCount: number;
  failureCount: number;
  successCount: number;
  warningCount: number;
};

export class Admin {
  public static fetchSharedEvents(): Promise<AdminSharedEventDiagnostic[]> {
    return NetworkHelper.fetchAll("/api/admin/shared-events", (res: any) =>
      (res ?? []).map((item: any) => Admin.sharedEventFromJson(item)),
    );
  }

  public static fetchSharedEventDetail(sharedEventId: string): Promise<AdminSharedEventDiagnostic> {
    return NetworkHelper.fetchOne(
      `/api/admin/shared-events/${encodeURIComponent(sharedEventId)}`,
      Admin.sharedEventFromJson,
    );
  }

  public static updateSharedEventSource(
    sharedEventId: string,
    payload: {
      source_provider: string;
      source_event_id?: string;
      source_race_id: string;
      season_id?: string;
    },
  ): Promise<AdminSharedEventDiagnostic> {
    return NetworkHelper.update(
      `/api/admin/shared-events/${encodeURIComponent(sharedEventId)}/source`,
      Admin.sharedEventFromJson,
      payload,
    );
  }

  public static fetchCountryDiagnostics(): Promise<AdminCountryDiagnostic[]> {
    return NetworkHelper.fetchAll("/api/admin/countries", (res: any) =>
      (res ?? []).map((item: any) => Admin.countryFromJson(item)),
    );
  }

  public static updateCountry(
    code: string,
    payload: { name: string; flag: string },
  ): Promise<AdminCountryDiagnostic> {
    return NetworkHelper.update(
      `/api/admin/countries/${encodeURIComponent(code)}`,
      Admin.countryFromJson,
      payload,
    );
  }

  public static fetchOperations(): Promise<AdminOperationOverview> {
    return NetworkHelper.fetchOne("/api/admin/operations", Admin.operationOverviewFromJson);
  }

  private static sharedEventFromJson(json: any): AdminSharedEventDiagnostic {
    return {
      sharedEventId: json["shared_event_id"],
      targetEventId: json["target_event_id"],
      name: json["name"],
      location: json["location"] ?? undefined,
      raceFormat: json["race_format"] ?? undefined,
      datetime: json["datetime"],
      eventTypeId: json["event_type_id"],
      sourceProvider: json["source_provider"] ?? undefined,
      sourceEventId: json["source_event_id"] ?? undefined,
      sourceRaceId: json["source_race_id"] ?? undefined,
      seasonId: json["season_id"] ?? undefined,
      url: json["url"] ?? undefined,
      linkedEventCount: json["linked_event_count"],
      withResultsCount: json["with_results_count"],
      withoutResultsCount: json["without_results_count"],
      linkedEvents: (json["linked_events"] ?? []).map((event: any) => ({
        eventId: event["event_id"],
        eventName: event["event_name"],
        gameId: event["game_id"],
        gameName: event["game_name"],
        hasResults: Boolean(event["has_results"]),
      })),
      flags: {
        canRefreshResults: Boolean(json["flags"]?.["can_refresh_results"]),
        missingResults: Boolean(json["flags"]?.["missing_results"]),
        hasInconsistentResultState: Boolean(json["flags"]?.["has_inconsistent_result_state"]),
        missingSourceMapping: Boolean(json["flags"]?.["missing_source_mapping"]),
        hasMultipleLinkedGames: Boolean(json["flags"]?.["has_multiple_linked_games"]),
      },
    };
  }

  private static countryFromJson(json: any): AdminCountryDiagnostic {
    return {
      code: json["code"],
      name: json["name"],
      flag: json["flag"],
      athleteCount: json["athlete_count"] ?? 0,
      resultCount: json["result_count"] ?? 0,
      isMissingRow: Boolean(json["is_missing_row"]),
      isPlaceholderFlag: Boolean(json["is_placeholder_flag"]),
      athleteExamples: json["athlete_examples"] ?? [],
    };
  }

  private static operationEntryFromJson(json: any): AdminOperationEntry {
    return {
      id: json["id"],
      actorType: json["actor_type"],
      actorUserId: json["actor_user_id"] ?? undefined,
      actorName: json["actor_name"],
      actionType: json["action_type"],
      targetType: json["target_type"] ?? undefined,
      targetId: json["target_id"] ?? undefined,
      status: json["status"],
      summary: json["summary"],
      details: json["details"] ?? undefined,
      createdAt: json["created_at"],
    };
  }

  private static operationOverviewFromJson(json: any): AdminOperationOverview {
    return {
      entries: (json["entries"] ?? []).map((entry: any) => Admin.operationEntryFromJson(entry)),
      totalCount: json["total_count"] ?? 0,
      failureCount: json["failure_count"] ?? 0,
      successCount: json["success_count"] ?? 0,
      warningCount: json["warning_count"] ?? 0,
    };
  }
}
