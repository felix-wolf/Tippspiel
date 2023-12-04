import { LoginPage } from "./LoginPage";
import { HomePage } from "./HomePage";
import { useIsLoggedIn, useLogin } from "../models/user/UserContext";
import { useEffect } from "react";

export function Main() {
  const login = useLogin();

  useEffect(() => {
    login("felix", "felix");
  }, []);

  const isLoggedIn = useIsLoggedIn();

  if (!isLoggedIn) return <LoginPage />;

  return <HomePage />;
}
