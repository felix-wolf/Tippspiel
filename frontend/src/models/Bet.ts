export class Prediction {
  private readonly _id: string | undefined;
  private readonly _bet_id: string | undefined;
  private readonly _predicted_place: number;
  private readonly _object_id: string;
  private readonly _actual_place: number | undefined;
  private readonly _score: number | undefined;

  constructor(
    id: string | undefined,
    bet_id: string | undefined,
    predicted_place: number,
    object_id: string,
    actual_place: number | undefined,
    score: number | undefined,
  ) {
    this._id = id;
    this._bet_id = bet_id;
    this._predicted_place = predicted_place;
    this._object_id = object_id;
    this._actual_place = actual_place;
    this._score = score;
  }

  public static fromJson(json: any): Prediction {
    return new Prediction(
      json["id"],
      json["bet_id"],
      json["predicted_place"],
      json["object_id"],
      json["actual_place"],
      json["score"],
    );
  }

  get id(): string | undefined {
    return this._id;
  }

  get bet_id(): string | undefined {
    return this._bet_id;
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
}

export class Bet {
  private readonly _id: string | undefined;
  private readonly _user_id: string;
  private readonly _predictions: Prediction[];
  private readonly _score: number | undefined;

  constructor(
    bet_id: string | undefined,
    user_id: string,
    predictions: Prediction[],
    score: number | undefined,
  ) {
    this._id = bet_id;
    this._user_id = user_id;
    this._predictions = predictions;
    this._score = score;
  }

  get user_id(): string {
    return this._user_id;
  }

  get id(): string | undefined {
    return this._id;
  }

  get predictions(): Prediction[] {
    return this._predictions;
  }

  get score(): number | undefined {
    return this._score;
  }

  public static fromJson(json: any) {
    return new Bet(
      json["id"],
      json["user_id"],
      json["predictions"].map((prediction: Object) =>
        Prediction.fromJson(prediction),
      ),
      json["score"],
    );
  }
}
