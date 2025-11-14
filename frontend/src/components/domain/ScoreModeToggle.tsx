// src/components/ScoreModeToggle.tsx
import { motion } from "framer-motion";
import React from "react";

export type ToggleType = {
    id: string;
    label: string;
    Icon: React.ComponentType<any>
}

type Props = {
  initialMode: ToggleType;
  onChange: (next: ToggleType) => void;
  className?: string;
  items: ToggleType[];
};

export default function ScoreModeToggle({ initialMode, onChange, className, items }: Props) {

  return (
    <div
      role="radiogroup"
      aria-label="Score-Ansicht"
      className={`inline-flex items-center gap-1 rounded-2xl bg-white/60 backdrop-blur-md border border-white/60 shadow-sm p-1 ${className ?? ""}`}
    >
      <div className="relative grid grid-cols-2">
        {/* animated thumb */}
        <motion.span
          layout
          layoutId="score-mode-thumb"
          className="absolute inset-y-1 left-1 right-1 rounded-xl bg-sky-600/90"
          style={{
            width: "calc(50% - 4px)",
            translateX: initialMode === items[1] ? "100%" : "0%",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          aria-hidden
        />

        {items.map(({ id, label, Icon }) => {
          const active = initialMode.id === id;
          return (
            <button
              key={id}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(items.find((item) => item.id === id)!)}
              className={`relative z-10 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition
                ${active ? "text-white" : "text-slate-700 hover:text-slate-900"}`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
