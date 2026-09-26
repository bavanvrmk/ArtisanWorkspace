export async function toWav(file: File): Promise<File> {
  if (file.type.includes("wav") || file.name.toLowerCase().endsWith(".wav")) {
    return file;
  }
  const buffer = await file.arrayBuffer();
  const ctx = new AudioContext();
  const audio = await ctx.decodeAudioData(buffer.slice(0));
  const channel = audio.getChannelData(0);
  const rate = audio.sampleRate;
  const pcm = new Int16Array(channel.length);
  for (let i = 0; i < channel.length; i += 1) {
    const s = Math.max(-1, Math.min(1, channel[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, pcm.byteLength, true);
  await ctx.close();
  return new File([header, pcm], "recording.wav", { type: "audio/wav" });
}

const BROWSER_LANG: Record<string, string> = {
  as: "as-IN",
  bn: "bn-IN",
  en: "en-IN",
  gu: "gu-IN",
  hi: "hi-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  mr: "mr-IN",
  ne: "ne-NP",
  or: "or-IN",
  pa: "pa-IN",
  sa: "sa-IN",
  ta: "ta-IN",
  te: "te-IN",
  ur: "ur-IN",
};

export function speakBrowser(text: string, lang: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = BROWSER_LANG[lang] || "hi-IN";
  window.speechSynthesis.speak(utter);
}
