import { BettingGameList } from "../components/lists/BettingGameList";
import { useCurrentUser, useLogout } from "../models/user/UserContext";
import { Button } from "../components/Button";
import styles from "./HomePage.module.scss";
import { useCallback, useEffect, useState } from "react";
import { User } from "../models/user/User";
import { SiteRoutes, useNavigateParams } from "../../SiteRoutes";

export function HomePage() {
  const userr = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigateParams();

  const [user, setUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    const u = useCurrentUser();
    if (u) {
      setUser(u);
    } else {
      navigate(SiteRoutes.Login, {});
    }
  }, []);

  const logoutClick = useCallback(() => {
    logout().then();
    navigate(SiteRoutes.Login, {});
  }, [user]);

  return (
    /*<MenuPage>*/
    <div className={styles.container}>
      <h3>Hallo {userr?.name}!</h3>
      <BettingGameList user={userr} show_games={"user"} />
      <BettingGameList user={userr} show_games={"other"} />
      <Button onClick={logoutClick} title={"Logout"} type={"negative"} />
    </div>
    /*</MenuPage>*/
  );
}
