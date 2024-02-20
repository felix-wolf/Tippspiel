import { NetworkHelper } from "./NetworkHelper";

export class EventScore {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _game_id: string;
  private readonly _datetime: Date;
  private readonly _scores: Map<string, number | null>;

  constructor(
    id: string,
    name: string,
    game_id: string,
    datetime: string,
    scores: Map<string, number | null>,
  ) {
    this._id = id;
    this._name = name;
    this._game_id = game_id;
    this._datetime = new Date(Date.parse(datetime.replace(/-/g, "/")));
    this._scores = scores;
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get game_id(): string {
    return this._game_id;
  }

  get datetime(): Date {
    return this._datetime;
  }

  get scores(): Map<string, number | null> {
    return this._scores;
  }

  public static buildCacheKey(gameId: string) {
    return `scores${gameId}`;
  }

  public static fromJson(json: any) {
    return new EventScore(
      json["id"],
      json["name"],
      json["game_id"],
      json["datetime"],
      new Map(Object.entries(json["scores"])),
    );
  }

  public static fetchAll(game_id: string): Promise<EventScore[]> {
    const builder = (res: any): EventScore[] => {
      return res.map((e: any) => EventScore.fromJson(e));
    };
    return NetworkHelper.fetchAll(`/api/scores?game_id=${game_id}`, builder);
  }
}
