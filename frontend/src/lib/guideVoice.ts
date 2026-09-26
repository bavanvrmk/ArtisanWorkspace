import { guideApi, mediaUrl } from "../api/client";
import { speakBrowser } from "./audio";

let current: HTMLAudioElement | null = null;

export async function playGuide(lang: string, key: string) {
  const data = await guideApi.speak(lang, key);
  if (current) {
    current.pause();
    current = null;
  }
  if (data.audio_url) {
    const audio = new Audio(mediaUrl(data.audio_url));
    current = audio;
    try {
      await audio.play();
    } catch {
      speakBrowser(data.text, lang);
    }
    return data;
  }
  speakBrowser(data.text, lang);
  return data;
}

export function stopGuide() {
  current?.pause();
  current = null;
  window.speechSynthesis?.cancel();
}
