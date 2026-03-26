import { Outlet } from "react-router-dom";
import { RecoveryEmailPrompt } from "../components/domain/RecoveryEmailPrompt";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-200 to-blue-400 flex flex-col items-center justify-start py-10 px-4">
      <RecoveryEmailPrompt />
      <Outlet />
    </div>
  );
}
