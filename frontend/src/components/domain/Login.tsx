import styles from "./Login.module.scss";
import logo from "../../assets/icons/snowflake-light.svg";
import { TextField } from "../design/TextField";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../design/Button";
import { Shakable } from "../design/Shakable";
import { cls } from "../../styles/cls";
import ReactConfetti from "react-confetti";
import { useCurrentUser, useLogin } from "../../models/user/UserContext";
import { User } from "../../models/user/User";
import { SiteRoutes, useNavigateParams } from "../../../SiteRoutes";

type Mode = "login" | "register";

export function Login() {
  const error_timeout = 3000;
  const login = useLogin();
  const navigate = useNavigateParams();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [nameShake, setNameShake] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordShake, setPasswordShake] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const u = useCurrentUser();
    if (u) {
      navigate(SiteRoutes.Home, {});
    }
  }, []);

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
    login(name, password)
      .then(() => {
        navigate(SiteRoutes.Home, {});
      })
      .catch((error) => {
        console.log(error);
        setError(error);
        setTimeout(() => setError(null), error_timeout);
      });
  }, [name, password, mode]);

  const onRegisterClick = useCallback(() => {
    User.create(name, password)
      .then((_) => {
        setConfetti(true);
        setTimeout(() => {
          setConfetti(false);
          onLoginClick();
        }, 5000);
      })
      .catch((error) => {
        setError(error);
        setTimeout(() => setError(null), error_timeout);
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
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
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
          </form>
        </div>
      </div>
    </>
  );
}
