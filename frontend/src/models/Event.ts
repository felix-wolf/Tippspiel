import { NetworkHelper } from "./NetworkHelper";
import { Bet, Prediction } from "./Bet";
import { EventType } from "./EventType";
import { Result } from "./Result";
import { Utils } from "../utils.ts";
import { EventTimeType } from "../components/domain/lists/EventList.tsx";

export type Predictions = [
  Prediction,
  Prediction,
  Prediction,
  Prediction,
  Prediction,
];

export type AdminResultDiffEntry = {
  place: number;
  before: Result | null;
  after: Result | null;
};

export type AdminResultTargetEvent = {
  eventId: string;
  eventName: string;
  gameId: string;
  hasResults: boolean;
};

export type AdminResultRefreshPreview = {
  scope: "event" | "shared_event";
  targetEventId: string;
  sharedEventId?: string;
  sourceProvider?: string;
  sourceRaceId?: string;
  affectedEvents: AdminResultTargetEvent[];
  hasChanges: boolean;
  changes: AdminResultDiffEntry[];
  currentResults: Result[];
  fetchedResults: Result[];
};

export type AdminResultOperationResponse = {
  scope: "event" | "shared_event";
  targetEventId: string;
  sharedEventId?: string;
  affectedEvents: AdminResultTargetEvent[];
  status: string;
  processedCount?: number;
  clearedCount?: number;
  rescoredCount?: number;
  resendNotifications?: boolean;
};

export type StartListEntryMember = {
  leg?: number;
  name: string;
};

export type StartListEntry = {
  id: string;
  name: string;
  members: StartListEntryMember[];
};

export type StartListResponse = {
  startList: string[];
  entries: StartListEntry[];
};

export class Event {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _game_id: string;
  private readonly _numBets: number;
  private readonly _pointsCorrectBet: number;
  private readonly _allowPartialPoints: boolean;
  private readonly _eventType: EventType;
  private readonly _bets: Bet[];
  private readonly _datetime: Date;
  private readonly _hasBetsForUsers: string[];
  private readonly _results: Result[];
  private readonly _eventUrl?: string;
  private readonly _location?: string;
  private readonly _raceFormat?: string;
  private readonly _sourceProvider?: string;
  private readonly _sourceEventId?: string;
  private readonly _sourceRaceId?: string;
  private readonly _seasonId?: string;
  constructor(
    id: string,
    name: string,
    game_id: string,
    type: EventType,
    datetime: string,
    numBets: number,
    pointsCorrectBet: number,
    allowPartialPoints: boolean,
    bets: Bet[],
    results: Result[],
    hasBetsForUsers: string[],
    date?: Date,
    eventUrl?: string,
    location?: string,
    raceFormat?: string,
    sourceProvider?: string,
    sourceEventId?: string,
    sourceRaceId?: string,
    seasonId?: string,
  ) {
    this._id = id;
    this._name = name;
    this._game_id = game_id;
    this._eventType = type;
    this._bets = bets;
    this._numBets = numBets;
    this._pointsCorrectBet = pointsCorrectBet;
    this._allowPartialPoints = allowPartialPoints;
    this._results = results;
    this._hasBetsForUsers = hasBetsForUsers;
    this._eventUrl = eventUrl;
    this._location = location;
    this._raceFormat = raceFormat;
    this._sourceProvider = sourceProvider;
    this._sourceEventId = sourceEventId;
    this._sourceRaceId = sourceRaceId;
    this._seasonId = seasonId;
    if (date) {
      this._datetime = date;
    } else {
      this._datetime = new Date(Date.parse(datetime.replace(/-/g, "/")));
    }
  }

  public hasBetsForUsers(): string[] {
    return this._hasBetsForUsers;
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get game_id(): string {
    return this._game_id;
  }

  get type(): EventType {
    return this._eventType;
  }

  get numBets(): number {
    return this._numBets;
  }

  get pointsCorrectBet(): number {
    return this._pointsCorrectBet;
  }

  get allowPartialPoints(): boolean {
    return this._allowPartialPoints;
  }

  get bets(): Bet[] {
    return this._bets;
  }

  get results(): Result[] {
    return this._results;
  }

  get eventUrl(): string | undefined {
    return this._eventUrl;
  }

  get location(): string | undefined {
    return this._location;
  }

  get raceFormat(): string | undefined {
    return this._raceFormat;
  }

  get datetime(): Date {
    return this._datetime;
  }

  get sourceProvider(): string | undefined {
    return this._sourceProvider;
  }

  get sourceEventId(): string | undefined {
    return this._sourceEventId;
  }

  get sourceRaceId(): string | undefined {
    return this._sourceRaceId;
  }

  get seasonId(): string | undefined {
    return this._seasonId;
  }

  public processManualResults(results: Prediction[]): Promise<Event> {
    return NetworkHelper.post("/api/results", Event.fromJson, {
      results: results.map((pred) => {
        return { place: pred.predicted_place, id: pred.object_id };
      }),
      event_id: this._id,
    });
  }

  public toPayload() {
    return {
      id: this._id,
      name: this._name,
      game_id: this._game_id,
      datetime: Utils.dateToIsoString(this._datetime),
      allow_partial_points: this.allowPartialPoints ? 1 : 0,
      results: this._results.map((result) => result.toPayload()),
      bets: this._bets.map((bet) => bet.toPayload()),
      event_type: this._eventType.toPayload(),
      url: this._eventUrl ?? null,
      location: this._location ?? null,
      race_format: this._raceFormat ?? null,
      source_provider: this._sourceProvider ?? null,
      source_event_id: this._sourceEventId ?? null,
      source_race_id: this._sourceRaceId ?? null,
      season_id: this._seasonId ?? null,
      num_bets: this._numBets,
      points_correct_bet: this._pointsCorrectBet,
    };
  }

  public delete() {
    return NetworkHelper.delete(`/api/event/delete`, () => {}, {
      event_id: this._id,
    });
  }

  public static previewResultRefresh(eventId: string): Promise<AdminResultRefreshPreview> {
    return NetworkHelper.post(
      `/api/admin/events/${eventId}/results/preview-refresh`,
      Event.adminResultRefreshPreviewFromJson,
      {},
    );
  }

  public static applyResultRefresh(
    eventId: string,
    resendNotifications: boolean = false,
  ): Promise<AdminResultOperationResponse> {
    return NetworkHelper.post(
      `/api/admin/events/${eventId}/results/apply-refresh`,
      Event.adminResultOperationFromJson,
      { resend_notifications: resendNotifications },
    );
  }

  public static clearResults(eventId: string): Promise<AdminResultOperationResponse> {
    return NetworkHelper.delete(
      `/api/admin/events/${eventId}/results`,
      Event.adminResultOperationFromJson,
      {},
    );
  }

  public static rescoreResults(eventId: string): Promise<AdminResultOperationResponse> {
    return NetworkHelper.post(
      `/api/admin/events/${eventId}/results/rescore`,
      Event.adminResultOperationFromJson,
      {},
    );
  }

  public static buildCacheKey(eventId: string) {
    return `event${eventId}`;
  }

  public static buildListCacheKey(
    gameId: string,
    index: string,
    type: EventTimeType,
  ) {
    return `events${gameId}${index}${type}`;
  }

  public static fromJson(json: any) {
    return new Event(
      json["id"],
      json["name"],
      json["game_id"],
      EventType.fromJson(json["event_type"]),
      json["datetime"],
      json["num_bets"],
      json["points_correct_bet"],
      json["allow_partial_points"],
      json["bets"].map((bet: any) => Bet.fromJson(bet)),
      json["results"].map((result: any) => Result.fromJson(result)),
      json["has_bets_for_users"],
      undefined,
      json["url"],
      json["location"],
      json["race_format"],
      json["source_provider"],
      json["source_event_id"],
      json["source_race_id"],
      json["season_id"],
    );
  }

  private static adminTargetEventFromJson(json: any): AdminResultTargetEvent {
    return {
      eventId: json["event_id"],
      eventName: json["event_name"],
      gameId: json["game_id"],
      hasResults: Boolean(json["has_results"]),
    };
  }

  private static adminResultDiffEntryFromJson(json: any): AdminResultDiffEntry {
    return {
      place: json["place"],
      before: json["before"] ? Result.fromJson(json["before"]) : null,
      after: json["after"] ? Result.fromJson(json["after"]) : null,
    };
  }

  private static adminResultRefreshPreviewFromJson(json: any): AdminResultRefreshPreview {
    return {
      scope: json["scope"],
      targetEventId: json["target_event_id"],
      sharedEventId: json["shared_event_id"] ?? undefined,
      sourceProvider: json["source_provider"] ?? undefined,
      sourceRaceId: json["source_race_id"] ?? undefined,
      affectedEvents: (json["affected_events"] ?? []).map((event: any) =>
        Event.adminTargetEventFromJson(event),
      ),
      hasChanges: Boolean(json["has_changes"]),
      changes: (json["changes"] ?? []).map((change: any) =>
        Event.adminResultDiffEntryFromJson(change),
      ),
      currentResults: (json["current_results"] ?? []).map((result: any) =>
        Result.fromJson(result),
      ),
      fetchedResults: (json["fetched_results"] ?? []).map((result: any) =>
        Result.fromJson(result),
      ),
    };
  }

  private static adminResultOperationFromJson(json: any): AdminResultOperationResponse {
    return {
      scope: json["scope"],
      targetEventId: json["target_event_id"],
      sharedEventId: json["shared_event_id"] ?? undefined,
      affectedEvents: (json["affected_events"] ?? []).map((event: any) =>
        Event.adminTargetEventFromJson(event),
      ),
      status: json["status"],
      processedCount: json["processed_count"],
      clearedCount: json["cleared_count"],
      rescoredCount: json["rescored_count"],
      resendNotifications: json["resend_notifications"],
    };
  }

  public static fetchOne(event_id: string): Promise<Event> {
    return NetworkHelper.fetchOne(
      `/api/event?event_id=${event_id}&full_object=true`,
      Event.fromJson,
    );
  }

  public static fetchStartList(eventId: string): Promise<StartListResponse> {
    return NetworkHelper.fetchOne(
      `/api/event/start_list?event_id=${eventId}`,
      (json: any) => ({
        startList: (json["start_list"] ?? []) as string[],
        entries: (json["entries"] ?? []) as StartListEntry[],
      }),
    );
  }

  public static saveBets(
    event_id: string,
    predictions: Predictions,
  ): Promise<Event> {
    return Event.saveBetsRequest(event_id, predictions);
  }

  public static saveBetsForUser(
    event_id: string,
    user_id: string,
    predictions: Predictions,
  ): Promise<Event> {
    return Event.saveBetsRequest(event_id, predictions, user_id);
  }

  private static saveBetsRequest(
    event_id: string,
    predictions: Predictions,
    user_id?: string,
  ): Promise<Event> {
    return NetworkHelper.post(
      "/api/event/save_bets",
      Event.fromJson,
      {
        event_id: event_id,
        user_id: user_id,
        predictions: predictions.map((prediction) => {
          const payload = prediction.toPayload();
          return {
            id: payload.id,
            bet_id: payload.bet_id,
            object_id: payload.object_id,
            object_name: payload.object_name,
            predicted_place: payload.predicted_place,
            score: payload.score,
          };
        }),
      },
    );
  }

  public static saveImportedEvents(events: Event[]): Promise<Event[]> {
    const builder = (res: any): Event[] => {
      return res.map((event: any) => Event.fromJson(event));
    };
    return NetworkHelper.post<Event[]>("/api/event", builder, {
      events: events.map((event: Event) => JSON.stringify(event.toPayload())),
    });
  }

  public static fetchAll(
    game_id: string,
    page: number,
    past: boolean = false,
  ): Promise<Event[]> {
    const builder = (res: any): Event[] => {
      return res.map((e: any) => Event.fromJson(e));
    };
    let url = `/api/event?game_id=${game_id}&past=${past}`;
    if (page) {
      url += `&page=${page}`;
    }
    return NetworkHelper.fetchAll(url, builder);
  }

  public static create(
    name: string,
    game_id: string,
    type: EventType,
    datetime: Date,
    numBets: number,
    pointsCorrectBet: number,
    location?: string,
    raceFormat?: string,
  ): Promise<Event> {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    };
    const date_string = datetime.toLocaleTimeString("de-DE", options);
    return NetworkHelper.post<Event>("/api/event", Event.fromJson, {
      name: name,
      game_id: game_id,
      type: type.id,
      datetime: date_string,
      num_bets: numBets,
      points_correct_bet: pointsCorrectBet,
      location: location,
      race_format: raceFormat,
    });
  }

  public static update(
    event_id: string,
    name: string,
    game_id: string,
    type: EventType,
    datetime: Date,
    numBets: number,
    pointsCorrectBet: number,
    allowPartialPoints: boolean,
    location?: string,
    raceFormat?: string,
  ): Promise<Event> {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    };
    const date_string = datetime.toLocaleTimeString("de-DE", options);
    return NetworkHelper.update<Event>("/api/event", Event.fromJson, {
      event_id: event_id,
      name: name,
      game_id: game_id,
      type: type.id,
      datetime: date_string,
      num_bets: numBets,
      points_correct_bet: pointsCorrectBet,
      allow_partial_points: allowPartialPoints,
      location: location,
      race_format: raceFormat,
    });
  }
}
