import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Alert } from "../components/ui";
import { LANGUAGES, useLanguage } from "../i18n/LanguageContext";

export function LoginPage() {
  const { user, login } = useAuth();
  const { t, setLang, lang } = useLanguage();
  const [username, setUsername] = useState("demo_artisan");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-panel">
        <label className="login-lang-select">
          {t.language}
          <select value={lang} onChange={(e) => setLang(e.target.value as typeof lang)}>
            {LANGUAGES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} — {item.english}
              </option>
            ))}
          </select>
        </label>
        <p className="kicker">{t.loginKicker}</p>
        <h1>{t.brand}</h1>
        <p className="lede">{t.loginLead}</p>
        <form onSubmit={onSubmit} className="stack">
          <label>
            {t.username}
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          {error ? <Alert>{error}</Alert> : null}
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? t.signingIn : t.enter}
          </button>
          <p className="hint">
            Demo artisan is seeded as <code>demo_artisan</code>. Any new name creates
            an artisan account.
          </p>
        </form>
      </div>
    </div>
  );
}
