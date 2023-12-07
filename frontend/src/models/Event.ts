import { NetworkHelper } from "./NetworkHelper";
import { Bet } from "./Bet";
import { Terser } from "vite";

export const EventTypes = {
  men: "Männer",
  women: "Frauen",
  relay: "Staffel",
} satisfies Record<string, string>;

export type EventType = keyof typeof EventTypes;

export class Event {
  private _id: string;
  private _name: string;
  private _game_id: string;
  private _type: EventType;
  private _bets: Bet[];
  private _datetime: Date;
  constructor(
    id: string,
    name: string,
    game_id: string,
    type: EventType,
    datetime: string,
  ) {
    this._id = id;
    this._name = name;
    this._game_id = game_id;
    this._type = type;
    this._datetime = new Date(Date.parse(datetime));
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get game_id(): string {
    return this._game_id;
  }

  set game_id(value: string) {
    this._game_id = value;
  }

  get type(): EventType {
    return this._type;
  }

  set type(value: EventType) {
    this._type = value;
  }

  get bets(): Bet[] {
    return this._bets;
  }

  set bets(value: Bet[]) {
    this._bets = value;
  }

  get datetime(): Date {
    return this._datetime;
  }

  set datetime(value: Date) {
    this._datetime = value;
  }

  public static fromJson(json: any) {
    return new Event(
      json["id"],
      json["name"],
      json["game_id"],
      json["type"],
      json["datetime"],
    );
  }

  public static fetchAll(game_id: string): Promise<Event[]> {
    const builder = (res: any): Event[] => {
      return res.map((e: any) => {
        return new Event(
          e["id"],
          e["name"],
          e["game_id"],
          e["type"],
          e["datetime"],
        );
      });
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
      `/api/event/create?name=${name}&game_id=${game_id}&type=${type}&datetime=${date_string}`,
      builder,
    );
  }
}
