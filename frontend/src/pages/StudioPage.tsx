import { useState } from "react";
import { visionApi, type VisionResult, mediaUrl } from "../api/client";
import { Alert, PageHeader } from "../components/ui";
import { useLanguage } from "../i18n/LanguageContext";

const TAGS_KEY = "artisan.visionTags";
const IMAGE_KEY = "artisan.visionImage";

const CRAFTS = [
  "Pottery",
  "Ceramics",
  "Weaving",
  "Woodwork",
  "Metalwork",
  "Embroidery",
  "Painting",
  "Basketry",
  "Leatherwork",
  "Handicraft",
];
const MATERIALS = [
  "Terracotta",
  "Ceramic",
  "Cotton",
  "Silk",
  "Wood",
  "Brass",
  "Leather",
  "Mixed",
];
const CATEGORIES = [
  "Home Decor",
  "Kitchenware",
  "Apparel",
  "Art",
  "Furniture",
  "Accessories",
];

function persistTags(tags: Record<string, string>) {
  sessionStorage.setItem(TAGS_KEY, JSON.stringify(tags));
}

export function StudioPage() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [result, setResult] = useState<VisionResult | null>(null);
  const [tags, setTags] = useState({ craft_type: "", material: "", category: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateTag(key: "craft_type" | "material" | "category", value: string) {
    const next = { ...tags, [key]: value };
    setTags(next);
    persistTags(next);
  }

  async function process() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const data = await visionApi.process(file);
      setResult(data);
      const next = {
        craft_type: data.tags?.craft_type || "Handicraft",
        material: data.tags?.material || "Mixed",
        category: data.tags?.category || "Home Decor",
      };
      setTags(next);
      persistTags(next);
      sessionStorage.setItem(IMAGE_KEY, data.processed_image_url || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader kicker="Workstream 2" title={t.studioTitle} subtitle={t.studioLead} />
      <div className="split">
        <section className="panel stack">
          <label className="drop">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const next = e.target.files?.[0] || null;
                setFile(next);
                setResult(null);
                setPreview(next ? URL.createObjectURL(next) : "");
              }}
            />
            {preview ? <img src={preview} alt="Original upload" /> : <span>Choose a product photo</span>}
          </label>
          <button className="btn primary" disabled={!file || busy} onClick={process}>
            {busy ? t.processing : t.process}
          </button>
          {error ? <Alert>{error}</Alert> : null}
        </section>
        <section className="panel">
          {result ? (
            <div className="stack">
              <div className="cutout">
                <img
                  className="result-image"
                  src={mediaUrl(result.processed_image_url)}
                  alt="Product with background removed"
                />
              </div>
              <p>
                Quality:{" "}
                <strong>{result.quality_passed ? "Passed" : "Needs attention"}</strong>
              </p>
              {result.quality_feedback ? <p>{result.quality_feedback}</p> : null}
              <label>
                {t.craft}
                <select value={tags.craft_type} onChange={(e) => updateTag("craft_type", e.target.value)}>
                  {Array.from(new Set([...CRAFTS, tags.craft_type].filter(Boolean))).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t.material}
                <select value={tags.material} onChange={(e) => updateTag("material", e.target.value)}>
                  {Array.from(new Set([...MATERIALS, tags.material].filter(Boolean))).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t.category}
                <select value={tags.category} onChange={(e) => updateTag("category", e.target.value)}>
                  {Array.from(new Set([...CATEGORIES, tags.category].filter(Boolean))).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <p className="hint">{t.saveTags}</p>
            </div>
          ) : (
            <p className="empty">Processed image and tags will appear here.</p>
          )}
        </section>
      </div>
    </>
  );
}
