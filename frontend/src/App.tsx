import "./styles/main.scss";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SiteRoutes } from "../SiteRoutes";
import { GamePage } from "./pages/GamePage";
import UserContextLayout from "./models/user/UserContext";
import { Login } from "./components/domain/Login";
import { HomePage } from "./pages/HomePage";
import { PlaceBetPage } from "./pages/PlaceBetPage";
import { ViewBetsPage } from "./pages/ViewBetsPage";
import AppearanceContextLayout from "./contexts/AppearanceContext.tsx";

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
          <Route path={SiteRoutes.Login} element={<Login />} />
          <Route path={SiteRoutes.Home} element={<HomePage />} />
          <Route path={SiteRoutes.Game} element={<GamePage />} />
          <Route path={SiteRoutes.PlaceBet} element={<PlaceBetPage />} />
          <Route path={SiteRoutes.ViewBets} element={<ViewBetsPage />} />
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
