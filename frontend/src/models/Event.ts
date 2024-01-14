import { NetworkHelper } from "./NetworkHelper";
import { Bet, Prediction } from "./Bet";
import { EventType } from "./user/EventType";

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
  private readonly _eventType: EventType;
  private readonly _bets: Bet[];
  private readonly _datetime: Date;
  constructor(
    id: string,
    name: string,
    game_id: string,
    type: EventType,
    datetime: string,
    bets: Bet[],
  ) {
    this._id = id;
    this._name = name;
    this._game_id = game_id;
    this._eventType = type;
    this._bets = bets;
    this._datetime = new Date(Date.parse(datetime.replace(/-/g, "/")));
  }

  public hasResults(): boolean {
    return this.bets.some((bet) => bet.hasResults());
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

  get bets(): Bet[] {
    return this._bets;
  }

  get datetime(): Date {
    return this._datetime;
  }

  public static fromJson(json: any) {
    return new Event(
      json["id"],
      json["name"],
      json["game_id"],
      EventType.fromJson(json["event_type"]),
      json["datetime"],
      json["bets"].map((bet: any) => Bet.fromJson(bet)),
    );
  }

  public static fetchOne(event_id: string): Promise<Event> {
    return NetworkHelper.fetchOne(
      `/api/event?event_id=${event_id}`,
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
      } ?? {},
    );
  }

  public static fetchAll(game_id: string): Promise<Event[]> {
    const builder = (res: any): Event[] => {
      return res.map((e: any) => Event.fromJson(e));
    };
    return NetworkHelper.fetchAll(`/api/event?game_id=${game_id}`, builder);
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

  public static create(
    name: string,
    game_id: string,
    type: EventType,
    datetime: Date,
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
    });
  }

  public static update(
    event_id: string,
    name: string,
    game_id: string,
    type: EventType,
    datetime: Date,
  ): Promise<Event> {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    };
    const date_string = datetime.toLocaleTimeString("de-DE", options);
    return NetworkHelper.post<Event>("/api/event", Event.fromJson, {
      event_id: event_id,
      name: name,
      game_id: game_id,
      type: type.id,
      datetime: date_string,
    });
  }
}
