import { NetworkHelper } from "./NetworkHelper";
import { EventType } from "./EventType";

export type DisciplineImportMode = "manual" | "official_api";

export class Discipline {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _eventTypes: EventType[];
  private readonly _resultUrl: string | undefined;
  private readonly _eventsUrl: string | undefined;
  private readonly _eventImportMode: DisciplineImportMode;
  private readonly _resultMode: DisciplineImportMode;

  constructor(
    id: string,
    name: string,
    eventTypes: EventType[],
    resultUrl: string | undefined,
    eventsUrl: string | undefined,
    eventImportMode: DisciplineImportMode,
    resultMode: DisciplineImportMode,
  ) {
    this._id = id;
    this._name = name;
    this._eventTypes = eventTypes;
    this._resultUrl = resultUrl;
    this._eventsUrl = eventsUrl;
    this._eventImportMode = eventImportMode;
    this._resultMode = resultMode;
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

  get eventImportMode(): DisciplineImportMode {
    return this._eventImportMode;
  }

  get resultMode(): DisciplineImportMode {
    return this._resultMode;
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
      json["event_import_mode"] ?? "manual",
      json["result_mode"] ?? "manual",
    );
  }

  public static fetchAll() {
    const builder = (res: any): Discipline[] => {
      return res.map((r: any) => Discipline.fromJson(r));
    };
    return NetworkHelper.fetchAll("/api/disciplines", builder);
  }
}
