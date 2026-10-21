#!/usr/bin/env python3
"""Turn a Telegram Desktop chat export (result.json) into readable digest files.

Claude uses this when moving the old Telegram group into MESH:
  python3 -I tools/telegram_digest.py path/to/result.json out/telegram-digest

It writes digest-01.md, digest-02.md, ... (about 40,000 characters each),
oldest first. Each entry keeps the date, the sender, the text with its links,
and the names of any attached files. Short chatter ("jazakAllah khair",
"ameen", stickers) and service messages are left out so the useful posts
stand out. Nothing is published; the digest is only raw material for writing
guides.

Standard library only.
"""
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

CHUNK = 40_000
MIN_CHARS = 40          # shorter messages are dropped unless they carry a link or a file
MERGE_MINUTES = 10      # same sender within this window = one entry


def text_of(msg):
    """Plain text with links written out, from text_entities (or text)."""
    parts = msg.get("text_entities")
    if parts is None:
        raw = msg.get("text", "")
        parts = raw if isinstance(raw, list) else [{"type": "plain", "text": raw}]
    out, links = [], []
    for p in parts:
        if isinstance(p, str):
            out.append(p)
            continue
        t, txt = p.get("type"), p.get("text", "")
        if t == "text_link" and p.get("href"):
            out.append(f"[{txt}]({p['href']})")
            links.append(p["href"])
        elif t == "link":
            out.append(txt)
            links.append(txt)
        else:
            out.append(txt)
    return "".join(out).strip(), links


def attachments(msg):
    names = []
    for key in ("photo", "file"):
        v = msg.get(key)
        if v and isinstance(v, str):
            names.append(Path(v).name)
    if msg.get("media_type") == "sticker":
        return ["(sticker)"]
    return names


def main():
    if len(sys.argv) != 3:
        sys.exit("Usage: python3 -I tools/telegram_digest.py result.json out-folder")
    src, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    data = json.loads(src.read_text(encoding="utf-8"))
    messages = data.get("messages", [])
    by_id = {m.get("id"): m for m in messages}

    entries = []
    kept = dropped = 0
    for m in messages:
        if m.get("type") != "message":
            dropped += 1
            continue
        body, links = text_of(m)
        files = attachments(m)
        if files == ["(sticker)"]:
            dropped += 1
            continue
        if len(body) < MIN_CHARS and not links and not files:
            dropped += 1
            continue
        when = datetime.fromisoformat(m["date"])
        sender = m.get("from") or m.get("author") or "Unknown"
        note = []
        if m.get("forwarded_from"):
            note.append(f"forwarded from {m['forwarded_from']}")
        if m.get("reply_to_message_id") in by_id:
            parent, _ = text_of(by_id[m["reply_to_message_id"]])
            if parent:
                note.append("reply to: " + parent[:120].replace("\n", " ") + ("…" if len(parent) > 120 else ""))
        last = entries[-1] if entries else None
        if last and last["sender"] == sender and when - last["end"] <= timedelta(minutes=MERGE_MINUTES) and not note:
            last["body"] = "\n\n".join(x for x in (last["body"], body) if x)
            last["files"] += files
            last["end"] = when
            last["ids"].append(m["id"])
        else:
            entries.append({"start": when, "end": when, "sender": sender, "body": body,
                            "files": files, "note": note, "ids": [m["id"]]})
        kept += 1

    out_dir.mkdir(parents=True, exist_ok=True)
    chunks, cur = [], ""
    for e in entries:
        head = f"### {e['start']:%Y-%m-%d %H:%M} · {e['sender']} · msg {e['ids'][0]}"
        lines = [head]
        if e["note"]:
            lines.append("_" + "; ".join(e["note"]) + "_")
        if e["body"]:
            lines.append(e["body"])
        if e["files"]:
            lines.append("Files: " + ", ".join(e["files"]))
        block = "\n".join(lines) + "\n\n"
        if len(cur) + len(block) > CHUNK and cur:
            chunks.append(cur)
            cur = ""
        cur += block
    if cur:
        chunks.append(cur)

    name = data.get("name", "Telegram chat")
    for i, c in enumerate(chunks, 1):
        header = f"# {name}: digest part {i} of {len(chunks)}\n\n"
        (out_dir / f"digest-{i:02d}.md").write_text(header + c, encoding="utf-8")
    print(f"{kept} messages kept as {len(entries)} entries in {len(chunks)} file(s); {dropped} left out. Written to {out_dir}/")


if __name__ == "__main__":
    main()
