from __future__ import annotations

import json
import html
from datetime import datetime, timezone
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parents[3] / "sessions" / "generated-images"


def generate_image(prompt: str) -> str:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    meta_path = OUT_DIR / f"image-{stamp}.json"
    meta = {
        "prompt": prompt,
        "createdAt": stamp,
        "status": "queued-local",
        "note": "Wire OpenAI/Gemini/Grok image endpoints via provider keys for full generation.",
    }
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    svg = OUT_DIR / f"image-{stamp}.svg"
    safe = html.escape(prompt[:120])
    svg.write_text(
        f"""<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="576">
  <defs>
    <linearGradient id="g" x1="0" x2="1">
      <stop offset="0%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#00E5FF"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="#0a0a0a"/>
  <text x="50%" y="45%" fill="url(#g)" font-size="42" text-anchor="middle" font-family="Georgia">Candle AI</text>
  <text x="50%" y="58%" fill="#ccc" font-size="20" text-anchor="middle" font-family="sans-serif">{safe}</text>
</svg>
""",
        encoding="utf-8",
    )
    return f"Image artifact created:\n- {svg}\n- {meta_path}\nPrompt: {prompt}"
