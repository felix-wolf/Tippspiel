import { Clock, Medal } from "lucide-react";
import { Event } from "../../../models/Event";
import TableList from "../../design/TableList";
import { motion } from "motion/react";

type ResultsListProps = {
  event: Event;
};

type ResultListItem = {
  place: number;
  objectName: string;
  time: string | undefined;
  behind: string | undefined;
};

export function ResultsList({ event }: ResultsListProps) {
  console.log(window.innerWidth);
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8 rounded-3xl border border-white/40 bg-white/40 backdrop-blur-md shadow-lg p-4 sm:p-6 w-full max-w-6xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Medal size={20} className="text-amber-500" />
          Ergebnisse
        </h2>
        <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-600">
          <Clock size={14} />
          Offizielle Zielzeiten
        </div>
      </div>
      <TableList
        cellHeight={"short"}
        items={event.results.map((r): ResultListItem => {
          return {
            place: r.place,
            objectName: r.object_name,
            time: r.time,
            behind: r.behind,
          };
        })}
        headers={{
          place: "Platz",
          objectName: "Name",
          time: "Zeit",
          behind: "Rückstand",
        }}
        customRenderers={{}}
        displayNextArrow={false}
        maxHeight={360}
      />
    </motion.section>
  );
}
