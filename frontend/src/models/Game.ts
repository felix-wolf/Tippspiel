import { User } from "./user/User";
import { NetworkHelper } from "./NetworkHelper";
import { Discipline } from "./user/Discipline";

export class Game {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _players: User[];

  private readonly _creator?: User;

  private readonly _hasPassword: boolean = false;

  private readonly _events: Event[];

  private readonly _discipline: Discipline;

  constructor(
    id: string,
    name: string,
    players: User[],
    discipline: Discipline,
    creator?: User,
    hasPassword: boolean = false,
    events: Event[] = [],
  ) {
    this._id = id;
    this._name = name;
    this._players = players;
    this._hasPassword = hasPassword;
    this._creator = creator;
    this._events = events;
    this._discipline = discipline;
  }

  public static fromJson(json: any) {
    return new Game(
      json["id"],
      json["name"],
      json["players"],
      Discipline.fromJson(json["discipline"]),
      User.fromJson(json["creator"]),
      json["pw_set"],

      json["_discipline"],
    );
  }

  public static fetchOne(id: string): Promise<Game> {
    const builder = (game_dict: any): Game => {
      return Game.fromJson(game_dict);
    };
    return NetworkHelper.fetchOne(`/api/game?id=${id}`, builder);
  }

  public static fetchAll(): Promise<Game[]> {
    const builder = (res: any): Game[] => {
      return res.map((game: any) => {
        return Game.fromJson(game);
      });
    };
    return NetworkHelper.fetchOne("/api/game", builder);
  }

  public static create(
    name: string,
    discipline: string,
    pw?: string,
  ): Promise<Game> {
    const builder = (res: any): Game => {
      return Game.fromJson(res);
    };
    return NetworkHelper.create<Game>("/api/game", builder, {
      name: name,
      pw: pw,
      discipline: discipline,
    });
  }

  public static join(
    user_id: string,
    game_id: string,
    pw: string,
  ): Promise<Game> {
    const builder = (res: any): Game => {
      return Game.fromJson(res);
    };
    return NetworkHelper.execute<Game>(
      `/api/game/join?user_id=${user_id}&game_id=${game_id}${pw}`,
      builder,
    );
  }

  get name(): string {
    return this._name;
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

  get events(): Event[] {
    return this._events;
  }
}
