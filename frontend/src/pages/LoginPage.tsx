import logo from "../assets/icons/snowflake-light.svg";
import { DialogModal } from "../components/design/Dialog";
import { TextField } from "../components/design/TextField";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../components/design/Button";
import { Shakable } from "../components/design/Shakable";
import ReactConfetti from "react-confetti";
import { useCurrentUser, useLogin } from "../contexts/UserContext";
import { User } from "../models/User";
import { User as UserIcon, Lock as LockIcon, Mail as MailIcon } from "lucide-react";
import { SiteRoutes, useNavigateParams } from "../../SiteRoutes";
import { NetworkHelper } from "../models/NetworkHelper";
import { motion } from "motion/react";

type Mode = "login" | "register";

export function LoginPage() {
  const login = useLogin();
  const user = useCurrentUser();
  const navigate = useNavigateParams();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [nameShake, setNameShake] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordShake, setPasswordShake] = useState(false);
  const [email, setEmail] = useState("");
  const [emailShake, setEmailShake] = useState(false);
  const [loginShake, setLoginShake] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [backendStatus, setBackendStatus] = useState("No");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailShake, setResetEmailShake] = useState(false);
  const [resetActionShake, setResetActionShake] = useState(false);
  const [resetErrorMessage, setResetErrorMessage] = useState<string | undefined>();
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | undefined>();

  useEffect(() => {
    if (user) {
      navigate(SiteRoutes.Home, {});
    }
  }, [navigate, user]);

  useEffect(() => {
    NetworkHelper.getStatus()
      .then(() => {
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
    if (mode == "register" && email.trim() == "") {
      setEmailShake(true);
      setTimeout(() => setEmailShake(false), 300);
    }
    if (password == "") {
      setPasswordShake(true);
      setTimeout(() => setPasswordShake(false), 300);
    }
  }, [email, mode, name, password]);

  const onLoginClick = useCallback(() => {
    setErrorMessage(undefined);
    login(name, password)
      .then(() => {
        navigate(SiteRoutes.Home, {});
      })
      .catch((error) => {
        setErrorMessage(String(error));
        setLoginShake(true);
        setTimeout(() => setLoginShake(false), 300);
      });
  }, [login, name, navigate, password]);

  const onRegisterClick = useCallback(() => {
    setErrorMessage(undefined);
    User.create(name, password, email)
      .then(() => {
        setConfetti(true);
        setTimeout(() => {
          setConfetti(false);
          onLoginClick();
        }, 5000);
      })
      .catch((error) => {
        setErrorMessage(error?.text ?? "Registrierung fehlgeschlagen.");
        setLoginShake(true);
        setTimeout(() => setLoginShake(false), 300);
      });
  }, [email, name, onLoginClick, password]);

  const onModeSwitch = useCallback(() => {
    if (!confetti) {
      const mod = mode == "login" ? "register" : "login";
      setMode(mod);
      setErrorMessage(undefined);
    }
  }, [confetti, mode]);

  const closeResetDialog = useCallback(() => {
    setIsResetDialogOpen(false);
    setResetErrorMessage(undefined);
    setResetSuccessMessage(undefined);
  }, []);

  const openResetDialog = useCallback(() => {
    setResetEmail(name.includes("@") ? name : "");
    setResetErrorMessage(undefined);
    setResetSuccessMessage(undefined);
    setIsResetDialogOpen(true);
  }, [name]);

  const onDisabledResetClick = useCallback(() => {
    if (resetEmail.trim() === "") {
      setResetEmailShake(true);
      setTimeout(() => setResetEmailShake(false), 300);
      return;
    }
    setResetActionShake(true);
    setTimeout(() => setResetActionShake(false), 300);
  }, [resetEmail]);

  const onPasswordResetRequest = useCallback(() => {
    if (resetEmail.trim() === "") {
      onDisabledResetClick();
      return;
    }
    setResetErrorMessage(undefined);
    User.requestPasswordReset(resetEmail)
      .then((response) => {
        setResetSuccessMessage(response.message);
      })
      .catch((error) => {
        setResetErrorMessage(
          error?.text ?? "Die Reset-Mail konnte nicht angefordert werden.",
        );
        setResetActionShake(true);
        setTimeout(() => setResetActionShake(false), 300);
      });
  }, [onDisabledResetClick, resetEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-sky-200 to-blue-400 relative overflow-hidden">
      <div className="fixed text-[10px] right-2.5 bottom-1 text-gray-500">
        Version: {import.meta.env.VITE_APP_VERSION} - Connected to backend:{" "}
        {backendStatus}
      </div>
      <DialogModal
        title="Passwort vergessen"
        subtitle="Wir schicken dir einen Reset-Link an deine hinterlegte E-Mail-Adresse."
        isOpened={isResetDialogOpen}
        onClose={closeResetDialog}
        neutralButtonTitle="Schließen"
        onNeutralClick={closeResetDialog}
        actionButtonTitle="Reset-Mail senden"
        onActionClick={onPasswordResetRequest}
        actionButtonEnabled={resetEmail.trim() !== "" && !resetSuccessMessage}
        type="enter"
        shakingActionButton={resetActionShake}
      >
        <div className="space-y-4">
          <Shakable shaking={resetEmailShake}>
            <TextField
              autoComplete={"email"}
              type={"email"}
              placeholder={"E-Mail-Adresse"}
              initialValue={resetEmail}
              onInput={(input) => setResetEmail(input)}
              icon={<MailIcon className="absolute left-3 top-3.5 text-gray-500" size={20} />}
            />
          </Shakable>
          {resetSuccessMessage && (
            <p className="text-sm leading-6 text-emerald-300">{resetSuccessMessage}</p>
          )}
          {resetErrorMessage && (
            <p className="text-sm leading-6 text-rose-300">{resetErrorMessage}</p>
          )}
        </div>
      </DialogModal>
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
              placeholder={mode == "login" ? "Nutzername oder E-Mail" : "Nutzername"}
              onInput={(input) => setName(input)}
              icon={<UserIcon className="absolute left-3 top-3.5 text-gray-500" size={20} />}
            />
          </Shakable>
          {mode == "register" && (
            <Shakable shaking={emailShake}>
              <TextField
                autoComplete={"email"}
                type={"email"}
                placeholder={"E-Mail-Adresse"}
                onInput={(input) => setEmail(input)}
                icon={<MailIcon className="absolute left-3 top-3.5 text-gray-500" size={20} />}
              />
            </Shakable>
          )}
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
              isEnabled={name != "" && password != "" && (mode == "login" || email.trim() != "") && !confetti}
              onDisabledClick={onDisabledClick}
              onClick={mode == "login" ? onLoginClick : onRegisterClick}
            />
          </Shakable>
          {errorMessage && (
            <p className="text-sm text-center text-rose-700">{errorMessage}</p>
          )}
          {mode == "login" && (
            <p className="text-sm text-center text-gray-700">
              <button
                type="button"
                className="text-sky-700 font-medium hover:underline"
                onClick={openResetDialog}
              >
                Passwort vergessen?
              </button>
            </p>
          )}
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
