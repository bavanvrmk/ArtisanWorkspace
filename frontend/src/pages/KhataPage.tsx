import { FormEvent, useEffect, useState } from "react";
import { khataApi, type KhataEntry, type KhataSummary } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Alert, PageHeader, rupees } from "../components/ui";

export function KhataPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<KhataSummary | null>(null);
  const [entries, setEntries] = useState<KhataEntry[]>([]);
  const [type, setType] = useState("income");
  const [amount, setAmount] = useState(500);
  const [category, setCategory] = useState("Sales");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!user) return;
    const [s, e] = await Promise.all([
      khataApi.summary(user.userId),
      khataApi.entries(user.userId),
    ]);
    setSummary(s);
    setEntries(e.entries);
  }

  useEffect(() => {
    refresh().catch((err: Error) => setError(err.message));
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const res = await khataApi.create({
        artisan_id: String(user.userId),
        type,
        amount,
        category,
        notes: notes || undefined,
      });
      setNotice(res.summary);
      setNotes("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save entry");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker="Digital khata"
        title="Income & expenses"
        subtitle="A simple ledger for market sales, materials, and fuel."
      />
      <section className="stat-grid">
        <article className="stat-card">
          <span>Balance</span>
          <strong>{rupees(summary?.current_balance)}</strong>
        </article>
        <article className="stat-card">
          <span>Income (month)</span>
          <strong>{rupees(summary?.month_income)}</strong>
        </article>
        <article className="stat-card">
          <span>Expense (month)</span>
          <strong>{rupees(summary?.month_expense)}</strong>
        </article>
      </section>
      <div className="split">
        <form className="panel stack" onSubmit={onSubmit}>
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <label>
            Amount (₹)
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </label>
          <label>
            Category
            <input value={category} onChange={(e) => setCategory(e.target.value)} required />
          </label>
          <label>
            Notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </label>
          {error ? <Alert>{error}</Alert> : null}
          {notice ? <Alert kind="ok">{notice}</Alert> : null}
          <button className="btn primary" disabled={busy}>
            {busy ? "Saving…" : "Record entry"}
          </button>
        </form>
        <section className="panel">
          {entries.length === 0 ? (
            <p className="empty">No entries yet.</p>
          ) : (
            <ul className="ledger">
              {entries.map((entry) => (
                <li key={entry.entry_id}>
                  <div>
                    <strong>{entry.category}</strong>
                    <span>{entry.notes || entry.type}</span>
                  </div>
                  <em className={entry.type}>
                    {entry.type === "expense" ? "−" : "+"}
                    {rupees(entry.amount)}
                  </em>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
