import { NetworkHelper } from "../NetworkHelper";
import { EventType } from "./EventType";

export class Discipline {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _eventTypes: EventType[];
  private readonly _resultUrl: string | undefined;
  private readonly _eventsUrl: string | undefined;

  constructor(
    id: string,
    name: string,
    eventTypes: EventType[],
    resultUrl: string | undefined,
    eventsUrl: string | undefined,
  ) {
    this._id = id;
    this._name = name;
    this._eventTypes = eventTypes;
    this._resultUrl = resultUrl;
    this._eventsUrl = eventsUrl;
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get eventTypes(): EventType[] {
    return this._eventTypes;
  }

  get resultUrl(): string | undefined {
    return this._resultUrl;
  }

  get eventsUrl(): string | undefined {
    return this._eventsUrl;
  }

  public static fromJson(json: any) {
    return new Discipline(
      json["id"],
      json["name"],
      json["event_types"].map((e_type_data: any) =>
        EventType.fromJson(e_type_data),
      ),
      json["result_url"],
      json["events_url"],
    );
  }

  public static fetchAll() {
    const builder = (res: any): Discipline[] => {
      return res.map((r: any) => Discipline.fromJson(r));
    };
    return NetworkHelper.fetchAll("/api/disciplines", builder);
  }
}
