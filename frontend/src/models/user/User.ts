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

  private _name: string;

  constructor(
    public readonly id: string,
    name: string,
  ) {
    this._name = name;
  }

  public static create(name: string, pw: string): Promise<User> {
    const builder = (json: any): User => {
      return new User(json["id"], json["name"]);
    };
    return NetworkHelper.create(`/api/register?name=${name}&pw=${pw}`, builder);
  }

  public static login(name: string, password: string): Promise<User> {
    const builder = (json: any): User => {
      return new User(json["id"], json["name"]);
    };
    return NetworkHelper.execute(
      `/api/login?name=${name}&pw=${password}`,
      builder,
    );
  }

  public get name(): string {
    return this._name;
  }

  public set name(value: string) {
    this._name = value;
  }
}
