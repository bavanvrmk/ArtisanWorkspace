import { FormEvent, useState } from "react";
import { pricingApi, type PricingResult } from "../api/client";
import { Alert, PageHeader, rupees } from "../components/ui";

const crafts = [
  { id: "", label: "Custom inputs" },
  { id: "terracotta-pot", label: "Terracotta pot" },
  { id: "blue-pottery-vase", label: "Jaipur blue pottery" },
  { id: "madhubani-canvas", label: "Madhubani canvas" },
  { id: "dhokra-nandi", label: "Dhokra Nandi" },
  { id: "banarasi-silk-stole", label: "Banarasi silk stole" },
];

export function PricingPage() {
  const [craftId, setCraftId] = useState("terracotta-pot");
  const [craftType, setCraftType] = useState("Pottery");
  const [material, setMaterial] = useState(220);
  const [hours, setHours] = useState(5.5);
  const [wage, setWage] = useState(120);
  const [result, setResult] = useState<PricingResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await pricingApi.calculate({
        material_cost: material,
        labour_hours: hours,
        hourly_wage: wage,
        craft_type: craftType,
        craft_id: craftId || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pricing failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker="Workstream 4"
        title="Fair pricing"
        subtitle="Cost-plus retail and wholesale prices, with a ‘why this price’ explanation."
      />
      <div className="split">
        <form className="panel stack" onSubmit={onSubmit}>
          <label>
            Craft dataset
            <select value={craftId} onChange={(e) => setCraftId(e.target.value)}>
              {crafts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Craft type
            <input value={craftType} onChange={(e) => setCraftType(e.target.value)} />
          </label>
          <label>
            Material cost (₹)
            <input
              type="number"
              min={0}
              value={material}
              onChange={(e) => setMaterial(Number(e.target.value))}
            />
          </label>
          <label>
            Labour hours
            <input
              type="number"
              min={0}
              step={0.5}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            />
          </label>
          <label>
            Hourly wage (₹)
            <input
              type="number"
              min={0}
              value={wage}
              onChange={(e) => setWage(Number(e.target.value))}
            />
          </label>
          <p className="hint">
            Choosing a dataset fills costs from the pricing engine. Custom inputs are
            used when the dataset is empty.
          </p>
          {error ? <Alert>{error}</Alert> : null}
          <button className="btn primary" disabled={busy}>
            {busy ? "Calculating…" : "Calculate price"}
          </button>
        </form>
        <section className="panel">
          {result ? (
            <div className="stack">
              <div className="stat-grid compact">
                <article className="stat-card">
                  <span>Retail</span>
                  <strong>{rupees(result.retail_price)}</strong>
                </article>
                <article className="stat-card">
                  <span>B2B</span>
                  <strong>{rupees(result.b2b_price)}</strong>
                </article>
              </div>
              <p>
                Market range: {rupees(result.market_range?.[0])} –{" "}
                {rupees(result.market_range?.[1])}
              </p>
              {result.breakdown ? (
                <p className="hint">
                  Artisan share {result.breakdown.artisan_share_pct}% · earnings{" "}
                  {rupees(result.breakdown.artisan_total_earnings)}
                </p>
              ) : null}
              <blockquote>{result.explanation}</blockquote>
            </div>
          ) : (
            <p className="empty">Price breakdown will appear here.</p>
          )}
        </section>
      </div>
    </>
  );
}
