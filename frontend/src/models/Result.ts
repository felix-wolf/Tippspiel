export class Result {
  private readonly _id: string;

  private readonly _event_id: string;
  private readonly _place: number;
  private readonly _object_id: string;
  private readonly _object_name: string;

  constructor(
    id: string,
    event_id: string,
    place: number,
    object_id: string,
    obejct_name: string,
  ) {
    this._id = id;
    this._event_id = event_id;
    this._place = place;
    this._object_id = object_id;
    this._object_name = obejct_name;
  }

  public toJson(): string {
    return `{
      "id": "${this.id}",
      "event_id": "${this.event_id}",
      "place": "${this.place}",
      "object_id": "${this.object_id}",
      "object_name": "${this.object_name}",
    }`;
  }

  public static fromJson(json: any): Result {
    return new Result(
      json["id"],
      json["event_id"],
      json["place"],
      json["object_id"],
      json["object_name"],
    );
  }

  get id(): string {
    return this._id;
  }

  get event_id(): string {
    return this._event_id;
  }

  get place(): number {
    return this._place;
  }

  get object_id(): string {
    return this._object_id;
  }

  get object_name(): string {
    return this._object_name;
  }
}
