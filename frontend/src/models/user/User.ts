import { NetworkHelper } from "../NetworkHelper";

/**
 * A user of the system.
 */
export class User {
  private readonly _id: string;
  private _name: string;

  constructor(id: string, name: string) {
    this._id = id;
    this._name = name;
  }

  public static fromJson(d: any): User {
    return new User(d["id"], d["name"]);
  }

  public static create(name: string, pw: string): Promise<User> {
    return NetworkHelper.create(
      `/api/register?name=${name}&pw=${pw}`,
      User.fromJson,
    );
  }

  public logout(): Promise<void> {
    return NetworkHelper.execute("/api/logout", (_: any) => {});
  }

  public toJson(): string {
    return `{"id": "${this._id}", "name": "${this.name}"}`; //JSON.stringify(this);
  }

  public static login(name: string, password: string): Promise<User> {
    return NetworkHelper.execute(
      `/api/login?name=${name}&pw=${password}`,
      User.fromJson,
    );
  }

  public static get_current_from_backend(): Promise<User> {
    return NetworkHelper.execute("/api/current_user", User.fromJson);
  }

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public set name(value: string) {
    this._name = value;
  }
}
