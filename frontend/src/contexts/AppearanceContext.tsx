import React, { createContext, useContext, useState } from "react";
import { Outlet } from "react-router-dom";

type appearence = "light" | "dark";

type ContextType = {
  appearance: appearence;
  setAppearance: (appearance: appearence) => void;
  isLight: () => boolean;
};

const appearanceStorageKey = "appearance";

const AppearanceContext = createContext<ContextType>(null!);

export function useAppearance() {
  return useContext(AppearanceContext) as ContextType;
}

type AppearanceContextProviderProps = React.PropsWithChildren;

export function AppearanceContextProvider({
  children,
}: AppearanceContextProviderProps) {
  const [app, setApp] = useState<appearence>(getInitialAppearance());

  function getInitialAppearance(): appearence {
    const appearance = localStorage.getItem(appearanceStorageKey);
    if (appearance) {
      return appearance as appearence;
    }
    return "light";
  }

  function setAppearance(appearance: appearence) {
    setApp(appearance as appearence);
    localStorage.setItem(appearanceStorageKey, appearance);
  }

  function isLight(): boolean {
    return app == "light";
  }

  const contextValue = {
    appearance: app,
    setAppearance,
    isLight,
  };

  return (
    <AppearanceContext.Provider value={contextValue}>
      {children}
    </AppearanceContext.Provider>
  );
}

const AppearanceContextLayout = () => {
  return (
    <AppearanceContextProvider>
      <Outlet />
    </AppearanceContextProvider>
  );
};

export default AppearanceContextLayout;
