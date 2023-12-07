import React from "react";
import styles from "./NavPage.module.scss";
import { Button } from "../components/design/Button";
import { useNavigate } from "react-router-dom";

type NavPageProps = React.PropsWithChildren<{
  title: string | undefined;
}>;

export function NavPage({ title, children }: NavPageProps) {
  const navigate = useNavigate();
  return (
    <>
      <div className={styles.navContainer}>
        <div className={styles.button}>
          <Button
            onClick={() => navigate(-1)}
            title={"zurück"}
            width={"flexible"}
          />
        </div>
        <div className={styles.headline}>{title}</div>
      </div>
      <div className={styles.children}>{children}</div>
    </>
  );
}
