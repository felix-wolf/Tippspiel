import styles from "./Login.module.scss";
import logo from "../assets/icons/snowflake-light.svg";
import { TextField } from "./TextField";
import { useCallback, useState } from "react";
import { Button } from "./Button";
import { Shakable } from "./Shakable";
import { cls } from "../styles/cls";
import ReactConfetti from "react-confetti";
import { useLogin } from "../models/user/UserContext";

type Mode = "login" | "register";

export function Login() {
  const error_timeout = 3000;
  const login = useLogin();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [nameShake, setNameShake] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordShake, setPasswordShake] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const onLoginClick = useCallback(async () => {
    try {
      await login(name, password);
    } catch (e) {
      setError(e.text);
      setTimeout(() => setError(null), error_timeout);
    }
  }, [name, password, mode]);

  const onRegisterClick = useCallback(() => {
    fetch(`/api/register?name=${name}&pw=${password}`).then((res) => {
      try {
        if (res.status == 200) {
          setConfetti(true);
          setTimeout(() => {
            setConfetti(false);
            onLoginClick();
          }, 5000);
        } else {
          res.text().then((error_text) => {
            setError(error_text);
          });
          setTimeout(() => setError(null), error_timeout);
        }
      } catch (e) {
        console.log(e);
      }
    });
  }, [name, password]);

  const onModeSwitch = useCallback(() => {
    if (!confetti) {
      setError(null);
      const mod = mode == "login" ? "register" : "login";
      setMode(mod);
    }
  }, [confetti, mode]);

  return (
    <>
      {confetti && (
        <ReactConfetti
          colors={["#1D3557", "#457B9D"]}
          numberOfPieces={200}
          recycle={false}
        />
      )}
      <div className={styles.container}>
        <div className={styles.logo_container}>
          <img alt={"the logo"} className={styles.logo} src={logo} />
        </div>
        <h1 className={styles.greeting}>Willkommen</h1>
        <div className={styles.login_container}>
          <div
            className={cls(error == null && styles.instructions, styles.error)}
          >
            <p>
              {error
                ? error
                : mode == "login"
                  ? "Einloggen..."
                  : "Registrieren..."}
            </p>
          </div>
          <Shakable shaking={nameShake}>
            <TextField
              type={"text"}
              placeholder={"Nutzername"}
              onInput={(input) => setName(input)}
            />
          </Shakable>
          <Shakable shaking={passwordShake}>
            <TextField
              type={"password"}
              placeholder={"Passwort"}
              onInput={(input) => setPassword(input)}
            />
          </Shakable>
          <Button
            type={"positive"}
            title={mode == "login" ? "Login" : "Register"}
            isEnabled={name != "" && password != "" && !confetti}
            onDisabledClick={onDisabledClick}
            onClick={mode == "login" ? onLoginClick : onRegisterClick}
          />
          <div className={styles.register} onClick={onModeSwitch}>
            {mode == "login" && "Noch nicht angemeldet? Hier registrieren..."}
            {mode == "register" && "Schon angemeldet? Hier einloggen..."}
          </div>
        </div>
      </div>
    </>
  );
}
