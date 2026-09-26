import { useMemo, useRef, useState } from "react";
import { mediaUrl, voiceApi, type ListingResult } from "../api/client";
import { Alert, PageHeader } from "../components/ui";
import { useLanguage } from "../i18n/LanguageContext";
import { toWav } from "../lib/audio";

const TAGS_KEY = "artisan.visionTags";
const IMAGE_KEY = "artisan.visionImage";
const LISTING_KEY = "artisan.lastListing";

function studioContext() {
  try {
    return {
      tags: JSON.parse(sessionStorage.getItem(TAGS_KEY) || "{}") as Record<string, string>,
      image: sessionStorage.getItem(IMAGE_KEY) || "",
    };
  } catch {
    return { tags: {}, image: "" };
  }
}

export function VoicePage() {
  const { lang, t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<ListingResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const studio = useMemo(studioContext, [result]);

  async function startRecording() {
    setError("");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    chunks.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.current.push(e.data);
    };
    rec.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
      void toWav(new File([blob], "recording.webm", { type: blob.type })).then(setFile);
    };
    recorder.current = rec;
    rec.start();
    setRecording(true);
  }

  function stopRecording() {
    recorder.current?.stop();
    setRecording(false);
  }

  async function generate(useUpload: boolean) {
    setBusy(true);
    setError("");
    try {
      const { tags } = studioContext();
      let payload = file;
      if (useUpload && file) {
        payload = await toWav(file);
      }
      const speechLang = lang === "en" ? "hi" : lang;
      const data =
        useUpload && payload
          ? await voiceApi.listingUpload(payload, speechLang, tags)
          : await voiceApi.listing({ language: speechLang, image_tags: tags });
      setResult(data);
      sessionStorage.setItem(LISTING_KEY, JSON.stringify(data.listing));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Listing failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker="Workstream 3"
        title={t.voiceTitle}
        subtitle={
          lang === "en"
            ? "Record in an Indian language. English UI still sends Hindi speech to Bhashini (it has no English ASR)."
            : t.voiceLead
        }
      />
      <div className="split">
        <section className="panel stack">
          <label>
            Audio file
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          {file ? <p className="hint">Ready: {file.name}</p> : null}
          <div className="row">
            {recording ? (
              <button className="btn danger" type="button" onClick={stopRecording}>
                {t.stop}
              </button>
            ) : (
              <button className="btn" type="button" onClick={() => startRecording().catch((e) => setError(String(e)))}>
                {t.record}
              </button>
            )}
            <button className="btn primary" disabled={busy || !file} onClick={() => generate(true)}>
              {busy ? "Working…" : t.generateAudio}
            </button>
          </div>
          <button className="btn" disabled={busy} onClick={() => generate(false)}>
            {t.generateSample}
          </button>
          {Object.keys(studio.tags).length ? (
            <p className="hint">
              {studio.tags.craft_type} · {studio.tags.material} · {studio.tags.category}
            </p>
          ) : (
            <p className="hint">Process a photo in Image Studio first so the listing uses those tags.</p>
          )}
          {error ? <Alert>{error}</Alert> : null}
        </section>
        <section className="panel">
          {result ? (
            <article className="listing">
              {result._fallback_reason ? (
                <Alert kind="info">Using fallback listing: {result._fallback_reason}</Alert>
              ) : null}
              {studio.image ? (
                <div className="cutout">
                  <img className="listing-photo" src={mediaUrl(studio.image)} alt="Listing photo" />
                </div>
              ) : null}
              <h2>{result.listing.title}</h2>
              <p>{result.listing.description}</p>
              <p>
                <strong>Transcript:</strong> {result.transcript}
              </p>
              <p>
                <strong>English:</strong> {result.translated_text}
              </p>
              <ul className="tags">
                {result.listing.seo_tags.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ) : (
            <p className="empty">The generated listing will appear here.</p>
          )}
        </section>
      </div>
    </>
  );
}
