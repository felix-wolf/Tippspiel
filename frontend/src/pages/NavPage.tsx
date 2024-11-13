import React, { ReactNode } from "react";
import styles from "./NavPage.module.scss";
import { Button } from "../components/design/Button";
import { useNavigate } from "react-router-dom";
import { cls } from "../styles/cls.ts";
import { IconToggler } from "../components/design/IconToggler.tsx";
import darkModeWhite from "../assets/icons/dark_mode_white.svg";
import lightModeWhite from "../assets/icons/light_mode_white.svg";
import { useAppearance } from "../contexts/AppearanceContext.tsx";

type NavPageProps = React.PropsWithChildren<{
  title: string | undefined;
  navBarLeftItem?: ReactNode;
}>;

export function NavPage({ title, navBarLeftItem, children }: NavPageProps) {
  const navigate = useNavigate();
  const { appearance, setAppearance, isLight } = useAppearance();
  return (
    <>
      <div className={cls(styles.navContainer, `theme-${appearance}`)}>
        <div className={styles.button}>
          <Button
            onClick={() => navigate(-1)}
            title={"zurück"}
            width={"flexible"}
          />
        </div>

        <div className={styles.headline}>{title}</div>
        <div className={styles.button}>
          <IconToggler
            icons={[darkModeWhite, lightModeWhite]}
            didChange={(state) => setAppearance(state == 0 ? "light" : "dark")}
            initialState={isLight() ? 0 : 1}
          />
          {navBarLeftItem && navBarLeftItem}
        </div>
      </div>
      <div className={styles.children}>{children}</div>
    </>
  );
}
