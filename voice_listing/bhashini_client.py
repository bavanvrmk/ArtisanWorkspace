"""
Bhashini API Client
===================
Wraps the ULCA/Bhashini pipeline for:
  - ASR   (Speech-to-Text)
  - NMT   (Translation)
  - TTS   (Text-to-Speech)

Two-step flow for every call:
  1. Pipeline Config  → fetch serviceIds + inference endpoint + auth key
  2. Pipeline Compute → send data, get result
"""

import base64
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── Bhashini constants ──────────────────────────────────────────────
CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"
DEFAULT_PIPELINE_ID = os.getenv("BHASHINI_PIPELINE_ID", "64392f96daac500b55c543cd")


class BhashiniClient:
    """Thin wrapper around the Bhashini/ULCA pipeline APIs."""

    def __init__(self, user_id: str = None, api_key: str = None):
        self.user_id = user_id or os.getenv("BHASHINI_USER_ID", "")
        self.api_key = api_key or os.getenv("BHASHINI_API_KEY", "")
        if not self.user_id or not self.api_key:
            raise ValueError(
                "BHASHINI_USER_ID and BHASHINI_API_KEY must be set in .env "
                "or passed as arguments."
            )

    # ── Step 1: Pipeline Config ──────────────────────────────────────
    def _configure_pipeline(self, tasks: list[dict]) -> dict:
        """
        Call the Pipeline Config endpoint to get serviceIds,
        the inference endpoint URL, and the auth key/value pair.

        Parameters
        ----------
        tasks : list[dict]
            e.g. [{"taskType": "asr", "config": {"language": {"sourceLanguage": "hi"}}}]

        Returns
        -------
        dict with keys:
            service_ids : dict mapping taskType → serviceId
            inference_url : str
            auth_key : str
            auth_value : str
        """
        payload = {
            "pipelineTasks": tasks,
            "pipelineRequestConfig": {
                "pipelineId": DEFAULT_PIPELINE_ID,
            },
        }
        headers = {
            "Content-Type": "application/json",
            "userID": self.user_id,
            "ulcaApiKey": self.api_key,
        }

        resp = requests.post(CONFIG_URL, json=payload, headers=headers, timeout=30)
        if not resp.ok:
            print(f"[ERROR] Pipeline Config failed (HTTP {resp.status_code}):")
            print(f"  URL: {CONFIG_URL}")
            print(f"  userID: {self.user_id}")
            print(f"  Response: {resp.text[:500]}")
            resp.raise_for_status()
        data = resp.json()

        # Extract service IDs from pipelineResponseConfig
        service_ids = {}
        for task_config in data.get("pipelineResponseConfig", []):
            task_type = task_config.get("taskType", "")
            config_list = task_config.get("config", [])
            # Find the specific serviceId for our language, or fallback to first
            if config_list:
                # If we passed a specific language, try to match it
                requested_lang = None
                for t in tasks:
                    if t.get("taskType") == task_type:
                        lang_conf = t.get("config", {}).get("language", {})
                        requested_lang = lang_conf.get("sourceLanguage") or lang_conf.get("targetLanguage")
                        break
                
                selected_service_id = config_list[0].get("serviceId", "")
                if requested_lang:
                    for c in config_list:
                        lang_block = c.get("language", {})
                        if lang_block.get("sourceLanguage") == requested_lang or lang_block.get("targetLanguage") == requested_lang:
                            selected_service_id = c.get("serviceId", "")
                            break
                
                service_ids[task_type] = selected_service_id

        # Extract inference endpoint and auth
        endpoint_info = data.get("pipelineInferenceAPIEndPoint", {})
        inference_url = endpoint_info.get("callbackUrl", "")
        inference_key = endpoint_info.get("inferenceApiKey", {})
        auth_key = inference_key.get("name", "Authorization")
        auth_value = inference_key.get("value", "")

        return {
            "service_ids": service_ids,
            "inference_url": inference_url,
            "auth_key": auth_key,
            "auth_value": auth_value,
        }

    # ── Step 2: Pipeline Compute ─────────────────────────────────────
    def _compute(self, config: dict, pipeline_tasks: list, input_data: dict) -> dict:
        """
        Send a compute request to the inference endpoint.

        Parameters
        ----------
        config : dict from _configure_pipeline
        pipeline_tasks : list of task dicts with serviceId filled in
        input_data : dict with 'audio' or 'input' key

        Returns
        -------
        dict — raw JSON response from the inference API
        """
        headers = {
            "Content-Type": "application/json",
            config["auth_key"]: config["auth_value"],
        }
        payload = {
            "pipelineTasks": pipeline_tasks,
            "inputData": input_data,
        }

        resp = requests.post(
            config["inference_url"], json=payload, headers=headers, timeout=60
        )
        if not resp.ok:
            print(f"[ERROR] Pipeline Compute failed (HTTP {resp.status_code}):")
            print(f"  URL: {config['inference_url']}")
            print(f"  Response: {resp.text[:500]}")
            resp.raise_for_status()
        return resp.json()

    # ── Public methods ───────────────────────────────────────────────

    def speech_to_text(self, audio_path: str, source_lang: str = "hi") -> str:
        """
        Transcribe an audio file to text using Bhashini ASR.

        Parameters
        ----------
        audio_path : str — path to audio file (wav, mp3, etc.)
        source_lang : str — ISO-639 language code (e.g. 'hi', 'ta', 'te')

        Returns
        -------
        str — transcribed text
        """
        ext = Path(audio_path).suffix.lower()
        if ext not in [".wav", ".mp3", ".flac", ".pcm"]:
            raise ValueError(f"Unsupported audio format '{ext}'. Bhashini ASR expects .wav, .mp3, or .flac")

        config = self._configure_pipeline([
            {"taskType": "asr", "config": {"language": {"sourceLanguage": source_lang}}}
        ])
        service_id = config["service_ids"].get("asr", "")

        audio_bytes = Path(audio_path).read_bytes()
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        tasks = [
            {
                "taskType": "asr",
                "config": {
                    "language": {"sourceLanguage": source_lang},
                    "serviceId": service_id,
                },
            }
        ]
        input_data = {"audio": [{"audioContent": audio_b64}]}

        result = self._compute(config, tasks, input_data)

        # Extract transcript from pipelineResponse
        try:
            return result["pipelineResponse"][0]["output"][0]["source"]
        except (KeyError, IndexError):
            return ""

    def translate(
        self, text: str, source_lang: str = "hi", target_lang: str = "en"
    ) -> str:
        """
        Translate text from source language to target language.

        Parameters
        ----------
        text : str — text to translate
        source_lang : str — ISO-639 source language code
        target_lang : str — ISO-639 target language code

        Returns
        -------
        str — translated text
        """
        config = self._configure_pipeline([
            {"taskType": "translation", "config": {"language": {"sourceLanguage": source_lang, "targetLanguage": target_lang}}}
        ])
        service_id = config["service_ids"].get("translation", "")

        tasks = [
            {
                "taskType": "translation",
                "config": {
                    "language": {
                        "sourceLanguage": source_lang,
                        "targetLanguage": target_lang,
                    },
                    "serviceId": service_id,
                },
            }
        ]
        input_data = {"input": [{"source": text}]}

        result = self._compute(config, tasks, input_data)

        try:
            return result["pipelineResponse"][0]["output"][0]["target"]
        except (KeyError, IndexError):
            return ""

    def text_to_speech(
        self, text: str, lang: str = "hi", output_path: str = "output.wav"
    ) -> str:
        """
        Convert text to speech audio using Bhashini TTS.

        Parameters
        ----------
        text : str — text to speak
        lang : str — ISO-639 language code
        output_path : str — where to save the audio file

        Returns
        -------
        str — path to the saved audio file
        """
        config = self._configure_pipeline([
            {"taskType": "tts", "config": {"language": {"sourceLanguage": lang}}}
        ])
        service_id = config["service_ids"].get("tts", "")

        tasks = [
            {
                "taskType": "tts",
                "config": {
                    "language": {"sourceLanguage": lang},
                    "serviceId": service_id,
                    "gender": "female",
                },
            }
        ]
        input_data = {"input": [{"source": text}]}

        result = self._compute(config, tasks, input_data)

        try:
            audio_b64 = result["pipelineResponse"][0]["audio"][0]["audioContent"]
            audio_bytes = base64.b64decode(audio_b64)
            out = Path(output_path)
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_bytes(audio_bytes)
            return str(out.resolve())
        except (KeyError, IndexError) as e:
            raise RuntimeError(f"TTS failed: no audio in response. {e}")

    def speech_to_text_and_translate(
        self,
        audio_path: str,
        source_lang: str = "hi",
        target_lang: str = "en",
    ) -> dict:
        """
        Chain ASR + Translation in a single pipeline call.

        Parameters
        ----------
        audio_path : str — path to audio file
        source_lang : str — language of the audio
        target_lang : str — language to translate into

        Returns
        -------
        dict with keys 'transcript' and 'translated_text'
        """
        config = self._configure_pipeline([
            {"taskType": "asr", "config": {"language": {"sourceLanguage": source_lang}}},
            {"taskType": "translation", "config": {"language": {"sourceLanguage": source_lang, "targetLanguage": target_lang}}}
        ])
        asr_service = config["service_ids"].get("asr", "")
        nmt_service = config["service_ids"].get("translation", "")

        audio_bytes = Path(audio_path).read_bytes()
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        tasks = [
            {
                "taskType": "asr",
                "config": {
                    "language": {"sourceLanguage": source_lang},
                    "serviceId": asr_service,
                },
            },
            {
                "taskType": "translation",
                "config": {
                    "language": {
                        "sourceLanguage": source_lang,
                        "targetLanguage": target_lang,
                    },
                    "serviceId": nmt_service,
                },
            },
        ]
        input_data = {"audio": [{"audioContent": audio_b64}]}

        result = self._compute(config, tasks, input_data)

        transcript = ""
        translated = ""
        try:
            responses = result.get("pipelineResponse", [])
            # ASR output
            if len(responses) > 0:
                transcript = responses[0]["output"][0]["source"]
            # NMT output
            if len(responses) > 1:
                translated = responses[1]["output"][0]["target"]
        except (KeyError, IndexError):
            pass

        return {"transcript": transcript, "translated_text": translated}
