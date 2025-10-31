import React, { ReactNode } from "react";
import { Button } from "../components/design/Button";
import { useNavigate } from "react-router-dom";

type NavPageProps = React.PropsWithChildren<{
  title: string | undefined;
  navBarLeftItem?: ReactNode;
}>;

export function NavPage({ title, navBarLeftItem, children }: NavPageProps) {
  const navigate = useNavigate();
  return (
    <>
      {/* Header */}
      <header className="flex justify-between items-center w-full max-w-6xl mb-8">
        <div className="">
          <Button
            onClick={() => navigate(-1)}
            title={"Zurück"}
            type="neutral"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 text-center">
          {title}
        </h1>
        {navBarLeftItem && navBarLeftItem}
      </header>
      {children}
    </>
  );
}
