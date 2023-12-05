import { NetworkHelper } from "../NetworkHelper";

/**
 * A user of the system.
 */
export class User {
  /**
   * On logging out, all cached instances of all model classes should be removed
   * to avoid leaking data to other users, or worse, the logged-out view. This
   * method does just that.
   */
  public static reset() {}

  private readonly _id: string;
  private _name: string;

  constructor(id: string, name: string) {
    this._id = id;
    this._name = name;
  }

  private static from_dict(d: any): User {
    return new User(d["id"], d["name"]);
  }

  public static fromJSON(d: string): User | undefined {
    try {
      const json = JSON.parse(d);
      return new User(json.id, json.name);
    } catch (e) {
      console.log("ERROR", e);
    }
  }

  public static create(name: string, pw: string): Promise<User> {
    return NetworkHelper.create(
      `/api/register?name=${name}&pw=${pw}`,
      User.from_dict,
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
      User.from_dict,
    );
  }

  public static get_current_from_backend(): Promise<User> {
    return NetworkHelper.execute("/api/current_user", User.from_dict);
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
