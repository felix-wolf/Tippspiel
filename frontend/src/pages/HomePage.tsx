import { useEffect, useState } from "react";
import { MenuPage } from "./MenuPage";
import { BettingGames } from "../components/BettingGames";

export function HomePage() {
  const [current_user, setCurrent_user] = useState("");

  useEffect(() => {
    fetch("/api/current_user").then((res) =>
      res.json().then((data) => {
        setCurrent_user(data["name"]);
      }),
    );
  }, [current_user]);

  return (
    <MenuPage>
      <p>Hallo {current_user}!</p>
      <BettingGames />
    </MenuPage>
  );
}
