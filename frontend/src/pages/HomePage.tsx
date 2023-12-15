import { BettingGameList } from "../components/domain/lists/BettingGameList";
import { useCurrentUser, useLogout } from "../models/user/UserContext";
import { Button } from "../components/design/Button";
import styles from "./HomePage.module.scss";
import { useCallback, useEffect, useState } from "react";
import { User } from "../models/user/User";
import { SiteRoutes, useNavigateParams } from "../../SiteRoutes";

export function HomePage() {
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
    <div className={styles.container}>
      <h3>Hallo {user?.name}!</h3>
      <BettingGameList user={user} show_games={"user"} />
      <BettingGameList user={user} show_games={"other"} />
      <Button onClick={logoutClick} title={"Logout"} type={"negative"} />
    </div>
  );
}
