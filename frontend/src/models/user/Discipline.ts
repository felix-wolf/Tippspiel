import { NetworkHelper } from "../NetworkHelper";
import { EventType } from "./EventType";

export class Discipline {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _event_types: EventType[];

  constructor(id: string, name: string, eventTypes: EventType[]) {
    this._id = id;
    this._name = name;
    this._event_types = eventTypes;
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get eventTypes(): EventType[] {
    return this._event_types;
  }

  public static fromJson(json: any) {
    return new Discipline(
      json["id"],
      json["name"],
      json["event_types"].map((e_type_data: any) =>
        EventType.fromJson(e_type_data),
      ),
    );
  }

  public static fetchAll() {
    const builder = (res: any): Discipline[] => {
      return res.map((r: any) => Discipline.fromJson(r));
    };
    return NetworkHelper.fetchAll("/api/disciplines", builder);
  }
}
