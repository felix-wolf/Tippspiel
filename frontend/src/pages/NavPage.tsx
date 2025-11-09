import React, { ReactNode } from "react";
import { Button } from "../components/design/Button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { col } from "motion/react-client";

type NavPageProps = React.PropsWithChildren<{
  title: string | ReactNode | undefined;
  navBarLeftItem?: ReactNode;
}>;

export function NavPage({ title, navBarLeftItem, children }: NavPageProps) {
  const navigate = useNavigate();
  return (
    <>
      {/* Header */}
      <header className={`
       w-full max-w-6xl mb-8
        ${navBarLeftItem && "flex items-center justify-between"}
        ${!navBarLeftItem && "grid grid-cols-10 items-center"}
        `}>
        <div>
          <Button
            onClick={() => navigate(-1)}
            title={"Zurück"}
            type="neutral"
            icon={<ArrowLeft size={18} />}
          />
        </div>
        <h1 className={`
          text-2xl sm:text-3xl font-semibold text-gray-800 text-center
          ${!navBarLeftItem && "col-span-8"}
        `}>
          {title}
        </h1>
        {navBarLeftItem && navBarLeftItem}
      </header>
      {children}
    </>
  );
}
