// src/pages/PlaceBetPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, X, Flag, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function PlaceBetPag() {
  const navigate = useNavigate();

  // TODO: get this from route params / context
  const raceName = "Testrennen – Einzel 15 km";

  // simple local state – replace with your real form logic
  const [bets, setBets] = useState<string[]>(["", "", "", "", ""]);

  const handleChange = (index: number, value: string) => {
    setBets((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const clearField = (index: number) => {
    setBets((prev) => {
      const copy = [...prev];
      copy[index] = "";
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: send bets to backend
    console.log("submitted bets", bets);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-700 text-white text-sm font-medium shadow-sm hover:bg-sky-800 transition"
        >
          <ArrowLeft size={18} />
          zurück
        </button>

        <h1 className="text-lg sm:text-2xl font-semibold text-slate-900 text-center flex-1">
          TIPPEN FÜR: <span className="text-sky-800">{raceName}</span>
        </h1>

        {/* spacer to balance layout */}
        <div className="w-[100px] hidden sm:block" />
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="backdrop-blur-md bg-white/40 border border-white/40 shadow-xl rounded-3xl px-4 sm:px-8 py-6 space-y-6"
      >
        <p className="text-sm text-slate-700">
          Wähle deine Top-5 für dieses Rennen. Du kannst sowohl Nationen als auch
          einzelne Athlet:innen eintragen – je genauer dein Tipp, desto mehr Punkte.
        </p>

        <div className="space-y-4">
          {bets.map((value, index) => (
            <div
              key={index}
              className="bg-white/70 rounded-2xl flex items-center px-3 py-2 shadow-sm border border-transparent focus-within:border-sky-400 focus-within:shadow-md transition"
            >
              <div className="flex items-center justify-center w-10 text-xs font-semibold text-sky-800">
                {index + 1}.
              </div>

              <div className="flex-1 flex items-center gap-2">
                <Search className="text-slate-400" size={18} />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleChange(index, e.target.value)}
                  placeholder={`Platz ${index + 1} – Land oder Athlet:in`}
                  className="w-full bg-transparent outline-none text-sm sm:text-base placeholder:text-slate-400"
                />
              </div>

              {value && (
                <button
                  type="button"
                  onClick={() => clearField(index)}
                  className="ml-2 p-1 rounded-full hover:bg-slate-100 text-slate-500 transition"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Optional helper / examples */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
          <Flag size={14} className="text-sky-700" />
          Beispiele:
          <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5">
            🇩🇪 Deutschland
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5">
            🇳🇴 J. Bø
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5">
            🇸🇪 Schweden
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-white/60 mt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 bg-white/70 text-slate-700 text-sm font-medium hover:bg-white transition"
          >
            Abbrechen
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-md hover:from-sky-600 hover:to-blue-700 transition"
          >
            <CheckCircle2 size={18} />
            Tipp speichern
          </button>
        </div>
      </form>
    </motion.div>
  );
}