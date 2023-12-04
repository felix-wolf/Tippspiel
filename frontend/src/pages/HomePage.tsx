import { MenuPage } from "./MenuPage";
import { BettingGames } from "../components/BettingGames";
import { useCurrentUser, useLogout } from "../models/user/UserContext";
import { Button } from "../components/Button";
import styles from "./HomePage.module.scss";

export function HomePage() {
  const user = useCurrentUser();
  const logout = useLogout();

  return (
    <MenuPage>
      <div className={styles.container}>
        <h3>Hallo {user.name}!</h3>
        <BettingGames user={user} show_games={"user"} />
        <BettingGames user={user} show_games={"other"} />
        <Button onClick={logout} title={"Logout"} type={"negative"} />
      </div>
    </MenuPage>
  );
}
