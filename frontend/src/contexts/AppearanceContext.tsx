import React, { createContext, useContext } from "react";
import { Outlet } from "react-router-dom";

type appearence = "light" | "dark";

type ContextType = {
  getAppearance: () => appearence;
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
  function getAppearance(): appearence {
    const appearance = localStorage.getItem(appearanceStorageKey);
    if (appearance) {
      console.log("Appearance found");
      return appearance as appearence;
    }
    console.log("Appearance not found");
    setAppearance("light");
    return "light";
  }

  function setAppearance(appearance: appearence) {
    console.log("Appearance set", appearance);
    localStorage.setItem(appearanceStorageKey, appearance);
  }

  function isLight(): boolean {
    return getAppearance() == "light";
  }

  const contextValue = {
    getAppearance,
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
