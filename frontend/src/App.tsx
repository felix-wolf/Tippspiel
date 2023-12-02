import { LoginPage } from "./pages/LoginPage";
import "./styles/main.scss";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { SiteRoutes } from "../SiteRoutes";

/**
 * All available routes.
 * To be able to navigate to a page, the page must be registered here.
 * Certain Routes are wrapped in contexts to enable a page to access context specific data.
 */
function AppRoutes() {
  return (
    <Routes>
      <Route path={SiteRoutes.Login} element={<LoginPage />} />
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
