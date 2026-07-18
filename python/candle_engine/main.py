#!/usr/bin/env python3
"""Candle AI Python engine entrypoint."""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tools.desktop import list_desktop  # noqa: E402
from tools.search import search  # noqa: E402
from tools.image_gen import generate_image  # noqa: E402
from tools.elevenlabs_mcp import tts, configure  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(prog="candle-engine")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_search = sub.add_parser("search")
    p_search.add_argument("--provider", default="duckduckgo")
    p_search.add_argument("--query", required=True)

    p_desk = sub.add_parser("desktop")
    p_desk.add_argument("--path", required=True)

    p_img = sub.add_parser("image")
    p_img.add_argument("--prompt", required=True)

    p_el = sub.add_parser("elevenlabs")
    el_sub = p_el.add_subparsers(dest="el_cmd", required=True)
    p_tts = el_sub.add_parser("tts")
    p_tts.add_argument("--text", required=True)
    el_sub.add_parser("status")

    args = parser.parse_args()
    stdin_data = None
    if not sys.stdin.isatty():
        raw = sys.stdin.read().strip()
        if raw:
            try:
                stdin_data = json.loads(raw)
            except json.JSONDecodeError:
                stdin_data = {"raw": raw}

    if args.cmd == "search":
        print(search(args.query, args.provider))
        return 0
    if args.cmd == "desktop":
        print(list_desktop(args.path))
        return 0
    if args.cmd == "image":
        print(generate_image(args.prompt))
        return 0
    if args.cmd == "elevenlabs":
        api_key = (stdin_data or {}).get("apiKey") or os.environ.get("ELEVENLABS_API_KEY", "")
        if args.el_cmd == "tts":
            print(tts(args.text, api_key))
            return 0
        if args.el_cmd == "status":
            print(configure(api_key))
            return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
