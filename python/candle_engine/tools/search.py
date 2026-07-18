from __future__ import annotations

import json
import urllib.parse
import urllib.request
from html.parser import HTMLParser


class _DDGParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.results: list[str] = []
        self._capture = False
        self._buf = ""

    def handle_starttag(self, tag, attrs):
        attrs_d = dict(attrs)
        if tag == "a" and "result__a" in attrs_d.get("class", ""):
            self._capture = True
            self._buf = ""

    def handle_endtag(self, tag):
        if tag == "a" and self._capture:
            self._capture = False
            text = " ".join(self._buf.split())
            if text:
                self.results.append(text)

    def handle_data(self, data):
        if self._capture:
            self._buf += data


def search(query: str, provider: str = "duckduckgo") -> str:
    provider = (provider or "duckduckgo").lower()
    if provider in {"duckduckgo", "parallel-free"}:
        return _duckduckgo(query)
    if provider in {"parallel", "tavily", "brave", "bing", "serper", "google-gemini"}:
        # Provider-specific keys can be wired via env later; graceful fallback
        base = _duckduckgo(query)
        return f"[{provider}] falling back to DuckDuckGo free search\n{base}"
    return _duckduckgo(query)


def _duckduckgo(query: str) -> str:
    url = "https://html.duckduckgo.com/html/?" + urllib.parse.urlencode({"q": query})
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "CandleAI/1.0 (+https://github.com/Mcalrifle789/Candle-AI)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
        parser = _DDGParser()
        parser.feed(html)
        lines = [f'Search results for "{query}":']
        for i, title in enumerate(parser.results[:8], 1):
            lines.append(f"{i}. {title}")
        if len(lines) == 1:
            lines.append("(No structured results parsed — try refining the query.)")
        return "\n".join(lines)
    except Exception as exc:  # noqa: BLE001
        return f'Search failed for "{query}": {exc}'
