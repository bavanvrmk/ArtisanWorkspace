import { FormEvent, useEffect, useState } from "react";
import { authApi, schemesApi, type Scheme } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Alert, PageHeader } from "../components/ui";
import { CRAFTS, INDIAN_STATES } from "../data/india";
import { useLanguage } from "../i18n/LanguageContext";

export function SchemesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [eligible, setEligible] = useState<Scheme[]>([]);
  const [all, setAll] = useState<Scheme[]>([]);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    age: "",
    gender: "female",
    craft_type: "Handicraft",
    annual_income: "",
    state: "Rajasthan",
  });

  async function loadMatch() {
    if (!user) return;
    const [match, catalog] = await Promise.all([schemesApi.match(user.userId), schemesApi.all()]);
    setNeedsProfile(Boolean(match.needs_profile));
    setEligible(match.eligible_schemes || []);
    setAll(catalog.schemes);
    const me = await authApi.me(user.userId);
    setForm((prev) => ({
      ...prev,
      full_name: me.full_name || user.username,
      age: me.age != null ? String(me.age) : prev.age,
      gender: me.gender || prev.gender,
      craft_type: me.craft_type || prev.craft_type,
      annual_income: me.annual_income != null ? String(me.annual_income) : prev.annual_income,
      state: me.state || prev.state,
    }));
  }

  useEffect(() => {
    if (!user) return;
    loadMatch().catch((err: Error) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      await authApi.profile(user.userId, {
        full_name: form.full_name,
        age: Number(form.age),
        gender: form.gender,
        craft_type: form.craft_type,
        annual_income: Number(form.annual_income),
        state: form.state,
      });
      await loadMatch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader kicker="Eligibility" title={t.schemesTitle} subtitle={t.profileLead} />
      {error ? <Alert>{error}</Alert> : null}
      {needsProfile ? (
        <form className="panel stack" onSubmit={onSubmit}>
          <h2 className="section-title">{t.profileTitle}</h2>
          <label>
            {t.username}
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </label>
          <label>
            {t.age}
            <input
              type="number"
              min={18}
              max={100}
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              required
            />
          </label>
          <label>
            {t.gender}
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            {t.craft}
            <select
              value={form.craft_type}
              onChange={(e) => setForm({ ...form, craft_type: e.target.value })}
            >
              {CRAFTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.income}
            <input
              type="number"
              min={0}
              value={form.annual_income}
              onChange={(e) => setForm({ ...form, annual_income: e.target.value })}
              required
            />
          </label>
          <label>
            {t.state}
            <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button className="btn primary" disabled={busy}>
            {t.saveProfile}
          </button>
        </form>
      ) : null}
      {!needsProfile ? (
        <>
          <h2 className="section-title">Eligible for you</h2>
          <div className="card-grid">
            {eligible.map((s) => (
              <article key={s.scheme_id} className="scheme-card highlight">
                <h3>{s.name}</h3>
                <p>{s.benefit}</p>
                {s.link ? (
                  <a href={s.link} target="_blank" rel="noreferrer">
                    Official site
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </>
      ) : null}
      <h2 className="section-title">All schemes</h2>
      <div className="card-grid">
        {all.map((s) => (
          <article key={s.scheme_id} className="scheme-card">
            <h3>{s.name}</h3>
            {s.ministry ? <p className="hint">{s.ministry}</p> : null}
            <p>{s.benefit}</p>
          </article>
        ))}
      </div>
    </>
  );
}
