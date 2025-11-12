import logo from "../assets/icons/snowflake-light.svg";
import { TextField } from "../components/design/TextField";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../components/design/Button";
import { Shakable } from "../components/design/Shakable";
import ReactConfetti from "react-confetti";
import { useCurrentUser, useLogin } from "../models/user/UserContext";
import { User } from "../models/user/User";
import { User as UserIcon, Lock as LockIcon } from "lucide-react";
import { SiteRoutes, useNavigateParams } from "../../SiteRoutes";
import { NetworkHelper } from "../models/NetworkHelper";
import { motion } from "motion/react";

type Mode = "login" | "register";

export function LoginPage() {
  const login = useLogin();
  const navigate = useNavigateParams();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [nameShake, setNameShake] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordShake, setPasswordShake] = useState(false);
  const [loginShake, setLoginShake] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [backendStatus, setBackendStatus] = useState("No");

  useEffect(() => {
    const u = useCurrentUser();
    if (u) {
      navigate(SiteRoutes.Home, {});
    }
  }, []);

  useEffect(() => {
    NetworkHelper.getStatus()
      .then((_) => {
        setBackendStatus("Yes");
      })
      .catch((error) => {
        console.log(error);
        setBackendStatus("No");
      });
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
        setLoginShake(true);
        setTimeout(() => setLoginShake(false), 300);
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
      .catch(() => {
        setLoginShake(true);
        setTimeout(() => setLoginShake(false), 300);
      });
  }, [name, password]);

  const onModeSwitch = useCallback(() => {
    if (!confetti) {
      const mod = mode == "login" ? "register" : "login";
      setMode(mod);
    }
  }, [confetti, mode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-sky-200 to-blue-400 relative overflow-hidden">
      <div className="fixed text-[10px] right-2.5 bottom-1 text-gray-500">
        Version: {import.meta.env.VITE_APP_VERSION} - Connected to backend:{" "}
        {backendStatus}
      </div>
      {confetti && (
        <ReactConfetti
          colors={["#1D3557", "#457B9D"]}
          numberOfPieces={200}
          recycle={false}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="backdrop-blur-lg bg-white/30 border border-white/40 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-4"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="text-sky-700 mb-3">
            <img alt={"the logo"} className="w-25 animate-[spin_5s_ease-in-out_infinite]" src={logo} />
          </div>
          <h1 className="text-3xl font-semibold text-gray-800 text-center">Willkommen</h1>
          <p className="text-gray-600 text-sm mt-1">Tritt an - wer trifft, gewinnt.</p>
        </div>
        <form className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <Shakable shaking={nameShake}>
            <TextField
              autoComplete={"username"}
              type={"text"}
              placeholder={"Nutzername"}
              onInput={(input) => setName(input)}
              icon={<UserIcon className="absolute left-3 top-3.5 text-gray-500" size={20} />}
            />
          </Shakable>
          <Shakable shaking={passwordShake}>

            <TextField
              autoComplete={"current-password"}
              type={"password"}
              placeholder={"Passwort"}
              onInput={(input) => setPassword(input)}
              icon={<LockIcon className="absolute left-3 top-3.5 text-gray-500" size={20} />}
            />

          </Shakable>
          <Shakable shaking={loginShake}>
            <Button
              type={"positive"}
              title={mode == "login" ? "Login" : "Register"}
              isEnabled={name != "" && password != "" && !confetti}
              onDisabledClick={onDisabledClick}
              onClick={mode == "login" ? onLoginClick : onRegisterClick}
            />
          </Shakable>
          <p className="text-sm text-center mt-6 text-gray-700" >
            {mode == "login" && "Noch kein Konto? "}
            {mode == "register" && "Du hast bereits ein Konto? "}
            <a
              className="text-sky-700 font-medium hover:underline" onClick={onModeSwitch}
            >
              {mode == "login" && "Jetzt registrieren"}
              {mode == "register" && "Hier anmelden"}
            </a>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
