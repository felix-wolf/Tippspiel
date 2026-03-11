import { useEffect, useMemo, useState } from "react";
import { NavPage } from "./NavPage";
import { useCurrentUser } from "../models/user/UserContext";
import { SiteRoutes, useNavigateParams } from "../../SiteRoutes";
import { Admin, type AdminCountryDiagnostic, type AdminSharedEventDiagnostic } from "../models/Admin";
import { Button } from "../components/design/Button";
import { Event } from "../models/Event";
import { AdminResultTools } from "../components/domain/AdminResultTools";

type AdminTab = "shared_events" | "countries";
type SharedFilter = "all" | "missing_results" | "multi_game" | "missing_source";

export function AdminPage() {
  const user = useCurrentUser();
  const navigate = useNavigateParams();
  const isAdmin = user?.isAdmin === true;

  const [activeTab, setActiveTab] = useState<AdminTab>("shared_events");
  const [sharedEvents, setSharedEvents] = useState<AdminSharedEventDiagnostic[]>([]);
  const [countries, setCountries] = useState<AdminCountryDiagnostic[]>([]);
  const [selectedSharedEventId, setSelectedSharedEventId] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [selectedSharedEvent, setSelectedSharedEvent] = useState<AdminSharedEventDiagnostic | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [sharedFilter, setSharedFilter] = useState<SharedFilter>("all");
  const [sharedSearch, setSharedSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [sourceForm, setSourceForm] = useState({
    sourceProvider: "ibu",
    sourceEventId: "",
    sourceRaceId: "",
    seasonId: "",
  });
  const [countryForm, setCountryForm] = useState({ name: "", flag: "" });
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [savingSource, setSavingSource] = useState(false);
  const [savingCountry, setSavingCountry] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate(SiteRoutes.Login, {});
    }
  }, [navigate, user]);

  async function loadOverview() {
    if (!isAdmin) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [sharedEventData, countryData] = await Promise.all([
        Admin.fetchSharedEvents(),
        Admin.fetchCountryDiagnostics(),
      ]);
      setSharedEvents(sharedEventData);
      setCountries(countryData);
      setSelectedSharedEventId((current) => current ?? sharedEventData[0]?.sharedEventId ?? null);
      setSelectedCountryCode((current) => current ?? countryData[0]?.code ?? null);
    } catch (err: any) {
      setError(err?.text ?? "Die Admin-Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSharedEventDetail(sharedEventId: string) {
    setDetailLoading(true);
    setError(null);
    try {
      const detail = await Admin.fetchSharedEventDetail(sharedEventId);
      setSelectedSharedEvent(detail);
      setSourceForm({
        sourceProvider: detail.sourceProvider ?? "ibu",
        sourceEventId: detail.sourceEventId ?? "",
        sourceRaceId: detail.sourceRaceId ?? "",
        seasonId: detail.seasonId ?? "",
      });
      const event = await Event.fetchOne(detail.targetEventId);
      setSelectedEvent(event);
    } catch (err: any) {
      setError(err?.text ?? "Die Shared-Event-Details konnten nicht geladen werden.");
      setSelectedSharedEvent(null);
      setSelectedEvent(null);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadOverview().then();
  }, [isAdmin]);

  useEffect(() => {
    if (selectedSharedEventId && isAdmin) {
      loadSharedEventDetail(selectedSharedEventId).then();
    } else {
      setSelectedSharedEvent(null);
      setSelectedEvent(null);
    }
  }, [selectedSharedEventId, isAdmin]);

  useEffect(() => {
    const selectedCountry = countries.find((country) => country.code === selectedCountryCode);
    if (!selectedCountry) {
      return;
    }
    setCountryForm({
      name: selectedCountry.name,
      flag: selectedCountry.flag,
    });
  }, [countries, selectedCountryCode]);

  const filteredSharedEvents = useMemo(() => {
    const needle = sharedSearch.trim().toLowerCase();
    return sharedEvents.filter((item) => {
      if (sharedFilter === "missing_results" && !item.flags.missingResults) {
        return false;
      }
      if (sharedFilter === "multi_game" && !item.flags.hasMultipleLinkedGames) {
        return false;
      }
      if (sharedFilter === "missing_source" && !item.flags.missingSourceMapping) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return [
        item.name,
        item.location,
        item.sourceRaceId,
        item.sourceEventId,
        item.sharedEventId,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle));
    });
  }, [sharedEvents, sharedFilter, sharedSearch]);

  const filteredCountries = useMemo(() => {
    const needle = countrySearch.trim().toLowerCase();
    return countries.filter((country) => {
      if (!needle) {
        return true;
      }
      return [country.code, country.name, ...country.athleteExamples]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [countries, countrySearch]);

  const selectedCountry = countries.find((country) => country.code === selectedCountryCode) ?? null;

  async function handleSourceSave() {
    if (!selectedSharedEvent) {
      return;
    }
    setSavingSource(true);
    setError(null);
    setStatus(null);
    try {
      const updated = await Admin.updateSharedEventSource(selectedSharedEvent.sharedEventId, {
        source_provider: sourceForm.sourceProvider,
        source_event_id: sourceForm.sourceEventId || undefined,
        source_race_id: sourceForm.sourceRaceId,
        season_id: sourceForm.seasonId || undefined,
      });
      setStatus("Source-Zuordnung wurde gespeichert.");
      await loadOverview();
      setSelectedSharedEventId(updated.sharedEventId);
    } catch (err: any) {
      setError(err?.text ?? "Die Source-Zuordnung konnte nicht gespeichert werden.");
    } finally {
      setSavingSource(false);
    }
  }

  async function handleCountrySave() {
    if (!selectedCountry) {
      return;
    }
    setSavingCountry(true);
    setError(null);
    setStatus(null);
    try {
      const updated = await Admin.updateCountry(selectedCountry.code, countryForm);
      setStatus(`Land ${updated.code} wurde gespeichert.`);
      const nextCountries = await Admin.fetchCountryDiagnostics();
      setCountries(nextCountries);
      setSelectedCountryCode(updated.code);
    } catch (err: any) {
      setError(err?.text ?? "Das Land konnte nicht gespeichert werden.");
    } finally {
      setSavingCountry(false);
    }
  }

  async function handleResultOperationRefresh() {
    await loadOverview();
    if (selectedSharedEventId) {
      await loadSharedEventDetail(selectedSharedEventId);
    }
  }

  if (!isAdmin) {
    return (
      <NavPage title="Admin">
        <section className="w-full max-w-4xl rounded-3xl border border-white/40 bg-white/50 p-6 shadow-lg">
          <p className="text-lg font-semibold text-slate-800">Kein Admin-Zugriff</p>
          <p className="mt-2 text-sm text-slate-600">
            Diese Seite ist nur für Admin-Nutzer verfügbar.
          </p>
        </section>
      </NavPage>
    );
  }

  return (
    <NavPage title="Admin Ops">
      <section className="w-full max-w-6xl rounded-3xl border border-white/40 bg-white/55 p-6 shadow-lg backdrop-blur-md">
        <div className="grid gap-3 md:grid-cols-2">
          <Button
            title="Shared Events"
            onClick={() => setActiveTab("shared_events")}
            type={activeTab === "shared_events" ? "positive" : "neutral"}
          />
          <Button
            title="Countries"
            onClick={() => setActiveTab("countries")}
            type={activeTab === "countries" ? "positive" : "neutral"}
          />
        </div>

        {status && (
          <p className="mt-4 rounded-xl bg-emerald-500/12 px-3 py-2 text-sm text-emerald-800">{status}</p>
        )}
        {error && (
          <p className="mt-4 rounded-xl bg-rose-500/12 px-3 py-2 text-sm text-rose-800">{error}</p>
        )}

        {loading ? (
          <div className="mt-6 text-sm text-slate-600">Lade Admin-Daten...</div>
        ) : activeTab === "shared_events" ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <section className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <div className="flex flex-col gap-3">
                <p className="text-lg font-semibold text-slate-900">Shared Events</p>
                <input
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="Suche nach Name oder Source ID"
                  value={sharedSearch}
                  onChange={(event) => setSharedSearch(event.target.value)}
                />
                <div className="grid gap-2 md:grid-cols-2">
                  <Button title="Alle" onClick={() => setSharedFilter("all")} type={sharedFilter === "all" ? "positive" : "neutral"} />
                  <Button title="Fehlende Ergebnisse" onClick={() => setSharedFilter("missing_results")} type={sharedFilter === "missing_results" ? "positive" : "neutral"} />
                  <Button title="Mehrere Spiele" onClick={() => setSharedFilter("multi_game")} type={sharedFilter === "multi_game" ? "positive" : "neutral"} />
                  <Button title="Fehlende Source" onClick={() => setSharedFilter("missing_source")} type={sharedFilter === "missing_source" ? "positive" : "neutral"} />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {filteredSharedEvents.length === 0 && (
                  <p className="text-sm text-slate-600">Keine Shared Events für den aktuellen Filter.</p>
                )}
                {filteredSharedEvents.map((item) => (
                  <button
                    key={item.sharedEventId}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      item.sharedEventId === selectedSharedEventId
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 bg-white hover:border-sky-300"
                    }`}
                    onClick={() => setSelectedSharedEventId(item.sharedEventId)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-600">{item.location ?? "Ohne Ort"} · {item.datetime}</p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-2 py-1 text-xs text-white">
                        {item.linkedEventCount} Spiele
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <FlagChip label={`${item.withResultsCount}/${item.linkedEventCount} mit Ergebnissen`} type={item.flags.missingResults ? "warn" : "ok"} />
                      {item.flags.hasMultipleLinkedGames && <FlagChip label="Mehrfach verknüpft" type="neutral" />}
                      {item.flags.missingSourceMapping && <FlagChip label="Source fehlt" type="warn" />}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              {detailLoading && <p className="text-sm text-slate-600">Lade Details...</p>}
              {!detailLoading && !selectedSharedEvent && (
                <p className="text-sm text-slate-600">Wähle ein Shared Event aus.</p>
              )}
              {!detailLoading && selectedSharedEvent && (
                <div className="space-y-6">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{selectedSharedEvent.name}</p>
                    <p className="text-sm text-slate-600">{selectedSharedEvent.sharedEventId}</p>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Source-Reparatur</p>
                    <label className="text-sm text-slate-700">
                      Source Provider
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                        value={sourceForm.sourceProvider}
                        onChange={(event) => setSourceForm((current) => ({ ...current, sourceProvider: event.target.value }))}
                      />
                    </label>
                    <label className="text-sm text-slate-700">
                      Source Event ID
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                        value={sourceForm.sourceEventId}
                        onChange={(event) => setSourceForm((current) => ({ ...current, sourceEventId: event.target.value }))}
                      />
                    </label>
                    <label className="text-sm text-slate-700">
                      Source Race ID
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                        value={sourceForm.sourceRaceId}
                        onChange={(event) => setSourceForm((current) => ({ ...current, sourceRaceId: event.target.value }))}
                      />
                    </label>
                    <label className="text-sm text-slate-700">
                      Season ID
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                        value={sourceForm.seasonId}
                        onChange={(event) => setSourceForm((current) => ({ ...current, seasonId: event.target.value }))}
                      />
                    </label>
                    <Button
                      title={savingSource ? "Speichere..." : "Source speichern"}
                      onClick={handleSourceSave}
                      isEnabled={!savingSource}
                      type="positive"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Verknüpfte Events</p>
                    <div className="mt-3 space-y-2">
                      {selectedSharedEvent.linkedEvents.map((linkedEvent) => (
                        <div key={linkedEvent.eventId} className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
                          {linkedEvent.gameName}: {linkedEvent.eventName} {linkedEvent.hasResults ? "· Ergebnisse vorhanden" : "· keine Ergebnisse"}
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedEvent && (
                    <AdminResultTools
                      key={selectedEvent.id}
                      event={selectedEvent}
                      onEventUpdated={handleResultOperationRefresh}
                    />
                  )}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="text-lg font-semibold text-slate-900">Fehlende Länder</p>
              <input
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Suche nach Code, Name oder Athlet"
                value={countrySearch}
                onChange={(event) => setCountrySearch(event.target.value)}
              />
              <div className="mt-4 space-y-3">
                {filteredCountries.length === 0 && (
                  <p className="text-sm text-slate-600">Keine fehlenden Länder gefunden.</p>
                )}
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      country.code === selectedCountryCode
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 bg-white hover:border-sky-300"
                    }`}
                    onClick={() => setSelectedCountryCode(country.code)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{country.flag} {country.code}</p>
                      <span className="text-xs text-slate-500">{country.athleteCount} Athleten</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{country.name}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              {!selectedCountry && (
                <p className="text-sm text-slate-600">Wähle ein Land aus.</p>
              )}
              {selectedCountry && (
                <div className="space-y-6">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{selectedCountry.code}</p>
                    <p className="text-sm text-slate-600">
                      {selectedCountry.isMissingRow ? "Fehlender Datensatz" : "Platzhalter-Flag"} · {selectedCountry.resultCount} Result-Referenzen
                    </p>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <label className="text-sm text-slate-700">
                      Name
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                        value={countryForm.name}
                        onChange={(event) => setCountryForm((current) => ({ ...current, name: event.target.value }))}
                      />
                    </label>
                    <label className="text-sm text-slate-700">
                      Emoji-Flagge
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                        value={countryForm.flag}
                        onChange={(event) => setCountryForm((current) => ({ ...current, flag: event.target.value }))}
                      />
                    </label>
                    <Button
                      title={savingCountry ? "Speichere..." : "Land speichern"}
                      onClick={handleCountrySave}
                      isEnabled={!savingCountry}
                      type="positive"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Athlet-Beispiele</p>
                    {selectedCountry.athleteExamples.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-600">Keine Athleten-Beispiele vorhanden.</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {selectedCountry.athleteExamples.map((name) => (
                          <div key={name} className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
                            {name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </NavPage>
  );
}

function FlagChip({ label, type }: { label: string; type: "ok" | "warn" | "neutral" }) {
  const className =
    type === "ok"
      ? "bg-emerald-100 text-emerald-800"
      : type === "warn"
        ? "bg-amber-100 text-amber-900"
        : "bg-slate-200 text-slate-700";
  return <span className={`rounded-full px-2 py-1 ${className}`}>{label}</span>;
}
