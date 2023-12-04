import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Outlet } from "react-router-dom";
import { User } from "./User";

type UserContext = {
  current: User | null;
  login: (name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContext>(null!);

type UserContextProviderProps = React.PropsWithChildren;

export function UserContextProvider({ children }: UserContextProviderProps) {
  const [current, setCurrent] = useState<User | null>(null);
  const login = useCallback(
    async (name: string, password: string) => {
      if (current !== null) console.log("USER CURRENTLY NOT NULL");
      fetch(`/api/login?name=${name}&pw=${password}`).then((res) => {
        if (res.status == 200) {
          res.json().then((u) => {
            const user = new User(u["id"], u["name"]);
            setCurrent(user);
          });
        } else if (res.status == 404) {
          res.text().then((text) => {
            throw Error(text);
          });
        } else {
          throw Error("ein unbekannter Fehler ist aufgetreten!");
        }
      });
    },

    [current],
  );
  const logout = useCallback(async () => {
    setCurrent(null);
  }, []);

  const context = useMemo(
    () => ({ current, login, logout }),
    [current, login, logout],
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
  return current !== null;
}

/**
 * Hook to retrieve the current user. Throws an error if no user is logged in.
 */
export function useCurrentUser(): User {
  const { current } = useContext(UserContext);
  if (current === null) throw new Error("Not logged in");
  return current;
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
