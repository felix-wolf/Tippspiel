import React, { ReactNode } from "react";
import { Button } from "../components/design/Button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

type NavPageProps = React.PropsWithChildren<{
  title: string | ReactNode | undefined;
  navBarLeftItem?: ReactNode;
}>;

export function NavPage({ title, navBarLeftItem, children }: NavPageProps) {
  const navigate = useNavigate();
  return (
    <>
      {/* Header */}
      <header className="w-full max-w-6xl mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
          <Button
            onClick={() => navigate(-1)}
            title={"Zurück"}
            type="neutral"
            icon={<ArrowLeft size={18} />}
          />
          {navBarLeftItem && <div className="sm:hidden">{navBarLeftItem}</div>}
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 text-center w-full max-w-2xl break-words">
          {title}
        </h1>
        {navBarLeftItem && <div className="hidden sm:block sm:w-auto sm:shrink-0">{navBarLeftItem}</div>}
        {!navBarLeftItem && <div className="hidden sm:block sm:w-18 sm:shrink-0" />}
      </header>
      {children}
    </>
  );
}
