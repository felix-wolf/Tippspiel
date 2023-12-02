import styles from "./Login.module.scss";
import logo from "../assets/icons/snowflake-light.svg";
import { TextField } from "./TextField";
import { useCallback, useState } from "react";
import { Button } from "./Button";
import { Shakable } from "./Shakable";
import { cls } from "../styles/cls";
import ReactConfetti from "react-confetti";
import { useNavigateParams } from "../../SiteRoutes";

type Modus = "login" | "register";

export function Login() {
  const error_timeout = 3000;
  const navigate = useNavigateParams();
  const [modus, setModus] = useState<Modus>("login");
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

  const onLoginClick = useCallback(() => {
    const req = new Request(`/api/login?name=${name}&pw=${password}`);
    fetch(req).then((res) => {
      try {
        if (res.status == 200) {
          navigate("/home", {});
        } else if (res.status == 404) {
          res.text().then((text) => {
            setError(text);
            setTimeout(() => setError(null), error_timeout);
          });
        } else {
          setError("Ein unbekannter Fehler ist aufgetreten!");
          setTimeout(() => setError(null), error_timeout);
        }
      } catch (e) {
        console.log(e);
      }
    });
  }, [name, password, modus]);

  const onRegisterClick = useCallback(() => {
    const req = new Request(`/api/register?name=${name}&pw=${password}`);
    fetch(req).then((res) => {
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
      const mod = modus == "login" ? "register" : "login";
      setModus(mod);
    }
  }, [confetti, modus]);

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
          <img className={styles.logo} src={logo} />
        </div>
        <h1 className={styles.greeting}>Willkommen</h1>
        <div className={styles.login_container}>
          <div
            className={cls(error == null && styles.instructions, styles.error)}
          >
            <p>
              {error
                ? error
                : modus == "login"
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
            title={modus == "login" ? "Login" : "Register"}
            isEnabled={name != "" && password != "" && !confetti}
            onDisabledClick={onDisabledClick}
            onClick={modus == "login" ? onLoginClick : onRegisterClick}
          />
          <div className={styles.register} onClick={onModeSwitch}>
            {modus == "login" && "Noch nicht angemeldet? Hier registrieren..."}
            {modus == "register" && "Schon angemeldet? Hier einloggen..."}
          </div>
        </div>
      </div>
    </>
  );
}
