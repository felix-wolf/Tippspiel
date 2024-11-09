export class Prediction {
  private readonly _id: string | undefined;
  private readonly _bet_id: string | undefined;
  private readonly _predicted_place: number;
  private readonly _object_id: string;
  private readonly _object_name: string | undefined;
  private readonly _actual_place: number | undefined;
  private readonly _score: number | undefined;

  constructor(
    id: string | undefined,
    bet_id: string | undefined,
    predicted_place: number,
    object_id: string,
    object_name: string | undefined,
    actual_place: number | undefined,
    score: number | undefined,
  ) {
    this._id = id;
    this._bet_id = bet_id;
    this._predicted_place = predicted_place;
    this._object_id = object_id;
    this._object_name = object_name;
    this._actual_place = actual_place;
    this._score = score;
  }

  public toJson(): string {
    return `{
      "id": "${this.id}",
      "bet_id": "${this.bet_id}",
      "predicted_place": "${this.predicted_place}",
      "object_id": "${this.object_id}",
      "object_name": "${this.object_name}",
      "actual_place": "${this.actual_place}",
      "score": "${this.score}"
    }`;
  }

  public static fromJson(json: any): Prediction {
    return new Prediction(
      json["id"],
      json["bet_id"],
      json["predicted_place"],
      json["object_id"],
      json["object_name"],
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

  get object_name(): string | undefined {
    return this._object_name;
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

  public hasPredictions(): boolean {
    return this._predictions.length > 0;
  }

  public hasResults(): boolean {
    return (
      this._predictions.filter((pred) => pred.actual_place != undefined)
        .length > 0 || this._score != undefined
    );
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

  public toJson(): string {
    return `{
      "id": "${this.id}",
      "user_id": "${this._user_id}",
      "predictions": [${this._predictions
        .map((pred) => pred.toJson())
        .join(",")}],
      "score": "${this.score}"
    }`;
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
