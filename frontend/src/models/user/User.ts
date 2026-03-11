import { NetworkHelper } from "../NetworkHelper";
import { Utils } from "../../utils";

/**
 * A user of the system.
 */
export class User {
  private static storageKey = "user";

  private readonly _id: string;
  private readonly _name: string;
  private readonly _color: string | undefined;
  private readonly _isAdmin: boolean;

  constructor(id: string, name: string, color: string | undefined, isAdmin: boolean = false) {
    this._id = id;
    this._name = name;
    this._color = color;
    this._isAdmin = isAdmin;
  }

  public static fromJson(d: any): User {
    return new User(d["id"], d["name"], d["color"], Boolean(d["is_admin"]));
  }

  public static create(name: string, password: string): Promise<User> {
    return NetworkHelper.post("/api/register", User.fromJson, {
      name: name,
      password: password,
    });
  }

  public logout(): Promise<void> {
    return NetworkHelper.execute("/api/logout", (_: any) => {});
  }

  public toJson(): string {
    return `{"id": "${this._id}", "name": "${this.name}", "color": "${this.color}", "is_admin": ${this.isAdmin}}`;
  }

  public static login(name: string, password: string): Promise<User> {
    return NetworkHelper.post(`/api/login`, User.fromJson, {
      name: name,
      password: password,
    });
  }

  public static get_current_from_backend(): Promise<User> {
    return NetworkHelper.execute("/api/user", User.fromJson);
  }

  public static updateColor(color: string): Promise<User> {
    return NetworkHelper.post("/api/user", User.fromJson, {
      color: color,
    });
  }

  public saveToStorage() {
    localStorage.setItem(User.storageKey, this.toJson());
  }

  public static loadFromStorage(): User | null {
    const storageString = localStorage.getItem(User.storageKey);
    if (storageString) {
      const user = User.fromJson(JSON.parse(storageString));
      if (user) return user;
    }
    return null;
  }

  public static removeFromStorage() {
    localStorage.removeItem(User.storageKey);
  }

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get color(): string {
    return this._color ?? Utils.getColorFromId(this.id);
  }

  public get isAdmin(): boolean {
    return this._isAdmin;
  }
}
