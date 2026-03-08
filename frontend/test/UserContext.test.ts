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
    const user = new User("user-1", "Felix", "#112233");
    user.saveToStorage();

    const loaded = loadInitialCurrentUser();

    expect(loaded?.id).toBe("user-1");
    expect(loaded?.name).toBe("Felix");
    expect(loaded?.color).toBe("#112233");
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
    expect(mapLoginError({ status: 403 })).toBe("Fehler. Backend kaputt?");
    expect(mapLoginError({ status: 404, text: "Name oder Password falsch!" })).toBe(
      "Name oder Password falsch!",
    );
    expect(mapLoginError({ status: 500 })).toBe(
      "Ein unbekannter Fehler ist aufgetreten!",
    );
  });
});
