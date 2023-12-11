export class Placement {
  private readonly _predicted_place: number;
  private readonly _object_id: string;
  private readonly _actual_place: number | undefined;
  private readonly _score: number | undefined;

  constructor(
    predicted_place: number,
    object_id: string,
    actual_place: number | undefined,
    score: number | undefined,
  ) {
    this._predicted_place = predicted_place;
    this._object_id = object_id;
    this._actual_place = actual_place;
    this._score = score;
  }

  get predicted_place(): number {
    return this._predicted_place;
  }

  get object_id(): string {
    return this._object_id;
  }

  get actual_place(): number | undefined {
    return this._actual_place;
  }

  get score(): number | undefined {
    return this._score;
  }

  public static fromJson(json: any) {
    return new Placement(
      json["predicted_place"],
      json["object_id"],
      json["actual_place"],
      json["score"],
    );
  }
}

type Placements = readonly [
  Placement,
  Placement,
  Placement,
  Placement,
  Placement,
];

export class Bet {
  private readonly _user_id: string;
  private readonly _placements: Placements;

  constructor(user_id: string, placements: Placements) {
    this._user_id = user_id;
    this._placements = placements;
  }

  get user_id(): string {
    return this._user_id;
  }

  get placements(): Placements {
    return this._placements;
  }

  public static fromJson(json: any) {
    return new Bet(
      json["user_id"],
      json["placements"].map((placement: any) => Placement.fromJson(placement)),
    );
  }
}
