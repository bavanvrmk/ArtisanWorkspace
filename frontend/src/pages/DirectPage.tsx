import { useEffect, useRef, useState } from "react";
import {
  authApi,
  mediaUrl,
  passportApi,
  schemesApi,
  visionApi,
  voiceApi,
  type ListingResult,
  type Scheme,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Alert, PageHeader } from "../components/ui";
import { CRAFTS, INDIAN_STATES } from "../data/india";
import { useLanguage } from "../i18n/LanguageContext";
import { toWav } from "../lib/audio";
import { playGuide, stopGuide } from "../lib/guideVoice";

const TAGS_KEY = "artisan.visionTags";
const IMAGE_KEY = "artisan.visionImage";
const LISTING_KEY = "artisan.lastListing";
const PRODUCT_KEY = "artisan.lastProductId";

type Step = "welcome" | "photo" | "speak" | "listing" | "details" | "schemes" | "passport";

export function DirectPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [step, setStep] = useState<Step>("welcome");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [cutout, setCutout] = useState("");
  const [tags, setTags] = useState({ craft_type: "", material: "", category: "" });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [listing, setListing] = useState<ListingResult | null>(null);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [productId, setProductId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [guideText, setGuideText] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [profile, setProfile] = useState({
    full_name: user?.username || "",
    age: "",
    gender: "female",
    craft_type: "Handicraft",
    annual_income: "",
    state: "Rajasthan",
  });

  async function narrate(key: string) {
    try {
      const data = await playGuide(lang, key);
      setGuideText(data.text);
    } catch {
      setGuideText("");
    }
  }

  useEffect(() => {
    void narrate("welcome");
    return () => stopGuide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  async function processPhoto() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const data = await visionApi.process(file);
      const next = {
        craft_type: data.tags?.craft_type || "Handicraft",
        material: data.tags?.material || "Mixed",
        category: data.tags?.category || "Home Decor",
      };
      setTags(next);
      sessionStorage.setItem(TAGS_KEY, JSON.stringify(next));
      sessionStorage.setItem(IMAGE_KEY, data.processed_image_url || "");
      setCutout(data.processed_image_url || "");
      setStep("speak");
      await narrate("photo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo failed");
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    chunks.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.current.push(e.data);
    };
    rec.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
      void toWav(new File([blob], "recording.webm", { type: blob.type })).then(setAudioFile);
    };
    recorder.current = rec;
    rec.start();
    setRecording(true);
  }

  function stopRecording() {
    recorder.current?.stop();
    setRecording(false);
  }

  async function makeListing() {
    if (!audioFile) return;
    setBusy(true);
    setError("");
    try {
      await narrate("speak");
      const wav = await toWav(audioFile);
      const data = await voiceApi.listingUpload(wav, lang === "en" ? "hi" : lang, tags);
      setListing(data);
      sessionStorage.setItem(LISTING_KEY, JSON.stringify(data.listing));
      setStep("listing");
      await narrate("listing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Listing failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveDetails() {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      await authApi.profile(user.userId, {
        full_name: profile.full_name,
        age: Number(profile.age),
        gender: profile.gender,
        craft_type: profile.craft_type,
        annual_income: Number(profile.annual_income),
        state: profile.state,
      });
      const match = await schemesApi.match(user.userId);
      if (match.needs_profile) {
        setError(match.message || "Need complete details");
        return;
      }
      setSchemes(match.eligible_schemes);
      setStep("schemes");
      await narrate("schemes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not match schemes");
    } finally {
      setBusy(false);
    }
  }

  async function makePassport() {
    if (!user || !listing) return;
    setBusy(true);
    setError("");
    try {
      const created = await passportApi.create({
        artisan_id: user.userId,
        title: listing.listing.title,
        description: listing.listing.description,
        craft_type: tags.craft_type,
        material: tags.material,
        image_url: cutout,
      });
      setProductId(created.product_id);
      sessionStorage.setItem(PRODUCT_KEY, String(created.product_id));
      setStep("passport");
      await narrate("passport");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Passport failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker={t.modeDirect}
        title={`${t.homeHello}, ${user?.username}`}
        subtitle={t.modeDirectHelp}
      />
      <div className="guide-bar">
        <p>{guideText || t.modeDirectHelp}</p>
        <button className="btn" type="button" onClick={() => void narrate(step === "welcome" ? "welcome" : step)}>
          {t.replay}
        </button>
      </div>
      {error ? <Alert>{error}</Alert> : null}

      {step === "welcome" || step === "photo" ? (
        <section className="panel stack">
          <label className="drop">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const next = e.target.files?.[0] || null;
                setFile(next);
                setPreview(next ? URL.createObjectURL(next) : "");
                setStep("photo");
              }}
            />
            {preview ? <img src={preview} alt="Craft photo" /> : <span>{t.uploadPhoto}</span>}
          </label>
          <button className="btn primary" disabled={!file || busy} onClick={() => void processPhoto()}>
            {busy ? t.processing : t.process}
          </button>
        </section>
      ) : null}

      {step === "speak" ? (
        <section className="panel stack">
          {cutout ? (
            <div className="cutout">
              <img className="result-image" src={mediaUrl(cutout)} alt="Cutout" />
            </div>
          ) : null}
          <p className="hint">
            {tags.craft_type} · {tags.material} · {tags.category}
          </p>
          {audioFile ? <p className="hint">Ready: {audioFile.name}</p> : null}
          <div className="row wrap">
            {recording ? (
              <button className="btn danger" type="button" onClick={stopRecording}>
                {t.stop}
              </button>
            ) : (
              <button
                className="btn"
                type="button"
                onClick={() => startRecording().catch((e) => setError(String(e)))}
              >
                {t.record}
              </button>
            )}
            <button className="btn primary" disabled={!audioFile || busy} onClick={() => void makeListing()}>
              {busy ? "…" : t.generateAudio}
            </button>
          </div>
        </section>
      ) : null}

      {step === "listing" && listing ? (
        <section className="panel stack">
          <h2>{listing.listing.title}</h2>
          <p>{listing.listing.description}</p>
          <ul className="tags">
            {listing.listing.seo_tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
          <button
            className="btn primary"
            type="button"
            onClick={() => {
              setStep("details");
              void narrate("details");
            }}
          >
            {t.profileTitle}
          </button>
        </section>
      ) : null}

      {step === "details" ? (
        <form
          className="panel stack"
          onSubmit={(e) => {
            e.preventDefault();
            void saveDetails();
          }}
        >
          <label>
            {t.username}
            <input
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              required
            />
          </label>
          <label>
            {t.age}
            <input
              type="number"
              min={18}
              max={100}
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              required
            />
          </label>
          <label>
            {t.gender}
            <select
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            {t.craft}
            <select
              value={profile.craft_type}
              onChange={(e) => setProfile({ ...profile, craft_type: e.target.value })}
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
              value={profile.annual_income}
              onChange={(e) => setProfile({ ...profile, annual_income: e.target.value })}
              required
            />
          </label>
          <label>
            {t.state}
            <select value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })}>
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

      {step === "schemes" ? (
        <section className="stack">
          <div className="card-grid">
            {schemes.map((s) => (
              <article key={s.scheme_id} className="scheme-card highlight">
                <h3>{s.name}</h3>
                <p>{s.benefit}</p>
              </article>
            ))}
          </div>
          {!schemes.length ? <p className="empty">No matching schemes for this profile yet.</p> : null}
          <button className="btn primary" disabled={busy} onClick={() => void makePassport()}>
            {t.createPassport}
          </button>
        </section>
      ) : null}

      {step === "passport" && productId ? (
        <section className="passport-frame-wrap">
          <iframe
            className="passport-frame"
            title="Craft Passport"
            src={passportApi.htmlPath(productId)}
          />
        </section>
      ) : null}
    </>
  );
}
