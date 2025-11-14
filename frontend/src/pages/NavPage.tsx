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
      <header className={`
       w-full max-w-6xl mb-8
        flex items-center justify-between
        `}>
        <div className="min-w-18">
          <Button
            onClick={() => navigate(-1)}
            title={"Zurück"}
            type="neutral"
            icon={<ArrowLeft size={18} />}
          />
        </div>
        <h1 className={`
          text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 text-center min-w-20 max-w-2xl
        `}>
          {title}
        </h1>
        {navBarLeftItem && navBarLeftItem}
        {!navBarLeftItem && <div className="min-w-18" />}
      </header>
      {children}
    </>
  );
}
