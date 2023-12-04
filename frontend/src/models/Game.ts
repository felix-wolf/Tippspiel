import { User } from "./user/User";

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
