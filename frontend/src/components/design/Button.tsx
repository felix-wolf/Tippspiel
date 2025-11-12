import { useCallback } from "react";

type ButtonProps = {
  onClick: () => void;
  onDisabledClick?: () => void;
  title: string;
  type?: "positive" | "negative" | "neutral" | "clear";
  isEnabled?: boolean;
  icon?: React.ReactNode;
  rounded?: boolean[];
};

export function Button({
  title,
  onClick: _onClick,
  onDisabledClick: _onDisClick,
  type = "neutral",
  isEnabled = true,
  icon,
}: ButtonProps) {
  const onClick = useCallback(() => {
    if (isEnabled) {
      _onClick();
    } else if (_onDisClick) {
      _onDisClick();
    }
  }, [isEnabled, _onClick]);

  return (
    <button
      className={`
        w-full py-2 px-3 mt-2 rounded-lg transition-all duration-200 cursor-pointer
        ${!isEnabled && "bg-gray-700 text-gray-300"}
        ${isEnabled && type == "positive" && "font-semibold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-700 hover:to-blue-800 text-white"}
        ${isEnabled && type == "negative" && "font-semibold bg-gradient-to-r from-red-700 to-rose-800 hover:from-red-800 hover:to-rose-900 text-white"}
        ${isEnabled && type == "neutral" && "bg-sky-700 hover:from-red-800 hover:to-rose-900 text-white"}
        ${isEnabled && type == "clear" && "text-black bg-white/30 hover:from-red-800 hover:to-rose-900"}
        `}
      onClick={onClick}
    >
      <div className="flex items-center justify-center w-full h-full gap-2">
        {icon && icon}
        {title}
      </div>
    </button>
  );
}
