from __future__ import annotations

import os
from pathlib import Path


def list_desktop(path: str) -> str:
    p = Path(path).expanduser()
    if not p.exists():
        return f"Desktop path not found: {p}"
    entries = []
    try:
        for child in sorted(p.iterdir(), key=lambda c: (not c.is_dir(), c.name.lower())):
            kind = "dir " if child.is_dir() else "file"
            size = ""
            if child.is_file():
                try:
                    size = f"  ({child.stat().st_size} bytes)"
                except OSError:
                    size = ""
            entries.append(f"  [{kind}] {child.name}{size}")
    except PermissionError:
        return f"Permission denied reading desktop: {p}"
    header = f"Desktop access enabled → {p}\nItems ({len(entries)}):"
    return header + ("\n" + "\n".join(entries) if entries else "\n  (empty)")


def resolve_desktop_default() -> str:
    home = Path.home()
    # Windows / macOS / Linux common
    for candidate in (home / "Desktop", home / "OneDrive" / "Desktop"):
        if candidate.exists():
            return str(candidate)
    return str(home / "Desktop")
