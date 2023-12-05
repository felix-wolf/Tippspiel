import { User } from "./user/User";
import { NetworkHelper } from "./NetworkHelper";

export class Game {
  private _id: string;
  private _name: string;
  private _players: User[];

  private _creator?: User;

  private _hasPassword: boolean = false;

  constructor(
    id: string,
    name: string,
    players: User[],
    creator?: User,
    hasPassword: boolean = false,
  ) {
    this._id = id;
    this._name = name;
    this._players = players;
    this._hasPassword = hasPassword;
    this._creator = creator;
  }

  public static fetchOne(id: string): Promise<Game> {
    const builder = (game_dict: any): Game => {
      return new Game(
        game_dict["id"],
        game_dict["name"],
        game_dict["players"],
        game_dict["creator"],
      );
    };
    return NetworkHelper.fetchOne(`/api/game/get?id=${id}`, builder);
  }

  public static fromJson(json: any) {
    return new Game(json["id"], json["name"], json["players"], json["creator"]);
  }

  public static fetchAll(): Promise<Game[]> {
    const builder = (res: any): Game[] => {
      return res.map((game: any) => {
        return Game.fromJson(game);
      });
    };
    return NetworkHelper.fetchOne("/api/game/get", builder);
  }

  public static create(name: string, pw: string): Promise<Game> {
    const builder = (res: any): Game => {
      return Game.fromJson(res);
    };
    return NetworkHelper.create<Game>(
      `/api/game/create?name=${name}${pw}`,
      builder,
    );
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

  set id(value: string) {
    this._id = value;
  }

  set name(value: string) {
    this._name = value;
  }

  get players(): User[] {
    return this._players;
  }

  set players(value: User[]) {
    this._players = value;
  }

  get hasPassword(): boolean {
    return this._hasPassword;
  }

  get creator(): User | undefined {
    return this._creator;
  }
}
