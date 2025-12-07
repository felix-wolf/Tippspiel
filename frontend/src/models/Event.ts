import { NetworkHelper } from "./NetworkHelper";
import { Bet, Prediction } from "./Bet";
import { EventType } from "./user/EventType";
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

  get datetime(): Date {
    return this._datetime;
  }

  public processUrlForResults(url: string): Promise<Event> {
    return NetworkHelper.post("/api/results", Event.fromJson, {
      url: url,
      event_id: this._id,
    });
  }

  public processManualResults(results: Prediction[]): Promise<Event> {
    return NetworkHelper.post("/api/results", Event.fromJson, {
      results: results.map((pred) => {
        return { place: pred.predicted_place, id: pred.object_id };
      }),
      event_id: this._id,
    });
  }

  public toJson(): string {
    return `{
      "id": "${this._id}",
      "name": "${this._name}",
      "game_id": "${this._game_id}",
      "datetime": "${Utils.dateToIsoString(this._datetime)}",
      "hasBetsForUsers": "${this._hasBetsForUsers}",
      "allow_partial_points": "${this.allowPartialPoints ? 1 : 0}",
      "results": [${this._results.map((result) => result.toJson()).join(",")}],
      "bets": [${this._bets.map((bet) => bet.toJson()).join(",")}],
      "event_type": ${this._eventType.toJson()},
      "url": "${this._eventUrl}"
      }`;
  }

  public delete() {
    return NetworkHelper.post(`/api/event/delete`, () => {}, {
      event_id: this._id,
    });
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
    );
  }

  public static fetchOne(event_id: string): Promise<Event> {
    return NetworkHelper.fetchOne(
      `/api/event?event_id=${event_id}&full_object=true`,
      Event.fromJson,
    );
  }

  public static saveBets(
    event_id: string,
    user_id: string,
    predictions: Predictions,
  ): Promise<Event> {
    return NetworkHelper.post(
      "/api/event/save_bets",
      Event.fromJson,
      {
        event_id: event_id,
        user_id: user_id,
        predictions: predictions.map((prediction) => {
          return {
            id: prediction.id,
            bet_id: prediction.bet_id,
            object_id: prediction.object_id,
            predicted_place: prediction.predicted_place,
            score: prediction.score,
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
      events: events.map((event: Event) => event.toJson()),
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
    });
  }
}
