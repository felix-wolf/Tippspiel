import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Outlet } from "react-router-dom";
import { User } from "./User";

type LoginError = {
  status?: number;
  text?: string;
};

type UserContext = {
  current: User | null;
  setCurrent: (user: User | null) => void;
  login: (name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContext>(null!);

type UserContextProviderProps = React.PropsWithChildren;

export function loadInitialCurrentUser(): User | null {
  return User.loadFromStorage();
}

export function syncCurrentUserStorage(current: User | null): void {
  if (current) {
    current.saveToStorage();
    return;
  }
  User.removeFromStorage();
}

export function mapLoginError(error: LoginError): string {
  switch (error.status) {
    case 403:
      return "Fehler. Backend kaputt?";
    case 404:
      return error.text ?? "Ein unbekannter Fehler ist aufgetreten!";
    default:
      return "Ein unbekannter Fehler ist aufgetreten!";
  }
}

export function UserContextProvider({ children }: UserContextProviderProps) {
  const [current, setCurrent] = useState<User | null>(loadInitialCurrentUser);

  useEffect(() => {
    syncCurrentUserStorage(current);
  }, [current]);

  const login = useCallback(
    async (name: string, password: string) => {
      return new Promise<void>((resolve, reject) => {
        if (current !== null)
          console.log("USER CURRENTLY NOT NULL, ALREADY LOGGED IN?");
        User.login(name, password)
          .then((user) => {
            setCurrent(user);
            resolve();
          })
          .catch((error) => {
            reject(mapLoginError(error));
            console.log(error);
            error.status;
          });
      });
    },

    [current],
  );
  const logout = useCallback(async () => {
    current
      ?.logout()
      .then()
      .catch((error) => console.log("ERROR logging out", error));
    setCurrent(null);
  }, [current]);

  const context = useMemo(
    () => ({ current, setCurrent, login, logout }),
    [current, setCurrent, login, logout],
  );

  return (
    <UserContext.Provider value={context}>{children}</UserContext.Provider>
  );
}

/**
 * Hook to determine whether a user is currently logged in.
 */
export function useIsLoggedIn(): boolean {
  const { current } = useContext(UserContext);
  return current != null;
}

/**
 * Hook to retrieve the current user. Throws an error if no user is logged in.
 */
export function useCurrentUser(): User | undefined {
  const { current } = useContext(UserContext);
  return current ?? undefined;
}

export function useSetCurrentUser(): (user: User | null) => void {
  const { setCurrent } = useContext(UserContext);
  return setCurrent;
}

/**
 * This hook returns a function that can be used to log in a user with
 * the given credentials.
 */
export function useLogin(): (name: string, password: string) => Promise<void> {
  const { login } = useContext(UserContext);
  return login;
}

/**
 * This hook returns a function that can be used to log out the current user.
 */
export function useLogout(): () => Promise<void> {
  const { logout } = useContext(UserContext);
  return logout;
}

const UserContextLayout = () => {
  return (
    <UserContextProvider>
      <Outlet />
    </UserContextProvider>
  );
};

export default UserContextLayout;
