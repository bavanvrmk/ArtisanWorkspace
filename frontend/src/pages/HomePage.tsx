import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Camera, IndianRupee, Landmark, Mic, QrCode } from "lucide-react";
import { khataApi, schemesApi, type KhataSummary } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Alert, PageHeader, rupees } from "../components/ui";
import { useLanguage } from "../i18n/LanguageContext";
import { useSettings } from "../settings/SettingsContext";
import { DirectPage } from "./DirectPage";

const tools = [
  {
    to: "/studio",
    icon: Camera,
    title: "Image Studio",
    copy: "Clean a product photo and auto-tag craft, material, and category.",
  },
  {
    to: "/voice",
    icon: Mic,
    title: "Voice listing",
    copy: "Turn a spoken description into a marketplace title and SEO tags.",
  },
  {
    to: "/pricing",
    icon: IndianRupee,
    title: "Fair pricing",
    copy: "Cost-plus retail and B2B prices with a plain-language explanation.",
  },
  {
    to: "/khata",
    icon: BookOpen,
    title: "Digital khata",
    copy: "Record income and expenses. See this month at a glance.",
  },
  {
    to: "/schemes",
    icon: Landmark,
    title: "Schemes",
    copy: "Match your profile against seven government programmes.",
  },
  {
    to: "/passport",
    icon: QrCode,
    title: "Craft Passport",
    copy: "Public product page with QR for buyers and markets.",
  },
];

export function HomePage() {
  const { mode } = useSettings();
  if (mode === "direct") return <DirectPage />;
  return <AdvancedHome />;
}

function AdvancedHome() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [summary, setSummary] = useState<KhataSummary | null>(null);
  const [eligible, setEligible] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([khataApi.summary(user.userId), schemesApi.match(user.userId)])
      .then(([s, m]) => {
        setSummary(s);
        setEligible(m.eligible_count);
      })
      .catch((err: Error) => setError(err.message));
  }, [user]);

  return (
    <>
      <PageHeader
        kicker={t.homeKicker}
        title={`${t.homeHello}, ${user?.username}`}
        subtitle={t.homeLead}
      />
      {error ? <Alert>{error}</Alert> : null}
      <section className="stat-grid">
        <article className="stat-card">
          <span>{t.balance}</span>
          <strong>{rupees(summary?.current_balance)}</strong>
        </article>
        <article className="stat-card">
          <span>{t.thisMonth}</span>
          <strong>{rupees(summary?.month_net)}</strong>
        </article>
        <article className="stat-card">
          <span>{t.eligible}</span>
          <strong>{eligible ?? "—"}</strong>
        </article>
      </section>
      <section className="card-grid">
        {tools.map(({ to, icon: Icon, title, copy }) => (
          <Link key={to} to={to} className="tool-card">
            <Icon size={22} />
            <h2>{title}</h2>
            <p>{copy}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
