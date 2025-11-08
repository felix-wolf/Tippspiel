import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SiteRoutes } from "../SiteRoutes";
import { GamePage } from "./pages/GamePage";
import UserContextLayout from "./models/user/UserContext";
import { LoginPage } from "./pages/LoginPage.tsx";
import { HomePage } from "./pages/HomePage";
import { PlaceBetPage } from "./pages/PlaceBetPage";
import { ViewBetsPage } from "./pages/ViewBetsPage";
import AppearanceContextLayout from "./contexts/AppearanceContext.tsx";
import Debug from "./pages/Debug.tsx";
import MainLayout from "./pages/MainLayout.tsx";

/**
 * All available routes.
 * To be able to navigate to a page, the page must be registered here.
 * Certain Routes are wrapped in contexts to enable a page to access context specific data.
 */
function AppRoutes() {
  return (
    <Routes>
      <Route element={<UserContextLayout />}>
        <Route element={<AppearanceContextLayout />}>
          <Route path={SiteRoutes.Debug} element={<Debug />} />
          <Route path={SiteRoutes.Login} element={<LoginPage />} />
          <Route element={<MainLayout />}>
            <Route path={SiteRoutes.Home} element={<HomePage />} />
            <Route path={SiteRoutes.Game} element={<GamePage />} />
            <Route path={SiteRoutes.PlaceBet} element={<PlaceBetPage />} />
            <Route path={SiteRoutes.ViewBets} element={<ViewBetsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
