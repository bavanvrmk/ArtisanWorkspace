import { FormEvent, useEffect, useState } from "react";
import { passportApi } from "../api/client";
import { Alert, PageHeader } from "../components/ui";
import { useLanguage } from "../i18n/LanguageContext";

const PRODUCT_KEY = "artisan.lastProductId";

export function PassportPage() {
  const { t } = useLanguage();
  const saved = sessionStorage.getItem(PRODUCT_KEY) || "1";
  const [productId, setProductId] = useState(saved);
  const [openId, setOpenId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = Number(saved);
    if (!Number.isNaN(id) && id > 0) setOpenId(id);
  }, [saved]);

  async function load(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    const id = Number(productId);
    if (Number.isNaN(id) || id < 1) {
      setError("Enter a valid product id");
      setBusy(false);
      return;
    }
    try {
      await passportApi.data(id);
      sessionStorage.setItem(PRODUCT_KEY, String(id));
      setOpenId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load passport");
      setOpenId(id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker={t.navPassport}
        title={t.passportTitle}
        subtitle="The public Craft Passport HTML page, with QR. Use the id from a listing or demo id 1."
      />
      <form className="row wrap" onSubmit={load}>
        <label>
          Product ID
          <input value={productId} onChange={(e) => setProductId(e.target.value)} />
        </label>
        <button className="btn primary" disabled={busy}>
          {busy ? "Loading…" : "Open passport"}
        </button>
      </form>
      {error ? <Alert kind="info">{error}</Alert> : null}
      {openId ? (
        <section className="passport-frame-wrap">
          <iframe
            className="passport-frame"
            title="Craft Passport"
            src={passportApi.htmlPath(openId)}
          />
          <p className="hint">
            <a href={passportApi.htmlPath(openId)} target="_blank" rel="noreferrer">
              Open in a new tab
            </a>
          </p>
        </section>
      ) : (
        <p className="empty">Enter a product id to load its passport.</p>
      )}
    </>
  );
}
