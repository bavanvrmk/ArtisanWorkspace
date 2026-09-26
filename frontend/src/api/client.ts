const API = import.meta.env.VITE_API_URL ?? "";

export function mediaUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  return `${API}${path}`;
}

async function parseError(res: Response) {
  const text = await res.text();
  try {
    const json = JSON.parse(text) as { detail?: string; message?: string };
    return json.detail || json.message || text || res.statusText;
  } catch {
    return text || res.statusText;
  }
}

function unreachableApi() {
  return new Error(
    "Cannot reach the API. From the repo root run python dev.py (API on port 8000, app on 5173).",
  );
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  const controller = new AbortController();
  const timeoutMs = path.includes("/vision/")
    ? 180000
    : path.includes("/guide/prefetch")
      ? 180000
      : path.includes("/voice/") || path.includes("/guide/")
        ? 120000
        : 15000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...init.headers,
      },
    });
    if (!res.ok) {
      throw new Error(await parseError(res));
    }
    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw unreachableApi();
    }
    const message = err instanceof Error ? err.message : String(err);
    if (/failed to fetch|networkerror|load failed|econnrefused/i.test(message)) {
      throw unreachableApi();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user_id: number;
  username?: string;
  full_name?: string | null;
  age?: number | null;
  gender?: string | null;
  craft_type?: string | null;
  annual_income?: number | null;
  state?: string | null;
  profile_complete?: boolean;
};

export type ArtisanProfile = {
  user_id: number;
  username: string;
  full_name?: string | null;
  age?: number | null;
  gender?: string | null;
  craft_type?: string | null;
  annual_income?: number | null;
  state?: string | null;
  profile_complete: boolean;
};

export type KhataSummary = {
  artisan_id: string;
  total_income: number;
  total_expense: number;
  current_balance: number;
  month_income: number;
  month_expense: number;
  month_net: number;
  total_entries: number;
};

export type KhataEntry = {
  entry_id: string;
  type: "income" | "expense" | string;
  amount: number;
  category: string;
  notes?: string | null;
  created_at?: string | null;
};

export type Scheme = {
  scheme_id: string;
  name: string;
  ministry?: string;
  benefit: string;
  link?: string;
  audio_summary_url?: string;
};

export type VisionResult = {
  status: string;
  processed_image_url: string;
  quality_passed: boolean;
  quality_feedback: string | null;
  tags: {
    craft_type?: string;
    material?: string;
    category?: string;
  };
  _fallback_reason?: string;
};

export type ListingResult = {
  transcript: string;
  translated_text: string;
  listing: {
    title: string;
    description: string;
    seo_tags: string[];
  };
  audio_alert_url?: string | null;
  _fallback_reason?: string;
};

export type PricingResult = {
  retail_price: number;
  b2b_price: number;
  market_range: number[];
  explanation: string;
  breakdown?: {
    material_cost: number;
    labour_cost: number;
    labour_hours: number;
    hourly_wage: number;
    overhead_cost: number;
    base_cost: number;
    retail_margin_pct: number;
    b2b_margin_pct: number;
    artisan_total_earnings: number;
    artisan_share_pct: number;
  };
};

export type PassportData = {
  product_id: number;
  title: string;
  description: string;
  craft_type: string;
  material: string;
  retail_price: number;
  b2b_price: number;
  image_url?: string | null;
  artisan: { name: string; craft: string; state: string };
  public_url: string;
  qr_url: string;
};

export const authApi = {
  login: (username: string) =>
    api<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username }),
    }),
  me: (artisanId: number) => api<ArtisanProfile>(`/api/auth/me?artisan_id=${artisanId}`),
  profile: (
    artisanId: number,
    data: {
      full_name?: string;
      age: number;
      gender: string;
      craft_type: string;
      annual_income: number;
      state: string;
    },
  ) =>
    api<ArtisanProfile>(`/api/auth/profile?artisan_id=${artisanId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export const khataApi = {
  summary: (artisanId: number) =>
    api<KhataSummary>(`/api/khata/summary?artisan_id=${artisanId}`),
  entries: (artisanId: number) =>
    api<{ artisan_id: string; entries: KhataEntry[] }>(
      `/api/khata/entries?artisan_id=${artisanId}`,
    ),
  create: (payload: {
    artisan_id: string;
    type: string;
    amount: number;
    category: string;
    notes?: string;
  }) =>
    api<{ entry_id: string; status: string; current_balance: number; summary: string }>(
      "/api/khata/entry",
      { method: "POST", body: JSON.stringify(payload) },
    ),
};

export const schemesApi = {
  match: (artisanId: number) =>
    api<{
      artisan_id: string;
      eligible_count: number;
      eligible_schemes: Scheme[];
      needs_profile?: boolean;
      message?: string;
    }>(`/api/schemes/match?artisan_id=${artisanId}`),
  all: () => api<{ total_schemes: number; schemes: Scheme[] }>("/api/schemes/all"),
};

export const visionApi = {
  process: (file: File) => {
    const body = new FormData();
    body.append("image", file);
    return api<VisionResult>("/api/vision/process", { method: "POST", body });
  },
};

export const voiceApi = {
  listing: (payload: { language: string; image_tags?: Record<string, string> }) =>
    api<ListingResult>("/api/voice/listing", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listingUpload: (file: File, language: string, imageTags: Record<string, string>) => {
    const body = new FormData();
    body.append("audio", file);
    body.append("language", language);
    body.append("image_tags", JSON.stringify(imageTags));
    return api<ListingResult>("/api/voice/listing/upload", { method: "POST", body });
  },
};

export const pricingApi = {
  calculate: (payload: {
    material_cost: number;
    labour_hours: number;
    hourly_wage: number;
    craft_type: string;
    craft_id?: string;
  }) =>
    api<PricingResult>("/api/pricing/calculate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export type GuideSpeak = {
  lang: string;
  key: string;
  text: string;
  audio_url?: string | null;
  cached?: boolean;
  use_browser_tts?: boolean;
  tts_lang?: string;
  reason?: string;
};

export const passportApi = {
  data: (productId: number) => api<PassportData>(`/api/passport/${productId}/data`),
  htmlPath: (productId: number) => `/api/passport/${productId}`,
  create: (payload: {
    artisan_id: number;
    title: string;
    description: string;
    retail_price?: number;
    b2b_price?: number;
    craft_type?: string;
    material?: string;
    image_url?: string | null;
  }) =>
    api<{ product_id: number; public_url: string; qr_url: string }>("/api/passport/create", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const guideApi = {
  prompt: (lang: string, key: string) =>
    api<GuideSpeak>(`/api/guide/prompt/${lang}/${key}`),
  speak: (lang: string, key: string) =>
    api<GuideSpeak>(`/api/guide/prompt/${lang}/${key}/speak`, { method: "POST" }),
  prefetch: (lang: string) =>
    api<{ lang: string; prompts: GuideSpeak[] }>(`/api/guide/prefetch/${lang}`, {
      method: "POST",
    }),
};
