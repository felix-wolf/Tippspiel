import { useState } from "react";
import {
  type AdminResultDiffEntry,
  type AdminResultOperationResponse,
  type AdminResultRefreshPreview,
  Event,
} from "../../models/Event";
import { Button } from "../design/Button";

type AdminResultToolsProps = {
  event: Event;
  onEventUpdated: () => void;
};

export function AdminResultTools({ event, onEventUpdated }: AdminResultToolsProps) {
  const [preview, setPreview] = useState<AdminResultRefreshPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const canRefreshOfficialResults = event.sourceProvider === "ibu" && !!event.sourceRaceId;
  const hasResults = event.results.length > 0;

  function handleOperationSuccess(message: string, response: AdminResultOperationResponse) {
    setStatus(
      response.scope === "shared_event"
        ? `${message} (${response.affectedEvents.length} verknuepfte Events).`
        : message,
    );
    setError(null);
    setPreview(null);
    onEventUpdated();
  }

  async function loadPreview() {
    setBusyAction("preview");
    setError(null);
    setStatus(null);
    try {
      const nextPreview = await Event.previewResultRefresh(event.id);
      setPreview(nextPreview);
    } catch (err: any) {
      setError(err?.text ?? "Die Vorschau konnte nicht geladen werden.");
      setPreview(null);
    } finally {
      setBusyAction(null);
    }
  }

  async function applyRefresh() {
    setBusyAction("apply");
    setError(null);
    setStatus(null);
    try {
      const response = await Event.applyResultRefresh(event.id);
      handleOperationSuccess("Ergebnisse wurden aktualisiert", response);
    } catch (err: any) {
      setError(err?.text ?? "Die Ergebnisse konnten nicht aktualisiert werden.");
    } finally {
      setBusyAction(null);
    }
  }

  async function clearResults() {
    if (!window.confirm("Gespeicherte Ergebnisse und Punkte wirklich zuruecksetzen?")) {
      return;
    }
    setBusyAction("clear");
    setError(null);
    setStatus(null);
    try {
      const response = await Event.clearResults(event.id);
      handleOperationSuccess("Ergebnisse wurden entfernt", response);
    } catch (err: any) {
      setError(err?.text ?? "Die Ergebnisse konnten nicht entfernt werden.");
    } finally {
      setBusyAction(null);
    }
  }

  async function rescoreResults() {
    setBusyAction("rescore");
    setError(null);
    setStatus(null);
    try {
      const response = await Event.rescoreResults(event.id);
      handleOperationSuccess("Bewertungen wurden neu berechnet", response);
    } catch (err: any) {
      setError(err?.text ?? "Die Bewertungen konnten nicht neu berechnet werden.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <section className="mb-5 rounded-2xl border border-sky-300/35 bg-slate-900/70 p-4 text-slate-100 shadow-sm">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-sky-200">Admin: Ergebnis-Operationen</p>
        <p className="text-sm text-slate-300">
          Offizielle Ergebnisse koennen fuer dieses Event neu geladen, entfernt oder neu bewertet
          werden.
        </p>
      </div>

      {status && <p className="mt-3 rounded-xl bg-emerald-500/12 px-3 py-2 text-sm text-emerald-200">{status}</p>}
      {error && <p className="mt-3 rounded-xl bg-rose-500/12 px-3 py-2 text-sm text-rose-200">{error}</p>}

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {canRefreshOfficialResults && (
          <>
            <Button
              title={busyAction === "preview" ? "Lade Vorschau..." : "Aktualisierung pruefen"}
              onClick={loadPreview}
              isEnabled={busyAction === null}
              type="neutral"
            />
            <Button
              title={busyAction === "apply" ? "Aktualisiere..." : "Vorschau anwenden"}
              onClick={applyRefresh}
              isEnabled={busyAction === null && preview !== null}
              type="positive"
            />
          </>
        )}
        <Button
          title={busyAction === "rescore" ? "Berechne..." : "Neu bewerten"}
          onClick={rescoreResults}
          isEnabled={busyAction === null && hasResults}
          type="neutral"
        />
        <Button
          title={busyAction === "clear" ? "Entferne..." : "Ergebnisse loeschen"}
          onClick={clearResults}
          isEnabled={busyAction === null && hasResults}
          type="negative"
        />
      </div>

      {preview && (
        <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/70 p-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-white">Aktualisierungsvorschau</p>
            <p className="text-xs text-slate-400">
              {preview.scope === "shared_event"
                ? `Wirkt auf ${preview.affectedEvents.length} verknuepfte Events.`
                : "Wirkt nur auf dieses Event."}
            </p>
          </div>
          {preview.changes.length === 0 && (
            <p className="mt-3 text-sm text-slate-300">Keine Unterschiede zu den gespeicherten Ergebnissen gefunden.</p>
          )}
          {preview.changes.length > 0 && (
            <div className="mt-3 space-y-2">
              {preview.changes.map((change) => (
                <ResultDiffRow key={change.place} change={change} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ResultDiffRow({ change }: { change: AdminResultDiffEntry }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-white/5 px-3 py-2 text-sm sm:grid sm:grid-cols-[56px_1fr_24px_1fr] sm:items-center sm:gap-2">
      <span className="font-semibold text-sky-200">#{change.place}</span>
      <span className="text-slate-300">{formatResultLabel(change.before)}</span>
      <span className="text-slate-500 sm:text-center">&gt;</span>
      <span className="text-white">{formatResultLabel(change.after)}</span>
    </div>
  );
}

function formatResultLabel(result: AdminResultDiffEntry["before"]) {
  if (!result) {
    return "leer";
  }
  return result.object_name ?? result.object_id;
}
