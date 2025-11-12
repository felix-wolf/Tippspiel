import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";

export type TogglerItem = {
  name?: string;
  nameComponent?: React.ReactNode;
  component?: React.ReactNode;
  highlight?: boolean;
  isEnabled?: boolean
};

type TogglerProps = {
  initialIndex?: number;
  items: TogglerItem[];
  highlight?: boolean;
  didSelect?: (item: TogglerItem) => void;
  sharedContent?: React.ReactNode;
};

type TogglerItemProps = {
  component: React.ReactNode;
};

function TogglerItem({ component }: TogglerItemProps) {
  return <>{component}</>;
}

export function Toggler({
  items,
  initialIndex = 0,
  didSelect: _didSelect,
  highlight = true,
}: TogglerProps) {
  const [itemIndex, setItemIndex] = useState(initialIndex);
  return (<>
  <div className="w-full flex flex-row justify-center px-2">
    <div className="flex items-center bg-white/40 backdrop-blur-md border border-white/40 rounded-xl shadow-sm  my-3">
      {items.map((item, index) => (
        <button
          className={`
            flex items-center gap-2 px-5 py-2 font-medium transition rounded-xl
            ${highlight && itemIndex == index && "bg-sky-600 text-white"}
            ${highlight && itemIndex != index && "text-gray-700 hover:bg-white/50"}
            ${!item.isEnabled && "text-gray-400"}
            `}
          key={index}
          onClick={() => {
            if (item.isEnabled) {
              setItemIndex(index);
              if (_didSelect) {
                _didSelect(items[index]);
              }
            }
          }}
        >
          {item.nameComponent ? item.nameComponent : item.name}
        </button>
      ))}
    </div>
    </div>
    { /* Render selected item */}
    {items.filter((item) => item.component != null).length != 0 && (
      <motion.section
        className="w-full max-w-6xl backdrop-blur-md bg-white/40 border border-white/40 rounded-3xl shadow-lg p-6 mb-8"
        layout
      >
        <AnimatePresence mode="wait">
          {items.map(
            (item, index) =>
              itemIndex == index && (
                <motion.div
                  key="graph"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <TogglerItem key={index} component={item.component} />
                </motion.div>
              )
          )}
        </AnimatePresence>
      </motion.section>
    )
    }
  </>
  );
}