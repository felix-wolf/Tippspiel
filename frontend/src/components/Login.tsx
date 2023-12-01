import styles from "./Login.module.scss";
import logo from "../assets/icons/react.svg";
import { TextField } from "./TextField";
import { useCallback, useState } from "react";
import { Button } from "./Button";

export function Login() {
  const [name, setName] = useState("");
  const [nameShake, setNameShake] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordShake, setPasswordShake] = useState(false);
  const onDisabledClick = useCallback(() => {
    if (name == "") {
      setNameShake(true);
      setTimeout(() => setNameShake(false), 300);
    }
    if (password == "") {
      setPasswordShake(true);
      setTimeout(() => setPasswordShake(false), 300);
    }
  }, [name, password]);

  const onLoginClick = useCallback(() => {
    fetch("/api/time").then((res) => {
      try {
        console.log(res.status);
        if (res.status == 200) {
          res.json().then((data) => {
            setName(data["Time"]);
          });
        }
      } catch (e) {
        console.log(e);
      }
    });
  }, [name, password]);

  return (
    <div className={styles.container}>
      <div className={styles.logo_container}>
        <img className={styles.logo} src={logo} />
      </div>
      <h1 className={styles.greeting}>Willkommen</h1>
      <div className={styles.login_container}>
        <TextField
          shaking={nameShake}
          type={"text"}
          placeholder={"Nutzername"}
          onInput={(input) => setName(input)}
        />
        <TextField
          type={"password"}
          shaking={passwordShake}
          placeholder={"Passwort"}
          onInput={(input) => setPassword(input)}
        />
        <Button
          type={"positive"}
          title={"Login"}
          isEnabled={name != "" && password != ""}
          onDisabledClick={onDisabledClick}
          onClick={onLoginClick}
        />
      </div>
    </div>
  );
}
