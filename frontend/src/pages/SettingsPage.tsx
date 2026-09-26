import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { guideApi } from "../api/client";
import { Alert, PageHeader } from "../components/ui";
import { LANGUAGES, useLanguage } from "../i18n/LanguageContext";
import { useSettings } from "../settings/SettingsContext";

export function SettingsPage() {
  const { t, lang, setLang } = useLanguage();
  const { mode, setMode } = useSettings();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function cacheAudio() {
    setBusy(true);
    setError("");
    setNote("");
    try {
      const res = await guideApi.prefetch(lang);
      const saved = res.prompts.filter((p) => p.cached && p.audio_url).length;
      setNote(`${t.cached} (${saved}/${res.prompts.length})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cache audio");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader kicker={t.navSettings} title={t.settingsTitle} subtitle={t.settingsLead} />
      <section className="panel stack">
        <label>
          {t.language}
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as typeof lang)}
          >
            {LANGUAGES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} — {item.english}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="mode-picker">
          <legend>{t.modeLabel}</legend>
          <label className="mode-option">
            <input
              type="radio"
              name="mode"
              checked={mode === "direct"}
              onChange={() => {
                setMode("direct");
                navigate("/");
              }}
            />
            <span>
              <strong>{t.modeDirect}</strong>
              <em>{t.modeDirectHelp}</em>
            </span>
          </label>
          <label className="mode-option">
            <input
              type="radio"
              name="mode"
              checked={mode === "advanced"}
              onChange={() => setMode("advanced")}
            />
            <span>
              <strong>{t.modeAdvanced}</strong>
              <em>{t.modeAdvancedHelp}</em>
            </span>
          </label>
        </fieldset>
        <button className="btn primary" type="button" disabled={busy} onClick={() => void cacheAudio()}>
          {busy ? t.caching : t.cacheAudio}
        </button>
        {note ? <Alert kind="ok">{note}</Alert> : null}
        {error ? <Alert>{error}</Alert> : null}
      </section>
    </>
  );
}
