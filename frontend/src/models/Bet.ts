export class Placement {
  private _predicted_place: number;
  private _object_id: string;
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
}

type Placements = readonly [
  Placement,
  Placement,
  Placement,
  Placement,
  Placement,
];

export class Bet {
  private _user_id: string;
  private _placements: Placements;

  constructor(user_id: string, placements: Placements) {
    this._user_id = user_id;
    this._placements = placements;
  }
}
