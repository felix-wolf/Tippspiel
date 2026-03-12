import { Clock, Medal } from "lucide-react";
import { Event } from "../../../models/Event";
import TableList, { type TableColumn } from "../../design/TableList";
import { motion } from "motion/react";

type ResultsListProps = {
  event: Event;
};

type ResultListItem = {
  id: string;
  place: string;
  objectName: string;
  time: string | undefined;
  behind: string | undefined;
  shooting?: string;
  shootingTime?: string;
};

function formatResultPlace(place: number, status: string | undefined): string {
  if (status) {
    return status;
  }
  if (place === 9999) {
    return "n. klass.";
  }
  return place.toString();
}

export function ResultsList({ event }: ResultsListProps) {
  const hasShooting = event.results.some((result) => result.shooting);
  const hasShootingTime = event.results.some((result) => result.shooting_time);
  const columns: TableColumn<ResultListItem>[] = [
    { id: "place", header: "Platz", accessor: (item) => item.place },
    { id: "objectName", header: "Name", accessor: (item) => item.objectName },
    { id: "time", header: "Zeit", accessor: (item) => item.time ?? "" },
    { id: "behind", header: "Rückstand", accessor: (item) => item.behind ?? "" },
  ];
  if (hasShooting) {
    columns.push({
      id: "shooting",
      header: "Schießfehler",
      accessor: (item) => item.shooting ?? "",
    });
  }
  if (hasShootingTime) {
    columns.push({
      id: "shootingTime",
      header: "Schießzeit",
      accessor: (item) => item.shootingTime ?? "",
    });
  }

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
          Offizielle Renndaten
        </div>
      </div>
      <TableList
        items={event.results.map((r): ResultListItem => {
          return {
            id: r.id,
            place: formatResultPlace(r.place, r.status),
            objectName: r.object_name,
            time: r.time,
            behind: r.behind,
            shooting: r.shooting,
            shootingTime: r.shooting_time,
          };
        })}
        columns={columns}
        getRowKey={(item) => item.id}
        maxHeight={360}
      />
    </motion.section>
  );
}
