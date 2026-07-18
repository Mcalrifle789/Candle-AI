"""ElevenLabs MCP bridge for Candle AI."""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parents[3] / "sessions" / "audio"


def configure(api_key: str) -> str:
    if not api_key:
        return json.dumps({"enabled": False, "reason": "missing api key"})
    return json.dumps(
        {
            "enabled": True,
            "provider": "elevenlabs",
            "mcp": True,
            "models": ["eleven_multilingual_v2", "eleven_turbo_v2_5", "eleven_v3"],
            "note": "Candle AI may use ElevenLabs models and agents when key is present.",
        }
    )


def tts(text: str, api_key: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> str:
    if not api_key:
        return "ElevenLabs API key missing."
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / "candle-tts.mp3"
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload = json.dumps(
        {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.4, "similarity_boost": 0.8},
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            out.write_bytes(resp.read())
        return f"ElevenLabs TTS saved → {out}"
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        return f"ElevenLabs HTTP {exc.code}: {body[:400]}"
    except Exception as exc:  # noqa: BLE001
        return f"ElevenLabs error: {exc}"
