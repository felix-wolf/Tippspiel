import { NetworkHelper } from "./NetworkHelper";
import { Bet } from "./Bet";
import { EventType } from "./user/EventType";

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
    this._datetime = new Date(Date.parse(datetime));
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
    const builder = (res: any): Event => Event.fromJson(res);
    return NetworkHelper.fetchOne(
      `/api/event/get?event_id=${event_id}`,
      builder,
    );
  }

  public static fetchAll(game_id: string): Promise<Event[]> {
    const builder = (res: any): Event[] => {
      return res.map((e: any) => Event.fromJson(e));
    };
    return NetworkHelper.fetchAll(`/api/event/get?game_id=${game_id}`, builder);
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
    const builder = (res: any): Event => {
      return Event.fromJson(res);
    };
    return NetworkHelper.create<Event>(
      `/api/event/create?name=${name}&game_id=${game_id}&type=${type.id}&datetime=${date_string}`,
      builder,
    );
  }
}
