import { NetworkHelper } from "./NetworkHelper";
import { Utils } from "../utils";

type PasswordResetResponse = {
  message: string;
};

/**
 * A user of the system.
 */
export class User {
  private static storageKey = "user";

  private readonly _id: string;
  private readonly _name: string;
  private readonly _color: string | undefined;
  private readonly _isAdmin: boolean;
  private readonly _email: string | undefined;

  constructor(
    id: string,
    name: string,
    color: string | undefined,
    isAdmin: boolean = false,
    email?: string,
  ) {
    this._id = id;
    this._name = name;
    this._color = color;
    this._isAdmin = isAdmin;
    this._email = email;
  }

  public static fromJson(d: Record<string, unknown>): User {
    return new User(
      String(d["id"]),
      String(d["name"]),
      typeof d["color"] === "string" ? d["color"] : undefined,
      Boolean(d["is_admin"]),
      typeof d["email"] === "string" ? d["email"] : undefined,
    );
  }

  public static create(name: string, password: string, email?: string): Promise<User> {
    return NetworkHelper.post("/api/register", User.fromJson, {
      name: name,
      password: password,
      email: email,
    });
  }

  public logout(): Promise<void> {
    return NetworkHelper.execute("/api/logout", () => undefined);
  }

  public toStoragePayload() {
    return {
      id: this._id,
      name: this.name,
      color: this.color,
      is_admin: this.isAdmin,
      email: this.email,
    };
  }

  public static login(identifier: string, password: string): Promise<User> {
    return NetworkHelper.post(`/api/login`, User.fromJson, {
      name: identifier,
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

  public static updateEmail(email: string): Promise<User> {
    return NetworkHelper.post("/api/user/email", User.fromJson, {
      email: email,
    });
  }

  public static requestPasswordReset(email: string): Promise<PasswordResetResponse> {
    return NetworkHelper.post(
      "/api/password-reset/request",
      (payload: Record<string, unknown>) => ({
        message: String(payload["message"] ?? ""),
      }),
      { email: email },
    );
  }

  public static confirmPasswordReset(
    token: string,
    password: string,
  ): Promise<PasswordResetResponse> {
    return NetworkHelper.post(
      "/api/password-reset/confirm",
      (payload: Record<string, unknown>) => ({
        message: String(payload["message"] ?? ""),
      }),
      { token: token, password: password },
    );
  }

  public saveToStorage() {
    localStorage.setItem(User.storageKey, JSON.stringify(this.toStoragePayload()));
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

  public get email(): string | undefined {
    return this._email;
  }
}
