import { beforeEach, describe, expect, it } from "vitest";
import { User } from "../src/models/user/User";
import {
  loadInitialCurrentUser,
  mapLoginError,
  syncCurrentUserStorage,
} from "../src/models/user/UserContext";

class LocalStorageMock {
  private store = new Map<string, string>();

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }

  get length() {
    return this.store.size;
  }
}

describe("UserContext auth helpers", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: new LocalStorageMock(),
      configurable: true,
      writable: true,
    });
  });

  it("loads the initial user from storage", () => {
    const user = new User("user-1", "Felix", "#112233", true);
    user.saveToStorage();

    const loaded = loadInitialCurrentUser();

    expect(loaded?.id).toBe("user-1");
    expect(loaded?.name).toBe("Felix");
    expect(loaded?.color).toBe("#112233");
    expect(loaded?.isAdmin).toBe(true);
  });

  it("syncs a current user into storage", () => {
    const user = new User("user-2", "Nina", "#445566");

    syncCurrentUserStorage(user);

    expect(User.loadFromStorage()?.id).toBe("user-2");
    expect(User.loadFromStorage()?.color).toBe("#445566");
  });

  it("removes the stored user when current becomes null", () => {
    const user = new User("user-3", "Mika", "#778899");
    syncCurrentUserStorage(user);

    syncCurrentUserStorage(null);

    expect(User.loadFromStorage()).toBeNull();
  });

  it("maps backend login errors to user-facing messages", () => {
    expect(mapLoginError({ status: 403 })).toBe("Du bist für diese Aktion nicht berechtigt.");
    expect(mapLoginError({ status: 401, text: "Benutzername oder Passwort ist falsch." })).toBe(
      "Benutzername oder Passwort ist falsch.",
    );
    expect(mapLoginError({ status: 409, text: "Dieser Benutzername ist bereits vergeben." })).toBe(
      "Dieser Benutzername ist bereits vergeben.",
    );
    expect(mapLoginError({ status: 500 })).toBe(
      "Es ist ein unbekannter Fehler aufgetreten.",
    );
  });
});
