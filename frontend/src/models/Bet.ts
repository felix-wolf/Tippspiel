export class Bet {
  private readonly _id: string | undefined;
  private readonly _user_id: string;
  private readonly _predicted_place: number;
  private readonly _object_id: string;
  private readonly _actual_place: number | undefined;
  private readonly _score: number | undefined;

  constructor(
    bet_id: string | undefined,
    user_id: string,
    predicted_place: number,
    object_id: string,
    actual_place: number | undefined,
    score: number | undefined,
  ) {
    this._id = bet_id;
    this._user_id = user_id;
    this._predicted_place = predicted_place;
    this._object_id = object_id;
    this._actual_place = actual_place;
    this._score = score;
  }

  get user_id(): string {
    return this._user_id;
  }

  get id(): string | undefined {
    return this._id;
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
    return new Bet(
      json["id"],
      json["user_id"],
      json["predicted_place"],
      json["object_id"],
      json["actual_place"],
      json["score"],
    );
  }
}
