// src/components/SettingsDialog.tsx
import { motion } from "framer-motion";
import { X, Wrench, Bell, Palette, Trash2, Check } from "lucide-react";
import { DialogModal } from "../design/Dialog";
import { Game } from "../../models/Game";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isCreator: boolean;
  game: Game;
  onGameDeleted: () => void;
  onGameUpdated: () => void;
};

export default function SettingsDialog({
  isOpen,
  onClose: _onClose,
  game,
  isCreator,
  onGameDeleted: _onGameDeleted,
  onGameUpdated: _onGameUpdated,
}: SettingsModalProps) {
    if (!isOpen) return null;

    return (
        <DialogModal
            isOpened={isOpen}
            onClose={_onClose}
            title=""
            actionButtonEnabled={true}
            type="edit"
        >
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    className="w-full max-w-lg rounded-3xl bg-slate-900/95 text-slate-50 shadow-2xl border border-white/10 relative"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-sky-700 flex items-center justify-center">
                                <Wrench size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Einstellungen</h2>
                                <p className="text-xs text-slate-400">Tippspiel &amp; Benachrichtigungen</p>
                            </div>
                        </div>
                        <button
                            onClick={_onClose}
                            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="px-6 py-5 space-y-6 text-sm">
                        {/* GRAPH SECTION */}
                        <section>
                            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                                <Palette size={14} />
                                Graph
                            </h3>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-slate-200">
                                    <span className="inline-block w-4 h-4 rounded-full bg-gradient-to-r from-sky-400 to-blue-500" />
                                    <span>Farbschema für den Punktestand-Graphen</span>
                                </div>
                                <button className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-medium">
                                    Farbe ändern
                                </button>
                            </div>
                        </section>

                        {/* DIVIDER */}
                        <div className="border-t border-white/10" />

                        {/* NOTIFICATIONS */}
                        <section>
                            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                                <Bell size={14} />
                                Benachrichtigungen
                            </h3>

                            <div className="space-y-3">
                                {/* Push enable */}
                                <button className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-2.5 text-sm font-semibold text-center shadow-md hover:from-sky-400 hover:to-blue-500 transition">
                                    Push-Benachrichtigungen aktivieren
                                </button>

                                <button className="w-full rounded-xl bg-slate-800 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700 transition">
                                    Testbenachrichtigung senden
                                </button>

                                <p className="mt-1 text-xs text-slate-400">
                                    Benachrichtigungen erhalten bei…
                                </p>

                                {/* Triggers */}
                                <div className="space-y-2">
                                    <NotificationOption label="neuen Ergebnissen" enabled />
                                    <NotificationOption label="fehlenden Tipps (1h vorher)" enabled />
                                </div>
                            </div>
                        </section>

                        {/* DIVIDER */}
                        <div className="border-t border-white/10" />

                        {/* GAME META */}
                        <section>
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                                Spiel
                            </h3>
                            <label className="block text-xs mb-1 text-slate-300">
                                Name des Tippspiels
                            </label>
                            <input
                                type="text"
                                defaultValue="Mein Biathlon Tippspiel"
                                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            />

                            <div className="mt-3 flex items-center justify-between">
                                <span className="text-xs text-slate-400">
                                    Farbe im Dashboard
                                </span>
                                <button className="px-3 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-xs font-medium">
                                    Farbe ändern
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-5 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                        <button className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-300 border border-red-500/60 bg-red-900/40 hover:bg-red-800/70 transition">
                            <Trash2 size={14} />
                            Löschen
                        </button>

                        <div className="flex gap-2">
                            <button
                                onClick={_onClose}
                                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 transition"
                            >
                                Abbrechen
                            </button>
                            <button className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-900 shadow-md transition">
                                Speichern
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </DialogModal>
    );
}

// small helper component for the notification list
function NotificationOption({ label, enabled }: { label: string; enabled?: boolean }) {
    return (
        <div className="flex items-center justify-between rounded-xl bg-slate-800 px-3 py-2">
            <span className="text-xs text-slate-100">{label}</span>
            {enabled ? (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 text-slate-900">
                    <Check size={14} />
                </span>
            ) : (
                <span className="inline-block w-4 h-4 rounded-full border border-slate-500" />
            )}
        </div>
    );
}
