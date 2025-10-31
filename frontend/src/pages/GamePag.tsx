// src/pages/GamePage.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Trophy, Calendar, Table as TableIcon } from "lucide-react";

export default function GamePage() {
  const [view, setView] = useState<"graph" | "table">("graph");

  const mockData = [
    { race: "Östersund", Matte: 200, Flexschmex: 180, Lulu: 170 },
    { race: "Hochfilzen", Matte: 350, Flexschmex: 320, Lulu: 310 },
    { race: "Oberhof", Matte: 500, Flexschmex: 480, Lulu: 470 },
  ];

  const upcomingEvents: { name: string; date: string }[] = [];
  const pastEvents = [
    { name: "Oslo (NOR) - Men 15 km Mass Start", date: "23.03.2025 - 15:40" },
    { name: "Oslo (NOR) - Women 12.5 km Mass Start", date: "23.03.2025 - 13:15" },
    { name: "Oslo (NOR) - Men 10 km Sprint", date: "21.03.2025 - 16:15" },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-10 px-4 bg-gradient-to-br from-sky-100 via-sky-200 to-blue-400">
      {/* Header */}
      <header className="flex justify-between items-center w-full max-w-6xl mb-8">
        <button className="bg-sky-700 text-white px-4 py-2 rounded-lg hover:bg-sky-800 transition">
          Zurück
        </button>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 text-center">
          Biathlon Tippspiel 2024/25
        </h1>
        <div className="flex gap-2">
          <button className="p-2 bg-white/30 rounded-lg hover:bg-white/50 transition">
            ⚙️
          </button>
        </div>
      </header>

      {/* Toggle */}
      <div className="flex bg-white/40 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm overflow-hidden mb-6">
        <button
          onClick={() => setView("graph")}
          className={`flex items-center gap-2 px-5 py-2 font-medium transition ${
            view === "graph" ? "bg-sky-600 text-white" : "text-gray-700 hover:bg-white/50"
          }`}
        >
          <Trophy size={18} /> Graph
        </button>
        <button
          onClick={() => setView("table")}
          className={`flex items-center gap-2 px-5 py-2 font-medium transition ${
            view === "table" ? "bg-sky-600 text-white" : "text-gray-700 hover:bg-white/50"
          }`}
        >
          <TableIcon size={18} /> Tabelle
        </button>
      </div>

      {/* Main content */}
      <motion.section
        className="w-full max-w-6xl backdrop-blur-md bg-white/40 border border-white/40 rounded-3xl shadow-lg p-6 mb-8"
        layout
      >
        <AnimatePresence mode="wait">
          {view === "graph" ? (
            <motion.div
              key="graph"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockData}>
                  <XAxis dataKey="race" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Matte" stroke="#3b82f6" />
                  <Line type="monotone" dataKey="Flexschmex" stroke="#9333ea" />
                  <Line type="monotone" dataKey="Lulu" stroke="#facc15" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <table className="w-full text-left text-gray-800">
                <thead>
                  <tr className="border-b border-white/60">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Spieler</th>
                    <th className="py-2 px-3">Punkte</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Matte", points: 860 },
                    { name: "Flexschmex", points: 850 },
                    { name: "Lulu", points: 790 },
                  ].map((p, i) => (
                    <tr key={p.name} className="hover:bg-white/50 transition">
                      <td className="py-2 px-3">{i + 1}</td>
                      <td className="py-2 px-3 font-medium">{p.name}</td>
                      <td className="py-2 px-3">{p.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Upcoming events */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-6xl backdrop-blur-md bg-white/40 border border-white/40 rounded-3xl shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={20} /> Anstehende Events
        </h2>

        {upcomingEvents.length === 0 ? (
          <p className="text-gray-600 italic">
            Es sind noch keine Events eingetragen…
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {upcomingEvents.map((e) => (
              <div
                key={e.name}
                className="flex justify-between items-center bg-white/70 rounded-xl p-4 shadow-sm"
              >
                <span>{e.name}</span>
                <button className="bg-sky-500 text-white px-4 py-1 rounded-lg hover:bg-sky-600">
                  Tipp abgeben
                </button>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
          Vergangene Events
        </h2>
        <div className="space-y-2">
          {pastEvents.map((e) => (
            <div
              key={e.name}
              className="flex justify-between items-center bg-white/70 rounded-xl p-4 shadow-sm"
            >
              <div>
                <p className="font-medium">{e.name}</p>
                <p className="text-sm text-gray-600">{e.date}</p>
              </div>
              <button className="bg-sky-500 text-white px-4 py-1 rounded-lg hover:bg-sky-600">
                ansehen
              </button>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
