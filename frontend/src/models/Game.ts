import { User } from "./user/User";
import { NetworkHelper } from "./NetworkHelper";
import { Discipline } from "./user/Discipline";
import { Event } from "./Event.ts";

export class Game {
  private readonly _id: string;
  private _name: string;
  private readonly _players: User[];
  private readonly _creator?: User;
  private readonly _hasPassword: boolean = false;
  private readonly _discipline: Discipline;

  constructor(
    id: string,
    name: string,
    players: User[],
    discipline: Discipline,
    creator?: User,
    hasPassword: boolean = false,
  ) {
    this._id = id;
    this._name = name;
    this._players = players;
    this._hasPassword = hasPassword;
    this._creator = creator;
    this._discipline = discipline;
  }

  public static fromJson(json: any) {
    return new Game(
      json["id"],
      json["name"],
      json["players"].map((j: any) => User.fromJson(j)),
      Discipline.fromJson(json["discipline"]),
      User.fromJson(json["creator"]),
      json["pw_set"],
    );
  }

  public static buildCacheKey(gameId: string) {
    return `game${gameId}`;
  }

  public static fetchOne(id: string): Promise<Game> {
    return NetworkHelper.fetchOne(`/api/game?id=${id}`, Game.fromJson);
  }

  public static fetchAll(): Promise<Game[]> {
    const builder = (res: any): Game[] => {
      return res.map((game: any) => Game.fromJson(game));
    };
    return NetworkHelper.fetchOne("/api/game", builder);
  }

  public static create(
    name: string,
    discipline: string,
    password?: string,
  ): Promise<Game> {
    return NetworkHelper.post<Game>("/api/game", Game.fromJson, {
      name: name,
      password: password,
      discipline: discipline,
    });
  }

  public static join(
    user_id: string,
    game_id: string,
    pw: string,
  ): Promise<Game> {
    return NetworkHelper.execute<Game>(
      `/api/game/join?user_id=${user_id}&game_id=${game_id}${pw}`,
      Game.fromJson,
    );
  }

  public static fetchNumEvents(game_id: any): Promise<number> {
    return NetworkHelper.fetchOne(
      `/api/game/num_events?game_id=${game_id}`,
      (dict: any) => dict["num_events"],
    );
  }

  public delete(): Promise<boolean> {
    return NetworkHelper.execute(
      `/api/game/delete?game_id=${this._id}`,
      () => true,
    );
  }

  public processUrlForEvents(url: string): Promise<Event[]> {
    const builder = (res: any): Event[] => {
      return res.map((event: any) => Event.fromJson(event));
    };
    return NetworkHelper.fetchAll(
      `/api/game/events?game_id=${this._id}&url=${encodeURIComponent(url)}`,
      builder,
    );
  }

  public saveNewName(newName: string): Promise<Game> {
    return NetworkHelper.update(
      `/api/game/update?game_id=${this._id}`,
      Game.fromJson,
      {
        game_id: this._id,
        name: newName,
      },
    );
  }

  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
  }

  get id(): string {
    return this._id;
  }

  get players(): User[] {
    return this._players;
  }

  get hasPassword(): boolean {
    return this._hasPassword;
  }

  get creator(): User | undefined {
    return this._creator;
  }

  get discipline(): Discipline {
    return this._discipline;
  }
}
