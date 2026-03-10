export class Result {
  private readonly _id: string;

  private readonly _event_id: string;
  private readonly _place: number;
  private readonly _object_id: string;
  private readonly _object_name: string;
  private readonly _time?: string;
  private readonly _behind?: string;
  private readonly _shooting?: string;
  private readonly _shooting_time?: string;

  constructor(
    id: string,
    event_id: string,
    place: number,
    object_id: string,
    obejct_name: string,
    time?: string,
    behind?: string,
    shooting?: string,
    shooting_time?: string,
  ) {
    this._id = id;
    this._event_id = event_id;
    this._place = place;
    this._object_id = object_id;
    this._object_name = obejct_name;
    this._time = time;
    this._behind = behind;
    this._shooting = shooting;
    this._shooting_time = shooting_time;
  }

  public toJson(): string {
    const payload: Record<string, string | undefined> = {
      id: this.id,
      event_id: this.event_id,
      place: `${this.place}`,
      object_id: this.object_id,
      object_name: this.object_name,
      time: this.time,
      behind: this.behind,
    };
    if (this.shooting !== undefined) {
      payload.shooting = this.shooting;
    }
    if (this.shooting_time !== undefined) {
      payload.shooting_time = this.shooting_time;
    }
    return JSON.stringify(payload, null, 2);
  }

  public static fromJson(json: any): Result {
    return new Result(
      json["id"],
      json["event_id"],
      json["place"],
      json["object_id"],
      json["object_name"],
      json["time"],
      json["behind"],
      json["shooting"],
      json["shooting_time"],
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

  get time(): string | undefined {
    return this._time;
  }

  get behind(): string | undefined {
    return this._behind;
  }

  get shooting(): string | undefined {
    return this._shooting;
  }

  get shooting_time(): string | undefined {
    return this._shooting_time;
  }
}
