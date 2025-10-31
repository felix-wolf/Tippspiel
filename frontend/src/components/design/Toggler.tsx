import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";


export type TogglerItem = {
  name?: string;
  nameComponent?: React.ReactNode;
  component?: React.ReactNode;
  highlight?: boolean;
};

type TogglerProps = {
  initialIndex?: number;
  items: TogglerItem[];
  highlight?: boolean;
  didSelect?: (item: TogglerItem) => void;
  sharedContent?: React.ReactNode
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
    <div className="flex items-center bg-white/40 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm overflow-hidden mb-6">
      {items.map((item, index) => (
        <button
          className={`flex items-center gap-2 px-5 py-2 font-medium transition ${itemIndex == index ? "bg-sky-600 text-white" : "text-gray-700 hover:bg-white/50"
            }`}
          key={index}
          onClick={() => {
            setItemIndex(index);
            if (_didSelect) {
              _didSelect(items[index]);
            }
          }}
        >
          {item.nameComponent ? item.nameComponent : item.name}
        </button>
      ))}
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
              ),
          )}
        </AnimatePresence>
      </motion.section>
    )
    }
  </>
  );
}
