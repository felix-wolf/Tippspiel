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
  //current: User | null;
  setCurrent: (user: User) => void;
  login: (name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContext>(null!);

type UserContextProviderProps = React.PropsWithChildren;

export function UserContextProvider({ children }: UserContextProviderProps) {
  const [current, setCurrent] = useState<User | null>(null);

  const login = useCallback(
    async (name: string, password: string) => {
      return new Promise<void>((resolve, reject) => {
        if (current !== null)
          console.log("USER CURRENTLY NOT NULL, ALREADY LOGGED IN?");
        User.login(name, password)
          .then((user) => {
            console.log(user);
            setCurrent(user);
            user.saveToStorage();
            resolve();
          })
          .catch((error) => {
            switch (error.status) {
              case 403:
                reject("Fehler. Backend kaputt?");
                break;
              case 404:
                reject(error.text);
                break;
              default:
                reject("Ein unbekannter Fehler ist aufgetreten!");
            }
            console.log(error);
            error.status;
          });
      });
    },

    [current],
  );
  const logout = useCallback(async () => {
    useCurrentUser()
      ?.logout()
      .then()
      .catch((error) => console.log("ERROR logging out", error));
    User.removeFromStorage();
    setCurrent(null);
  }, []);

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
  //const { current } = useContext(UserContext);
  return useCurrentUser() != null;
}

/**
 * Hook to retrieve the current user. Throws an error if no user is logged in.
 */
export function useCurrentUser(): User | undefined {
  return User.loadFromStorage() ?? undefined;
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
